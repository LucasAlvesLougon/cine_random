import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const MoviesContext = createContext();

export function MoviesProvider({ children }) {
    const [movies, setMovies] = useState([]);
    const listCode = 'teste123';

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
        const interval = setInterval(() => {
            if (localStorage.getItem('access_token')) fetchMovies();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const addMovie = async (movieData) => {
        await api.post('/lists/' + listCode + '/movies', movieData);
        fetchMovies();
    };

    const toggleWatched = async (movieId) => {
        await api.put('/movies/' + movieId + '/toggle-watched');
        fetchMovies();
    };

    const deleteMovie = async (movieId) => {
        await api.delete('/movies/' + movieId);
        fetchMovies();
    };

    return (
        <MoviesContext.Provider value={{ movies, addMovie, toggleWatched, deleteMovie, fetchMovies }}>
            {children}
        </MoviesContext.Provider>
    );
}

export const useMovies = () => useContext(MoviesContext);
