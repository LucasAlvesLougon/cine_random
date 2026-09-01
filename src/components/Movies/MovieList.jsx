import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { MovieCard } from './MovieCard';
import { motion, AnimatePresence } from 'framer-motion';
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
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('');

    const toggleWatched = async (movieId, currentStatus) => {
        const movieRef = doc(db, 'lists', listCode, 'movies', movieId);
        await updateDoc(movieRef, { watched: !currentStatus });
    };

    const deleteMovie = async (movieId) => {
        const movieRef = doc(db, 'lists', listCode, 'movies', movieId);
        await deleteDoc(movieRef);
    };

    const availableGenres = Array.from(new Set(movies.flatMap(m => m.genres || []))).sort();

    const filteredMovies = movies.filter(movie => {
        const matchesFilter = filter === 'all' || 
                              (filter === 'watched' && movie.watched) || 
                              (filter === 'unwatched' && !movie.watched);
        const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGenre = selectedGenre === '' || (movie.genres && movie.genres.includes(selectedGenre));
        return matchesFilter && matchesSearch && matchesGenre;
    });

    return (
    <>
        <div className={styles.filterBar}>
            <input 
                type="text" 
                placeholder="Buscar filme na lista..." 
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className={styles.filterButtons}>
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
        </div>

        {availableGenres.length > 0 && (
            <div className={styles.genreBar}>
                <button 
                    className={`${styles.genreChip} ${selectedGenre === '' ? styles.genreChipActive : ''}`}
                    onClick={() => setSelectedGenre('')}
                >
                    Todos os Gêneros
                </button>
                {availableGenres.map(genre => (
                    <button 
                        key={genre}
                        className={`${styles.genreChip} ${selectedGenre === genre ? styles.genreChipActive : ''}`}
                        onClick={() => setSelectedGenre(genre)}
                    >
                        {genre}
                    </button>
                ))}
            </div>
        )}

        {filteredMovies.length === 0 ? (
            <p style={{ padding: '0 40px', color: 'var(--text-secondary)' }}>Nenhum filme encontrado para este filtro.</p>
        ) : (
            <motion.div layout className={styles.grid}>
                <AnimatePresence mode='popLayout'>
                    {filteredMovies.map(movie => (
                        <motion.div
                            key={movie.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ 
                                layout: { type: 'spring', stiffness: 120, damping: 20 },
                                opacity: { duration: 0.3 },
                                scale: { duration: 0.3 }
                            }}
                        >
                            <MovieCard
                                movie={movie}
                                onToggleWatched={toggleWatched}
                                onDelete={deleteMovie}
                                onOpenInfo={onOpenInfo}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        )}
    </>
    );
}