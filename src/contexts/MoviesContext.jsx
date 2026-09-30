import { createContext, useContext, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { sendBrowserNotification, requestNotificationPermission } from '../utils/notifications';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getUserCacheKey } from '../utils/storage';

const MoviesContext = createContext();

export function MoviesProvider({ children, listCode }) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { addToast } = useToast();
    const queryKey = useMemo(() => ['movies', listCode, user?.id], [listCode, user?.id]);
    const movieCacheKey = user?.id && listCode
        ? getUserCacheKey(`cached_movies_${listCode}`, user.id)
        : null;

    const { data: movies = [], refetch: fetchMovies, error: moviesError } = useQuery({
        queryKey,
        queryFn: async () => {
            const token = localStorage.getItem('access_token');
            if (!token || !listCode) return [];
            try {
                const res = await api.get('/lists/' + listCode + '/movies');
                try {
                    if (movieCacheKey) localStorage.setItem(movieCacheKey, JSON.stringify(res.data));
                } catch (e) { console.error(e); }
                return res.data;
            } catch (err) {
                if (err.response?.status === 404) {
                    throw err;
                }
                const cached = movieCacheKey && localStorage.getItem(movieCacheKey);
                return cached ? JSON.parse(cached) : [];
            }
        },
        initialData: () => {
            try {
                const cached = movieCacheKey && localStorage.getItem(movieCacheKey);
                return cached ? JSON.parse(cached) : [];
            } catch {
                return [];
            }
        },
        enabled: Boolean(listCode && user?.id),
    });

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
        let cancelled = false;
        const connect = async () => {
            if (!token || !listCode || !user?.id) return;
            try {
                const ticketResponse = await api.post(`/lists/${listCode}/ws-ticket`);
                if (cancelled) return;
                const wsBase = api.defaults.baseURL.replace(/^http/, 'ws');
                const wsUrl = `${wsBase}/lists/ws/${listCode}?ticket=${encodeURIComponent(ticketResponse.data.ticket)}`;
                ws = new WebSocket(wsUrl);

                ws.onmessage = (event) => {
                    if (event.data === 'refresh') {
                        sendBrowserNotification('🍿 Cine Random', {
                            body: 'A lista foi atualizada com novidades pela turma!'
                        });
                        queryClient.invalidateQueries({ queryKey });
                    }
                };
            } catch {
                if (!cancelled) {
                    addToast('A sincronização em tempo real está indisponível no momento.', 'error');
                }
            }
        };
        connect();

        return () => {
            cancelled = true;
            if (ws && ws.readyState !== WebSocket.CLOSED) {
                ws.close();
            }
        };
    }, [listCode, queryClient, queryKey, user?.id, addToast]);

    const addMovie = async (movieData) => {
        try {
            const res = await api.post('/lists/' + listCode + '/movies', movieData);
            if (res.data && res.data.id) {
                queryClient.setQueryData(queryKey, prev => [res.data, ...(prev || []).filter(m => m.id !== res.data.id)]);
            }
            queryClient.invalidateQueries({ queryKey });
            addToast('Filme adicionado à lista.', 'success');
        } catch (err) {
            queryClient.invalidateQueries({ queryKey });
            addToast(err.response?.data?.detail || 'Não foi possível adicionar o filme.', 'error');
            throw err;
        }
    };

    const toggleWatched = async (movieId) => {
        const previousMovies = queryClient.getQueryData(queryKey);
        // Optimistic UI: atualização instantânea no cache do React Query
        queryClient.setQueryData(queryKey, prev =>
            (prev || []).map(m => m.id === movieId ? { ...m, watched: !m.watched } : m)
        );
        try {
            await api.put('/lists/movies/' + movieId + '/toggle-watched');
        } catch (err) {
            // Reverte em caso de falha de rede
            queryClient.setQueryData(queryKey, previousMovies);
            addToast(err.response?.data?.detail || 'Não foi possível atualizar o filme.', 'error');
        }
    };

    const deleteMovie = async (movieId) => {
        const previousMovies = queryClient.getQueryData(queryKey);
        // Optimistic UI: remoção instantânea no cache do React Query
        queryClient.setQueryData(queryKey, prev =>
            (prev || []).filter(m => m.id !== movieId)
        );
        try {
            await api.delete('/lists/movies/' + movieId);
        } catch (err) {
            // Reverte em caso de falha de rede
            queryClient.setQueryData(queryKey, previousMovies);
            addToast(err.response?.data?.detail || 'Não foi possível excluir o filme.', 'error');
        }
    };

    return (
        <MoviesContext.Provider value={{ movies, addMovie, toggleWatched, deleteMovie, fetchMovies }}>
            {children}
        </MoviesContext.Provider>
    );
}

export const useMovies = () => useContext(MoviesContext);
