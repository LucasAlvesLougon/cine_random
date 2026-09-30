import { useState, useEffect, useRef } from 'react';
import { useMovies } from '../../contexts/MoviesContext';
import { fetchMovieDetails, searchMoviesAutocomplete, fetchMovieDetailsById } from '../../services/tmdb';
import { DrawModal } from '../Modal/DrawModal';
import { ListDrawFilterModal } from '../Modal/ListDrawFilterModal';
import { useToast } from '../../contexts/ToastContext';
import styles from './AddMovie.module.css';

export function AddMovie({ onOpenInfo, listCode, inputRef }) {
    const { addToast } = useToast();
    const [movieTitle, setMovieTitle] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isPreparingDraw, setIsPreparingDraw] = useState(false);
    const dropdownRef = useRef(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [winner, setWinner] = useState(null);
    const [unwatchedMovies, setUnwatchedMovies] = useState([]);
    const [includeWatched, setIncludeWatched] = useState(false);
    const [selectedProviders, setSelectedProviders] = useState([]);
    const { movies, totalMovies = movies.length, hasMoreMovies = false, addMovie, getAllMoviesForDraw } = useMovies();
    const eligibleMovies = movies.filter(m => (includeWatched || !m.watched) && (
        selectedProviders.length === 0 || m.watchProviders?.some(p => selectedProviders.includes(p.name))
    ));
    const canDraw = totalMovies > 0 && (hasMoreMovies || eligibleMovies.length > 0);

    // Debounced autocomplete search
    useEffect(() => {
        if (!movieTitle.trim() || movieTitle.trim().length < 2) {
            setSuggestions([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                const results = await searchMoviesAutocomplete(movieTitle);
                setSuggestions(results);
            } catch (err) {
                console.error('Erro ao buscar sugestões:', err);
            } finally {
                setIsSearching(false);
            }
        }, 280);

        return () => clearTimeout(timer);
    }, [movieTitle]);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setSuggestions([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const availableProviders = Array.from(
        new Map(
            movies.flatMap(m => m.watchProviders || []).map(p => [p.name, p])
        ).values()
    ).sort((a, b) => a.name.localeCompare(b.name));

    const handleAddFromSuggestion = async (suggestion) => {
        try {
            setLoading(true);
            setSuggestions([]);
            if (movies.some(m => m.tmdbId === suggestion.id)) {
                addToast(`"${suggestion.title}" já existe na sua lista!`, 'error');
                setMovieTitle('');
                return;
            }

            const movieData = await fetchMovieDetailsById(suggestion.id);
            await addMovie(movieData);
            setMovieTitle('');
            addToast(`${movieData.title} foi adicionado à lista!`, 'success');
        } catch {
            addToast("Não foi possível adicionar o filme. Tente novamente.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMovie = async (e) => {
        e.preventDefault();
        if (!movieTitle.trim()) return;

        try {
            setLoading(true);
            setSuggestions([]);
            const movieData = await fetchMovieDetails(movieTitle);
            
            if (movies.some(m => m.tmdbId === movieData.tmdbId)) {
                addToast(`"${movieData.title}" já existe na sua lista!`, 'error');
                setMovieTitle('');
                return;
            }

            await addMovie(movieData);
            setMovieTitle('');
            addToast(`${movieData.title} foi salvo na lista!`, 'success');
        } catch {
            addToast("Não foi possível adicionar o filme. Verifique o nome e tente novamente.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDrawFromList = async () => {
        setIsPreparingDraw(true);
        try {
            const allMovies = await getAllMoviesForDraw();
            const listToDraw = allMovies.filter(m => (includeWatched || !m.watched) && (
                selectedProviders.length === 0 || m.watchProviders?.some(p => selectedProviders.includes(p.name))
            ));

            if (listToDraw.length === 0) {
                if (selectedProviders.length > 0) {
                    addToast(`Nenhum filme ${includeWatched ? '' : 'não assistido '}encontrado nos streamings selecionados (${selectedProviders.join(', ')}).`, 'error');
                } else {
                    addToast(includeWatched ? "Sua lista está vazia! Adicione filmes primeiro." : "Nenhum filme não assistido na sua lista! Adicione novos filmes ou inclua os assistidos nos filtros.", 'error');
                }
                return;
            }
            
            const randomIndex = Math.floor(Math.random() * listToDraw.length);
            const chosen = listToDraw[randomIndex];
            setUnwatchedMovies(listToDraw.length > 15 ? [...listToDraw.slice(0, 14), chosen] : listToDraw);
            
            setWinner(null);
            setIsModalOpen(true);
            
            setTimeout(() => {
                setWinner(chosen);
            }, 300);
            
        } catch (error) {
            console.error(error);
            addToast("Não foi possível carregar a lista completa para o sorteio. Tente novamente.", 'error');
        } finally {
            setIsPreparingDraw(false);
        }
    };

    const activeFilterCount = (includeWatched ? 1 : 0) + selectedProviders.length;

    return (
    <div className={styles.container}>
        <div className={styles.header}>
            <div className={styles.headerTop}>
                <h3>Escolher da lista do grupo</h3>
                <button 
                    type="button" 
                    onClick={() => setIsFilterModalOpen(true)}
                    className={`${styles.btnFilterDraw} ${activeFilterCount > 0 ? styles.btnFilterDrawActive : ''}`}
                    title="Configurar filtros do sorteio da lista"
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
                    Filtros do sorteio {activeFilterCount > 0 && <span className={styles.filterBadge}>{activeFilterCount}</span>}
                </button>
            </div>
            <p>O sorteio escolhe apenas entre os filmes salvos pelo grupo.</p>
        </div>
        
        <div className={styles.actionsBlock}>
            <div className={styles.drawButtonsGrid}>
                <button type="button" onClick={handleDrawFromList} className={styles.drawBtn} disabled={!canDraw || isPreparingDraw}>
                    <span aria-hidden="true">✦</span> {isPreparingDraw ? 'Preparando sorteio...' : 'Sortear da lista'}
                </button>
            </div>
            {!canDraw && <p className={styles.drawHint}>{totalMovies === 0 ? 'Adicione um filme para começar o sorteio.' : 'Nenhum filme disponível com estes filtros. Inclua assistidos ou ajuste os streamings.'}</p>}
            <form className={styles.form} onSubmit={handleAddMovie}>
                <div className={styles.inputWrapper} ref={dropdownRef}>
                    <input
                        ref={inputRef}
                        type="text"
                        aria-label="Buscar filme para adicionar à lista"
                        placeholder="Buscar e adicionar filme..."
                        value={movieTitle}
                        onChange={(e) => setMovieTitle(e.target.value)}
                        className={styles.input}
                        disabled={loading}
                        autoComplete="off"
                    />
                    {isSearching && <div className={styles.inputSpinner} />}
                    {suggestions.length > 0 && (
                        <div className={styles.suggestionsDropdown}>
                            {suggestions.map((suggestion) => (
                                <button
                                    type="button"
                                    key={suggestion.id}
                                    className={styles.suggestionItem}
                                    onClick={() => handleAddFromSuggestion(suggestion)}
                                    aria-label={`Adicionar ${suggestion.title} à lista`}
                                >
                                    {suggestion.posterUrl ? (
                                        <img
                                            src={suggestion.posterUrl}
                                            alt={suggestion.title}
                                            className={styles.suggestionPoster}
                                        />
                                    ) : (
                                        <div className={styles.suggestionPosterPlaceholder}>🎬</div>
                                    )}
                                    <div className={styles.suggestionInfo}>
                                        <div className={styles.suggestionTitle}>{suggestion.title}</div>
                                        <div className={styles.suggestionMeta}>
                                            <span>{suggestion.releaseYear}</span>
                                            {suggestion.tmdbRating > 0 && <span>★ {suggestion.tmdbRating}</span>}
                                        </div>
                                    </div>
                                    <span className={styles.btnQuickAdd} aria-hidden="true">
                                        +
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button type="submit" className={styles.button} disabled={loading}>
                    {loading ? 'Buscando...' : 'Adicionar filme'}
                </button>
            </form>
        </div>

        <ListDrawFilterModal 
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            includeWatched={includeWatched}
            setIncludeWatched={setIncludeWatched}
            selectedProviders={selectedProviders}
            setSelectedProviders={setSelectedProviders}
            availableProviders={availableProviders}
        />

        <DrawModal 
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setWinner(null); }}
            winnerMovie={winner}
            unwatchedMovies={unwatchedMovies}
            onOpenInfo={onOpenInfo}
            listCode={listCode}
        />

    </div>
    );
}
