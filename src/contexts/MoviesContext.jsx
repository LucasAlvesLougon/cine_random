import { createContext, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { sendBrowserNotification, requestNotificationPermission } from '../utils/notifications';

const MoviesContext = createContext();

export function MoviesProvider({ children, listCode }) {
    const queryClient = useQueryClient();

    const { data: movies = [], refetch: fetchMovies } = useQuery({
        queryKey: ['movies', listCode],
        queryFn: async () => {
            const token = localStorage.getItem('access_token');
            if (!token || !listCode) return [];
            try {
                const res = await api.get('/lists/' + listCode + '/movies');
                try {
                    localStorage.setItem('cached_movies_' + listCode, JSON.stringify(res.data));
                } catch (e) { console.error(e); }
                return res.data;
            } catch (err) {
                if (err.response?.status === 404) {
                    try {
                        await api.post('/lists/', { name: 'Lista Principal', code: listCode });
                        const res2 = await api.get('/lists/' + listCode + '/movies');
                        return res2.data;
                    } catch (e) { console.error(e); }
                }
                const cached = localStorage.getItem('cached_movies_' + listCode);
                return cached ? JSON.parse(cached) : [];
            }
        },
        initialData: () => {
            try {
                const cached = localStorage.getItem('cached_movies_' + listCode);
                return cached ? JSON.parse(cached) : [];
            } catch {
                return [];
            }
        },
        enabled: Boolean(listCode),
    });

    useEffect(() => {
        const token = localStorage.getItem('access_token');

        // Solicita permissão de notificações discretamente
        requestNotificationPermission();
        
        // Conexão WebSocket autenticada para receber atualizações em tempo real
        let ws = null;
        if (token && listCode) {
            const wsBase = api.defaults.baseURL.replace('http', 'ws');
            const wsUrl = `${wsBase}/lists/ws/${listCode}?token=${encodeURIComponent(token)}`;
            ws = new WebSocket(wsUrl);
            
            ws.onmessage = (event) => {
                if (event.data === 'refresh') {
                    sendBrowserNotification('🍿 Cine Random', {
                        body: 'A lista foi atualizada com novidades pela turma!'
                    });
                    queryClient.invalidateQueries({ queryKey: ['movies', listCode] });
                }
            };
        }

        return () => {
            if (ws && ws.readyState === 1) {
                ws.close();
            }
        };
    }, [listCode, queryClient]);

    const addMovie = async (movieData) => {
        try {
            const res = await api.post('/lists/' + listCode + '/movies', movieData);
            if (res.data && res.data.id) {
                queryClient.setQueryData(['movies', listCode], prev => [res.data, ...(prev || []).filter(m => m.id !== res.data.id)]);
            }
            queryClient.invalidateQueries({ queryKey: ['movies', listCode] });
        } catch (err) {
            queryClient.invalidateQueries({ queryKey: ['movies', listCode] });
            throw err;
        }
    };

    const toggleWatched = async (movieId) => {
        const previousMovies = queryClient.getQueryData(['movies', listCode]);
        // Optimistic UI: atualização instantânea no cache do React Query
        queryClient.setQueryData(['movies', listCode], prev => 
            (prev || []).map(m => m.id === movieId ? { ...m, watched: !m.watched } : m)
        );
        try {
            await api.put('/lists/movies/' + movieId + '/toggle-watched');
        } catch (err) {
            // Reverte em caso de falha de rede
            queryClient.setQueryData(['movies', listCode], previousMovies);
            console.error('Falha ao atualizar status de assistido:', err);
        }
    };

    const deleteMovie = async (movieId) => {
        const previousMovies = queryClient.getQueryData(['movies', listCode]);
        // Optimistic UI: remoção instantânea no cache do React Query
        queryClient.setQueryData(['movies', listCode], prev => 
            (prev || []).filter(m => m.id !== movieId)
        );
        try {
            await api.delete('/lists/movies/' + movieId);
        } catch (err) {
            // Reverte em caso de falha de rede
            queryClient.setQueryData(['movies', listCode], previousMovies);
            console.error('Falha ao excluir filme:', err);
        }
    };

    return (
        <MoviesContext.Provider value={{ movies, addMovie, toggleWatched, deleteMovie, fetchMovies }}>
            {children}
        </MoviesContext.Provider>
    );
}

export const useMovies = () => useContext(MoviesContext);
