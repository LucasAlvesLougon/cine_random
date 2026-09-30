import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { sendBrowserNotification, requestNotificationPermission } from '../utils/notifications';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getUserCacheKey } from '../utils/storage';
import { getReconnectDelay, MAX_RECONNECT_ATTEMPTS } from '../utils/reconnect';

const MoviesContext = createContext();

export function MoviesProvider({ children, listCode }) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { addToast } = useToast();
    const queryKey = useMemo(() => ['movies', listCode, user?.id], [listCode, user?.id]);
    const movieCacheKey = user?.id && listCode
        ? getUserCacheKey(`cached_movies_${listCode}`, user.id)
        : null;

    const {
        data: moviePages,
        refetch: fetchMovies,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        error: moviesError,
    } = useInfiniteQuery({
        queryKey,
        queryFn: async ({ pageParam }) => {
            const token = localStorage.getItem('access_token');
            if (!token || !listCode) return { items: [], total: 0, page: pageParam, page_size: 50, has_next: false };
            try {
                const res = await api.get('/lists/' + listCode + '/movies', {
                    params: { page: pageParam, page_size: 50 },
                });
                return Array.isArray(res.data)
                    ? { items: res.data, total: res.data.length, page: pageParam, page_size: 50, has_next: false }
                    : res.data;
            } catch (err) {
                if (err.response?.status === 404) {
                    throw err;
                }
                const cached = movieCacheKey && localStorage.getItem(movieCacheKey);
                const items = cached ? JSON.parse(cached) : [];
                return { items, total: items.length, page: pageParam, page_size: 50, has_next: false };
            }
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.has_next ? lastPage.page + 1 : undefined,
        initialData: () => {
            try {
                const cached = movieCacheKey && localStorage.getItem(movieCacheKey);
                if (!cached) return undefined;
                const items = JSON.parse(cached);
                return {
                    pages: [{ items, total: items.length, page: 1, page_size: 50, has_next: false }],
                    pageParams: [1],
                };
            } catch {
                return undefined;
            }
        },
        // Mostra o cache imediatamente, mas não o trata como dado fresco:
        // a lista é revalidada em segundo plano ao abrir uma sessão.
        initialDataUpdatedAt: 0,
        enabled: Boolean(listCode && user?.id),
    });

    const movies = useMemo(() => {
        const seen = new Set();
        return (moviePages?.pages || []).flatMap(page => page.items || []).filter(movie => {
            if (seen.has(movie.id)) return false;
            seen.add(movie.id);
            return true;
        });
    }, [moviePages]);
    const totalMovies = moviePages?.pages?.[0]?.total ?? movies.length;

    const getAllMoviesForDraw = useCallback(async () => {
        const refreshed = await fetchMovies();
        if (refreshed.error) throw refreshed.error;
        let data = refreshed.data;
        while (data?.pages?.at(-1)?.has_next) {
            const previousPageCount = data.pages.length;
            const next = await fetchNextPage();
            if (next.error) throw next.error;
            data = next.data;
            if (!data || data.pages.length <= previousPageCount) {
                throw new Error('Não foi possível carregar a lista completa para o sorteio.');
            }
        }
        const seen = new Set();
        return (data?.pages || []).flatMap(page => page.items || []).filter(movie => {
            if (seen.has(movie.id)) return false;
            seen.add(movie.id);
            return true;
        });
    }, [fetchMovies, fetchNextPage]);

    const updateMoviePages = useCallback((updateItems, firstPageOnly = false, totalDelta = 0) => {
        queryClient.setQueryData(queryKey, current => {
            if (!current?.pages) return current;
            return {
                ...current,
                pages: current.pages.map((page, index) => (
                    firstPageOnly && index > 0
                        ? page
                        : { ...page, items: updateItems(page.items || []), total: Math.max(0, (page.total ?? 0) + totalDelta) }
                )),
            };
        });
    }, [queryClient, queryKey]);

    useEffect(() => {
        if (!movieCacheKey || !moviePages) return;
        let idleId;
        let timeoutId;
        const persist = () => {
            try {
                const cachedMovies = moviePages.pages.flatMap(page => page.items || []);
                localStorage.setItem(movieCacheKey, JSON.stringify(cachedMovies));
            } catch (error) {
                console.error('Erro ao salvar cache de filmes:', error);
            }
        };

        // JSON.stringify + localStorage são síncronos; adie a persistência para
        // que o feedback visual das ações seja pintado primeiro.
        if ('requestIdleCallback' in window) {
            idleId = window.requestIdleCallback(persist, { timeout: 500 });
        } else {
            timeoutId = window.setTimeout(persist, 0);
        }

        return () => {
            if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
            if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        };
    }, [movieCacheKey, moviePages]);

    useEffect(() => {
        if (!moviesError) return;
        addToast(
            moviesError.response?.status === 404
                ? 'Esta lista não existe mais ou você não tem acesso a ela.'
                : 'Não foi possível carregar os filmes. Tente novamente.',
            'error'
        );
    }, [moviesError, addToast]);

    useEffect(() => {
        const token = localStorage.getItem('access_token');

        // Solicita permissão de notificações discretamente
        requestNotificationPermission();
        
        // Conexão WebSocket autenticada para receber atualizações em tempo real
        let ws = null;
        let reconnectTimer = null;
        let reconnectAttempt = 0;
        let cancelled = false;

        const scheduleReconnect = () => {
            if (cancelled || reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
                if (!cancelled) addToast('A sincronização em tempo real está indisponível no momento.', 'error');
                return;
            }
            const delay = getReconnectDelay(reconnectAttempt);
            reconnectAttempt += 1;
            reconnectTimer = window.setTimeout(connect, delay);
        };

        const connect = async () => {
            if (!token || !listCode || !user?.id) return;
            try {
                const ticketResponse = await api.post(`/lists/${listCode}/ws-ticket`);
                if (cancelled) return;
                const wsBase = api.defaults.baseURL.replace(/^http/, 'ws');
                const wsUrl = `${wsBase}/lists/ws/${listCode}?ticket=${encodeURIComponent(ticketResponse.data.ticket)}`;
                ws = new WebSocket(wsUrl);

                ws.onopen = () => {
                    reconnectAttempt = 0;
                };
                ws.onmessage = (event) => {
                    if (event.data === 'refresh') {
                        sendBrowserNotification('🍿 Cine Random', {
                            body: 'A lista foi atualizada com novidades pela turma!'
                        });
                        queryClient.invalidateQueries({ queryKey });
                    }
                };
                ws.onerror = () => ws.close();
                ws.onclose = () => {
                    if (!cancelled) scheduleReconnect();
                };
            } catch {
                scheduleReconnect();
            }
        };
        connect();

        return () => {
            cancelled = true;
            if (reconnectTimer) window.clearTimeout(reconnectTimer);
            if (ws && ws.readyState !== WebSocket.CLOSED) {
                ws.close();
            }
        };
    }, [listCode, queryClient, queryKey, user?.id, addToast]);

    const addMovie = useCallback(async (movieData) => {
        try {
            const res = await api.post('/lists/' + listCode + '/movies', movieData);
            if (res.data && res.data.id) {
                updateMoviePages(items => [res.data, ...items.filter(movie => movie.id !== res.data.id)], true, 1);
            }
            addToast('Filme adicionado à lista.', 'success');
        } catch (err) {
            queryClient.invalidateQueries({ queryKey });
            addToast(err.response?.data?.detail || 'Não foi possível adicionar o filme.', 'error');
            throw err;
        }
    }, [addToast, listCode, queryClient, queryKey, updateMoviePages]);

    const toggleWatched = useCallback(async (movieId) => {
        const previousMovies = queryClient.getQueryData(queryKey);
        // Optimistic UI: atualização instantânea no cache do React Query
        updateMoviePages(items => items.map(movie =>
            movie.id === movieId ? { ...movie, watched: !movie.watched } : movie
        ));
        try {
            await api.put('/lists/movies/' + movieId + '/toggle-watched');
        } catch (err) {
            // Reverte em caso de falha de rede
            queryClient.setQueryData(queryKey, previousMovies);
            addToast(err.response?.data?.detail || 'Não foi possível atualizar o filme.', 'error');
        }
    }, [addToast, queryClient, queryKey, updateMoviePages]);

    const deleteMovie = useCallback(async (movieId) => {
        const previousMovies = queryClient.getQueryData(queryKey);
        // Optimistic UI: remoção instantânea no cache do React Query
        updateMoviePages(items => items.filter(movie => movie.id !== movieId), false, -1);
        try {
            await api.delete('/lists/movies/' + movieId);
        } catch (err) {
            // Reverte em caso de falha de rede
            queryClient.setQueryData(queryKey, previousMovies);
            addToast(err.response?.data?.detail || 'Não foi possível excluir o filme.', 'error');
        }
    }, [addToast, queryClient, queryKey, updateMoviePages]);

    const contextValue = useMemo(() => ({
        movies,
        totalMovies,
        getAllMoviesForDraw,
        addMovie,
        toggleWatched,
        deleteMovie,
        fetchMovies,
        loadMoreMovies: fetchNextPage,
        hasMoreMovies: Boolean(hasNextPage),
        isLoadingMoreMovies: isFetchingNextPage,
    }), [
        movies,
        totalMovies,
        getAllMoviesForDraw,
        addMovie,
        toggleWatched,
        deleteMovie,
        fetchMovies,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    ]);

    return (
        <MoviesContext.Provider value={contextValue}>
            {children}
        </MoviesContext.Provider>
    );
}

export const useMovies = () => useContext(MoviesContext);
