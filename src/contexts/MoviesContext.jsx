import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { sendBrowserNotification, requestNotificationPermission } from '../utils/notifications';

const MoviesContext = createContext();

export function MoviesProvider({ children, listCode }) {
    const [movies, setMovies] = useState(() => {
        try {
            const cached = localStorage.getItem('cached_movies_' + listCode);
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });

    const fetchMovies = async () => {
        try {
            const res = await api.get('/lists/' + listCode + '/movies');
            setMovies(res.data);
            try {
                localStorage.setItem('cached_movies_' + listCode, JSON.stringify(res.data));
            } catch (e) { console.error(e); }
        } catch (err) {
            if (err.response?.status === 404) {
                try {
                    await api.post('/lists/', { name: 'Lista Principal', code: listCode });
                    const res2 = await api.get('/lists/' + listCode + '/movies');
                    setMovies(res2.data);
                } catch (e) { console.error(e); }
            }
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) { fetchMovies(); }

        // Solicita permissão de notificações discretamente
        requestNotificationPermission();
        
        // Conexão WebSocket para receber atualizações em tempo real
        const wsUrl = api.defaults.baseURL.replace('http', 'ws') + '/lists/ws/' + listCode;
        const ws = new WebSocket(wsUrl);
        
        ws.onmessage = (event) => {
            if (event.data === 'refresh') {
                sendBrowserNotification('🍿 Cine Random', {
                    body: 'A lista foi atualizada com novidades pela turma!'
                });
                fetchMovies();
            }
        };

        return () => {
            if (ws.readyState === 1) { // 1 is open
                ws.close();
            }
        };
    }, [listCode]);

    const addMovie = async (movieData) => {
        try {
            const res = await api.post('/lists/' + listCode + '/movies', movieData);
            if (res.data && res.data.id) {
                setMovies(prev => [res.data, ...prev.filter(m => m.id !== res.data.id)]);
            } else {
                fetchMovies();
            }
        } catch (err) {
            fetchMovies();
            throw err;
        }
    };

    const toggleWatched = async (movieId) => {
        const previousMovies = movies;
        // Optimistic UI: atualização instantânea na tela
        setMovies(prev => prev.map(m => m.id === movieId ? { ...m, watched: !m.watched } : m));
        try {
            await api.put('/lists/movies/' + movieId + '/toggle-watched');
        } catch (err) {
            // Reverte em caso de falha de rede
            setMovies(previousMovies);
            console.error('Falha ao atualizar status de assistido:', err);
        }
    };

    const deleteMovie = async (movieId) => {
        const previousMovies = movies;
        // Optimistic UI: remoção instantânea na tela
        setMovies(prev => prev.filter(m => m.id !== movieId));
        try {
            await api.delete('/lists/movies/' + movieId);
        } catch (err) {
            // Reverte em caso de falha de rede
            setMovies(previousMovies);
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
