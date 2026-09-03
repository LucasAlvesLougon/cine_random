import { useState } from 'react';
import { useMovies } from '../../contexts/MoviesContext';
import { MovieCard } from './MovieCard';
import { CatalogFilterModal } from '../Modal/CatalogFilterModal';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './MovieList.module.css';

export function MovieList({ onOpenInfo }) {
    const { movies, toggleWatched, deleteMovie } = useMovies();

    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('');
    const [selectedProviders, setSelectedProviders] = useState([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const availableGenres = Array.from(new Set(movies.flatMap(m => m.genres || []))).sort();

    const availableProviders = Array.from(
        new Map(
            movies.flatMap(m => m.watchProviders || []).map(p => [p.name, p])
        ).values()
    ).sort((a, b) => a.name.localeCompare(b.name));

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

    const activeFilterCount = (filter !== 'all' ? 1 : 0) + (selectedGenre ? 1 : 0) + selectedProviders.length;

    return (
    <>
        <div className={styles.filterBar}>
            <div className={styles.searchWrapper}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                    type="text" 
                    placeholder="Buscar filme na lista..." 
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <button 
                type="button"
                className={`${styles.btnFilterModal} ${activeFilterCount > 0 ? styles.btnFilterModalActive : ''}`}
                onClick={() => setIsFilterModalOpen(true)}
                title="Abrir filtros do catálogo"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="21" x2="4" y2="14"></line>
                    <line x1="4" y1="10" x2="4" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="3"></line>
                    <line x1="20" y1="21" x2="20" y2="16"></line>
                    <line x1="20" y1="12" x2="20" y2="3"></line>
                    <line x1="1" y1="14" x2="7" y2="14"></line>
                    <line x1="9" y1="8" x2="15" y2="8"></line>
                    <line x1="17" y1="16" x2="23" y2="16"></line>
                </svg>
                <span>Filtros</span>
                {activeFilterCount > 0 && (
                    <span className={styles.filterBadge}>{activeFilterCount}</span>
                )}
            </button>
        </div>

        <CatalogFilterModal 
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            filter={filter}
            setFilter={setFilter}
            selectedGenre={selectedGenre}
            setSelectedGenre={setSelectedGenre}
            selectedProviders={selectedProviders}
            setSelectedProviders={setSelectedProviders}
            availableGenres={availableGenres}
            availableProviders={availableProviders}
        />

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