import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { sendBrowserNotification, requestNotificationPermission } from '../utils/notifications';

const MoviesContext = createContext();

export function MoviesProvider({ children, listCode }) {
    const [movies, setMovies] = useState([]);

    const fetchMovies = async () => {
        try {
            const res = await api.get('/lists/' + listCode + '/movies');
            setMovies(res.data);
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
        await api.post('/lists/' + listCode + '/movies', movieData);
        fetchMovies();
    };

    const toggleWatched = async (movieId) => {
        await api.put('/lists/movies/' + movieId + '/toggle-watched');
        fetchMovies();
    };

    const deleteMovie = async (movieId) => {
        await api.delete('/lists/movies/' + movieId);
        fetchMovies();
    };

    return (
        <MoviesContext.Provider value={{ movies, addMovie, toggleWatched, deleteMovie, fetchMovies }}>
            {children}
        </MoviesContext.Provider>
    );
}

export const useMovies = () => useContext(MoviesContext);
