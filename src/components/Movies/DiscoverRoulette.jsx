import { useState, useEffect } from 'react';
import { useMovies } from '../../contexts/MoviesContext';
import { fetchRandomMovieByOptions, preloadMovieCache } from '../../services/tmdb';
import { DrawModal } from '../Modal/DrawModal';
import { DiscoverFilterModal } from '../Modal/DiscoverFilterModal';
import { useToast } from '../../contexts/ToastContext';
import styles from './DiscoverRoulette.module.css';

const GENRES = [
    { id: '', label: 'Qualquer Gênero' },
    { id: '28', label: 'Ação' },
    { id: '35', label: 'Comédia' },
    { id: '27', label: 'Terror' },
    { id: '878', label: 'Ficção Científica' },
    { id: '10749', label: 'Romance' },
    { id: '18', label: 'Drama' },
    { id: '53', label: 'Suspense' },
    { id: '16', label: 'Animação' }
];

const DECADES = [
    { id: '', label: 'Qualquer Época' },
    { id: '1980', label: 'Anos 80' },
    { id: '1990', label: 'Anos 90' },
    { id: '2000', label: 'Anos 2000' },
    { id: '2010', label: 'Anos 2010' },
    { id: 'recent', label: 'Lançamentos Recentes' }
];

const SUSPENSE_MESSAGES = [
    { title: "Buscando nos arquivos do TMDB..." },
    { title: "Filtrando os melhores..." },
    { title: "Lendo a mente dos críticos..." },
    { title: "Preparando a pipoca..." }
];

export function DiscoverRoulette({ onOpenInfo, listCode }) {
    const { movies, addMovie } = useMovies();
    const { addToast } = useToast();
    const [genre, setGenre] = useState('');
    const [decade, setDecade] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [winner, setWinner] = useState(null);
    const [loading, setLoading] = useState(false);

    // Preload cache in the background when filters change!
    useEffect(() => {
        preloadMovieCache(genre, decade);
    }, [genre, decade]);

    const handleDraw = async () => {
        setWinner(null);
        setLoading(true);
        setIsModalOpen(true);
        
        try {
            const movie = await fetchRandomMovieByOptions({ genreId: genre, decade });
            setWinner(movie);
        } catch (e) {
            addToast(e.message || "Erro ao sortear filme. Tente novamente.", "error");
            setIsModalOpen(false);
            setWinner(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToList = async (movieData) => {
        try {
            if (movies.some(m => m.tmdbId === movieData.tmdbId)) {
                addToast(`O filme já está na sua lista!`, 'error');
                return;
            }

            await addMovie(movieData);
            addToast("Filme adicionado à sua lista!", "success");
            setIsModalOpen(false);
            setWinner(null);
        } catch (error) {
            console.error("Erro ao adicionar:", error);
            addToast("Erro ao adicionar filme.", "error");
        }
    };

    const activeFilterCount = (genre ? 1 : 0) + (decade ? 1 : 0);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <h3>Modo Descoberta Avançado</h3>
                    <button 
                        type="button" 
                        onClick={() => setIsFilterModalOpen(true)}
                        className={`${styles.btnFilterDraw} ${activeFilterCount > 0 ? styles.btnFilterDrawActive : ''}`}
                        title="Configurar filtros de descoberta (Gênero / Época)"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        Filtros {activeFilterCount > 0 && <span className={styles.filterBadge}>{activeFilterCount}</span>}
                    </button>
                </div>
                <p>Explore o catálogo mundial e deixe o algoritmo sortear um filme ideal para sua sessão.</p>
            </div>

            <div className={styles.actionsBlock}>
                <button onClick={handleDraw} disabled={loading} className={styles.drawBtn}>
                    {loading ? 'Sorteando...' : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                            </svg>
                            Sortear Filme da Internet
                        </>
                    )}
                </button>
            </div>

            <DiscoverFilterModal 
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                genre={genre}
                setGenre={setGenre}
                decade={decade}
                setDecade={setDecade}
                genres={GENRES}
                decades={DECADES}
            />
            
            <DrawModal 
                isOpen={isModalOpen} 
                onClose={() => { setIsModalOpen(false); setWinner(null); }} 
                winnerMovie={winner} 
                unwatchedMovies={SUSPENSE_MESSAGES}
                onAddToList={handleAddToList}
                onOpenInfo={onOpenInfo}
                listCode={listCode}
            />
        </div>
    );
}
