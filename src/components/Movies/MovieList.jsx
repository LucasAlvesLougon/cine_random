import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { MovieCard } from './MovieCard';
import styles from './MovieList.module.css';

export function MovieList({ onOpenInfo }) {
    const [movies, setMovies] = useState([]);
    const listCode = "teste123";

    useEffect(() => {
        const moviesRef = collection(db, 'lists', listCode, 'movies');
        const unsubscribe = onSnapshot(moviesRef, (snapshot) => {
            const loadedMovies = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMovies(loadedMovies);
        });
        return () => unsubscribe();
    }, []);

    const [filter, setFilter] = useState('all');

    const toggleWatched = async (movieId, currentStatus) => {
        const movieRef = doc(db, 'lists', listCode, 'movies', movieId);
        await updateDoc(movieRef, { watched: !currentStatus });
    };

    const deleteMovie = async (movieId) => {
        const movieRef = doc(db, 'lists', listCode, 'movies', movieId);
        await deleteDoc(movieRef);
    };

    const filteredMovies = movies.filter(movie => {
        if (filter === 'watched') return movie.watched;
        if (filter === 'unwatched') return !movie.watched;
        return true;
    });

    return (
    <>
        <div className={styles.filterBar}>
            <button 
                className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                onClick={() => setFilter('all')}
            >
                Todos
            </button>
            <button 
                className={`${styles.filterBtn} ${filter === 'unwatched' ? styles.active : ''}`}
                onClick={() => setFilter('unwatched')}
            >
                Para Assistir
            </button>
            <button 
                className={`${styles.filterBtn} ${filter === 'watched' ? styles.active : ''}`}
                onClick={() => setFilter('watched')}
            >
                Assistidos
            </button>
        </div>

        {filteredMovies.length === 0 ? (
            <p style={{ padding: '0 40px', color: 'var(--text-secondary)' }}>Nenhum filme encontrado para este filtro.</p>
        ) : (
            <div className={styles.grid}>
                {filteredMovies.map(movie => (
                    <MovieCard
                    key={movie.id}
                    movie={movie}
                    onToggleWatched={toggleWatched}
                    onDelete={deleteMovie}
                    onOpenInfo={onOpenInfo}
                    />
                ))}
            </div>
        )}
    </>
    );
}