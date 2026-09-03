import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './InfoModal.module.css';
import { fetchExtraMovieDetails } from '../../services/tmdb';
import { useMovies } from '../../contexts/MoviesContext';
import { useToast } from '../../contexts/ToastContext';
import { CommentSection } from '../Comments/CommentSection';
import { ShareCardModal } from './ShareCardModal';

export function InfoModal({ isOpen, onClose, movie, listCode }) {
    const { addToast } = useToast();
    const { movies, addMovie } = useMovies();
    const [providers, setProviders] = useState([]);
    const [trailerKey, setTrailerKey] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    const [bannerLoaded, setBannerLoaded] = useState(false);
    const [posterLoaded, setPosterLoaded] = useState(false);

    // Reseta o estado das imagens e do trailer quando o filme muda ou modal fecha
    useEffect(() => {
        setBannerLoaded(false);
        setPosterLoaded(false);
        setShowTrailer(false);
    }, [movie?.tmdbId, isOpen]);

    useEffect(() => {
        if (!isOpen || !movie) return;
        
        if (movie.watchProviders && movie.trailerKey) {
            setProviders(movie.watchProviders);
            setTrailerKey(movie.trailerKey);
        } else if (movie.tmdbId) {
            fetchExtraMovieDetails(movie.tmdbId).then(extras => {
                setProviders(extras.watchProviders);
                setTrailerKey(extras.trailerKey);
                
                if (movie.id) {
                    // API update would go here if needed
                }
            });
        } else {
            setProviders([]);
            setTrailerKey(null);
        }
    }, [isOpen, movie]);

    const handleAddToList = async () => {
        try {
            setIsAdding(true);
            
            if (movies.some(m => m.tmdbId === movie.tmdbId)) {
                addToast(`${movie.title} já está na sua lista!`, 'error');
                setIsAdding(false);
                return;
            }

            await addMovie(movie);
            addToast(`${movie.title} foi adicionado à sua lista! 📌`, 'success');
            onClose();
        } catch (error) {
            console.error(error);
            addToast("Erro ao adicionar filme à lista.", 'error');
        } finally {
            setIsAdding(false);
        }
    };

    if (!isOpen || !movie) return null;

    return createPortal(
        <>
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                <div className={styles.closeRow}>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                {/* --- HERO SECTION --- */}
                <div className={styles.hero}>
                    <div className={styles.heroBackground}>
                        {movie.backdropUrl ? (
                            <img 
                                src={movie.backdropUrl} 
                                alt="Banner" 
                                className={`${styles.bannerImg} ${bannerLoaded ? styles.loaded : ''}`} 
                                onLoad={() => setBannerLoaded(true)}
                            />
                        ) : (
                            <img 
                                src={movie.posterUrl} 
                                alt="Fundo Borrado" 
                                className={`${styles.bannerImgBlur} ${bannerLoaded ? styles.loaded : ''}`} 
                                onLoad={() => setBannerLoaded(true)}
                            />
                        )}
                        <div className={styles.heroGradient}></div>
                    </div>

                    <div className={styles.heroContent}>
                        <div className={styles.heroText}>
                            <h2 className={styles.title}>{movie.title}</h2>

                            <div className={styles.metaRow}>
                                <span className={styles.appleBadge}>TMDB {movie.tmdbRating}</span>
                                <span>{movie.releaseYear}</span>
                                <span>{movie.runtime} min</span>
                                <span>{movie.genres?.join(', ')}</span>
                            </div>
                        </div>

                        {trailerKey && (
                            <button className={styles.btnTrailer} onClick={() => setShowTrailer(true)}>
                                ▶ Assistir Trailer
                            </button>
                        )}
                    </div>
                </div>

                {/* --- SINOPSE E PLATAFORMAS --- */}
                <div className={styles.bodySection}>
                    <div className={styles.contentLayout}>
                        {!movie.backdropUrl && (
                            <img 
                                src={movie.posterUrl} 
                                alt={movie.title} 
                                className={`${styles.poster} ${posterLoaded ? styles.loaded : ''}`} 
                                onLoad={() => setPosterLoaded(true)}
                            />
                        )}
                        <div className={styles.infoCol}>
                            <p className={styles.synopsis}>{movie.synopsis}</p>
                            
                            {providers.length > 0 ? (
                                <div className={styles.providersBlock}>
                                    <span>Onde assistir:</span>
                                    <div className={styles.providersList}>
                                        {providers.slice(0, 5).map(p => (
                                            <img key={p.name} src={p.logoUrl} alt={p.name} title={p.name} className={styles.providerLogo} />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.providersBlock}>
                                    <span>Alternativa Grátis:</span>
                                    <a href="https://www.stremio.com/" target="_blank" rel="noopener noreferrer" className={styles.stremioLink}>
                                        Abrir no Stremio 🟣
                                    </a>
                                </div>
                            )}

                            <div className={styles.providersBlock}>
                                <span>Ações:</span>
                                <div className={styles.actionsList}>
                                    <button 
                                        onClick={() => setIsShareOpen(true)}
                                        className={styles.actionBtnShare}
                                    >
                                        📸 Convite Sessão
                                    </button>
                                    <a 
                                        href={`https://letterboxd.com/tmdb/${movie.tmdbId}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className={styles.actionBtnLetterboxd}
                                    >
                                        <svg viewBox="0 0 100 32" height="12" style={{ marginRight: '6px' }}>
                                            <circle cx="16" cy="16" r="16" fill="#00e054" />
                                            <circle cx="50" cy="16" r="16" fill="#40bcf4" />
                                            <circle cx="84" cy="16" r="16" fill="#ff8000" />
                                        </svg>
                                        Letterboxd
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- COMENTÁRIOS / LETTERBOXD --- */}
                {movie.id ? (
                    <div className={styles.commentsContainer}>
                        <CommentSection movieId={movie.id} initialComments={movie.comments || []} />
                    </div>
                ) : (
                    <div className={styles.commentsContainer}>
                        <div style={{ textAlign: 'center', margin: '40px 0 20px', padding: '30px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <h3 style={{ margin: '0 0 12px', fontSize: '1.2rem', fontWeight: '700' }}>Adicione para Comentar</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '1rem', maxWidth: '400px', margin: '0 auto 24px' }}>
                                Salve este filme na sua lista para liberar as avaliações do grupo.
                            </p>
                            
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <button 
                                    onClick={handleAddToList} 
                                    disabled={isAdding}
                                    className={styles.btnAddToList}
                                >
                                    {isAdding ? 'Adicionando...' : 'Salvar na Lista 📌'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>

        {/* --- TRAILER OVERLAY FULLSCREEN --- */}
        {showTrailer && trailerKey && (
            <div className={styles.fullScreenTrailer} onClick={() => setShowTrailer(false)}>
                <button className={styles.closeTrailerBtn} onClick={() => setShowTrailer(false)}>✕</button>
                <div className={styles.trailerBox} onClick={e => e.stopPropagation()}>
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                        title="Trailer do Filme"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        )}

        {/* --- MODAL DE CONVITE VISUAL / COMPARTILHAMENTO --- */}
        <ShareCardModal 
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            movie={movie}
            listCode={listCode}
        />
        </>,
        document.body
    );
}