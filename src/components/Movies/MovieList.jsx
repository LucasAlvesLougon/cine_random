import { useState } from 'react';
import { useMovies } from '../../contexts/MoviesContext';
import { MovieCard } from './MovieCard';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './MovieList.module.css';

export function MovieList({ onOpenInfo }) {
    const { movies, toggleWatched, deleteMovie } = useMovies();

    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('');
    const [selectedProviders, setSelectedProviders] = useState([]);

    const availableGenres = Array.from(new Set(movies.flatMap(m => m.genres || []))).sort();

    const availableProviders = Array.from(
        new Map(
            movies.flatMap(m => m.watchProviders || []).map(p => [p.name, p])
        ).values()
    ).sort((a, b) => a.name.localeCompare(b.name));

    const toggleProvider = (providerName) => {
        setSelectedProviders(prev => 
            prev.includes(providerName) 
                ? prev.filter(p => p !== providerName) 
                : [...prev, providerName]
        );
    };

    const filteredMovies = movies.filter(movie => {
        const matchesFilter = filter === 'all' || 
                              (filter === 'watched' && movie.watched) || 
                              (filter === 'unwatched' && !movie.watched);
        const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGenre = selectedGenre === '' || (movie.genres && movie.genres.includes(selectedGenre));
        const matchesProvider = selectedProviders.length === 0 || 
                              (movie.watchProviders && movie.watchProviders.some(p => selectedProviders.includes(p.name)));
        return matchesFilter && matchesSearch && matchesGenre && matchesProvider;
    }).sort((a, b) => b.id - a.id);

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

        {availableProviders.length > 0 && (
            <div className={styles.providerBar}>
                <button 
                    className={`${styles.providerChip} ${selectedProviders.length === 0 ? styles.providerChipActive : ''}`}
                    onClick={() => setSelectedProviders([])}
                >
                    Todos os Streamings
                </button>
                {availableProviders.map(prov => (
                    <button 
                        key={prov.name}
                        className={`${styles.providerChip} ${selectedProviders.includes(prov.name) ? styles.providerChipActive : ''}`}
                        onClick={() => toggleProvider(prov.name)}
                    >
                        {prov.logoUrl && (
                            <img src={prov.logoUrl} alt={prov.name} className={styles.chipLogo} />
                        )}
                        {prov.name}
                    </button>
                ))}
            </div>
        )}

        {filteredMovies.length === 0 ? (
            <p style={{ padding: '0 40px', color: 'var(--text-secondary)' }}>Nenhum filme encontrado para este filtro.</p>
        ) : (
            <>
                <div className={styles.resultsInfo}>
                    <span>Exibindo <strong>{filteredMovies.length}</strong> {filteredMovies.length === 1 ? 'filme' : 'filmes'}</span>
                </div>
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
            </>
        )}
    </>
    );
}