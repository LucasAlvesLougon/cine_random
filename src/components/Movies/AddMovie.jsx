import { useState } from 'react';
import { useMovies } from '../../contexts/MoviesContext';
import { fetchMovieDetails } from '../../services/tmdb';
import { DrawModal } from '../Modal/DrawModal';
import { MatchModal } from '../Modal/MatchModal';
import { useToast } from '../../contexts/ToastContext';
import styles from './AddMovie.module.css';

export function AddMovie({ onOpenInfo, listCode }) {
    const { addToast } = useToast();
    const [movieTitle, setMovieTitle] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
    const [winner, setWinner] = useState(null);
    const [unwatchedMovies, setUnwatchedMovies] = useState([]);
    const [includeWatched, setIncludeWatched] = useState(false);

    const [selectedProvider, setSelectedProvider] = useState('');
    const { movies, addMovie } = useMovies();

    const availableProviders = Array.from(
        new Map(
            movies.flatMap(m => m.watchProviders || []).map(p => [p.name, p])
        ).values()
    ).sort((a, b) => a.name.localeCompare(b.name));

    const handleAddMovie = async (e) => {
        e.preventDefault();
        if (!movieTitle.trim()) return;

        try {
            setLoading(true);
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
            
            if (selectedProvider) {
                listToDraw = listToDraw.filter(m => m.watchProviders && m.watchProviders.some(p => p.name === selectedProvider));
            }

            if (listToDraw.length === 0) {
                if (selectedProvider) {
                    addToast(`Nenhum filme ${includeWatched ? '' : 'não assistido '}encontrado no streaming "${selectedProvider}".`, 'error');
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
                <input
                    type="text"
                    placeholder="Nome do filme..."
                    value={movieTitle}
                    onChange={(e) => setMovieTitle(e.target.value)}
                    className={styles.input}
                    disabled={loading}
                />
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
                    <select 
                        className={styles.providerSelect}
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                    >
                        <option value="">Todos os Streamings</option>
                        {availableProviders.map(p => (
                            <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                    </select>
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