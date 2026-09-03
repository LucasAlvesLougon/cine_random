import { useState, useEffect, useRef } from 'react';
import { useMovies } from '../../contexts/MoviesContext';
import { fetchMovieDetails, searchMoviesAutocomplete, fetchMovieDetailsById } from '../../services/tmdb';
import { DrawModal } from '../Modal/DrawModal';
import { MatchModal } from '../Modal/MatchModal';
import { useToast } from '../../contexts/ToastContext';
import styles from './AddMovie.module.css';

export function AddMovie({ onOpenInfo, listCode }) {
    const { addToast } = useToast();
    const [movieTitle, setMovieTitle] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
    const [winner, setWinner] = useState(null);
    const [unwatchedMovies, setUnwatchedMovies] = useState([]);
    const [includeWatched, setIncludeWatched] = useState(false);

    const [selectedProviders, setSelectedProviders] = useState([]);
    const { movies, addMovie } = useMovies();

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

    const toggleProvider = (providerName) => {
        setSelectedProviders(prev => 
            prev.includes(providerName)
                ? prev.filter(p => p !== providerName)
                : [...prev, providerName]
        );
    };

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
        try {
            let listToDraw = includeWatched ? movies : movies.filter(m => !m.watched);
            
            if (selectedProviders.length > 0) {
                listToDraw = listToDraw.filter(m => m.watchProviders && m.watchProviders.some(p => selectedProviders.includes(p.name)));
            }

            if (listToDraw.length === 0) {
                if (selectedProviders.length > 0) {
                    addToast(`Nenhum filme ${includeWatched ? '' : 'não assistido '}encontrado nos streamings selecionados (${selectedProviders.join(', ')}).`, 'error');
                } else {
                    addToast(includeWatched ? "Sua lista está vazia! Adicione filmes primeiro." : "Nenhum filme não assistido na sua lista! Adicione novos filmes ou inclua os assistidos.", 'error');
                }
                return;
            }
            
            setUnwatchedMovies(listToDraw);
            const randomIndex = Math.floor(Math.random() * listToDraw.length);
            
            setWinner(null);
            setIsModalOpen(true);
            
            setTimeout(() => {
                setWinner(listToDraw[randomIndex]);
            }, 300);
            
        } catch (error) {
            console.error(error);
            addToast("Erro ao processar o sorteio.", 'error');
        }
    };

    return (
    <div className={styles.container}>
        <div className={styles.header}>
            <h3>Sua Lista do Grupo</h3>
            <p>Adicione filmes para assistir com seus amigos ou faça um sorteio com o que vocês já têm.</p>
        </div>
        
        <div className={styles.actionsBlock}>
            <form className={styles.form} onSubmit={handleAddMovie}>
                <div className={styles.inputWrapper} ref={dropdownRef}>
                    <input
                        type="text"
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
                                <div
                                    key={suggestion.id}
                                    className={styles.suggestionItem}
                                    onClick={() => handleAddFromSuggestion(suggestion)}
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
                                            <span>📅 {suggestion.releaseYear}</span>
                                            {suggestion.tmdbRating > 0 && <span>⭐ {suggestion.tmdbRating}</span>}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className={styles.btnQuickAdd}
                                        title="Adicionar à lista"
                                    >
                                        +
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button type="submit" className={styles.button} disabled={loading}>
                    {loading ? 'Buscando...' : 'Adicionar'}
                </button>
            </form>

            <div className={styles.toggleWrapper}>
                <button 
                    type="button"
                    className={`${styles.toggleBtn} ${includeWatched ? styles.toggleActive : ''}`}
                    onClick={() => setIncludeWatched(!includeWatched)}
                >
                    <span className={styles.toggleText}>
                        {includeWatched ? 'Incluindo filmes assistidos' : 'Ignorando filmes assistidos'}
                    </span>
                    <div className={styles.toggleIndicator}>
                        <div className={styles.toggleKnob}></div>
                    </div>
                </button>
            </div>

            {availableProviders.length > 0 && (
                <div className={styles.providerSelectWrapper}>
                    <span className={styles.providerLabel}>Filtrar Sorteio por Streaming:</span>
                    <div className={styles.providerChipsContainer}>
                        <button 
                            type="button"
                            className={`${styles.providerFilterChip} ${selectedProviders.length === 0 ? styles.providerFilterChipActive : ''}`}
                            onClick={() => setSelectedProviders([])}
                        >
                            Todos
                        </button>
                        {availableProviders.map(p => (
                            <button
                                key={p.name}
                                type="button"
                                className={`${styles.providerFilterChip} ${selectedProviders.includes(p.name) ? styles.providerFilterChipActive : ''}`}
                                onClick={() => toggleProvider(p.name)}
                            >
                                {p.logoUrl && <img src={p.logoUrl} alt={p.name} className={styles.chipLogo} />}
                                {p.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.drawButtonsGrid}>
                <button onClick={handleDrawFromList} className={styles.drawBtn}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                    </svg>
                    Me Surpreenda
                </button>
                <button onClick={() => setIsMatchModalOpen(true)} className={styles.matchBtn}>
                    🔥 Match da Galera
                </button>
            </div>
        </div>

        <DrawModal 
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setWinner(null); }}
            winnerMovie={winner}
            unwatchedMovies={unwatchedMovies}
            onOpenInfo={onOpenInfo}
            listCode={listCode}
        />

        <MatchModal 
            isOpen={isMatchModalOpen}
            onClose={() => setIsMatchModalOpen(false)}
            movies={movies}
            onOpenInfo={onOpenInfo}
            listCode={listCode}
        />
    </div>
    );
}