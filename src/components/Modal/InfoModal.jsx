import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './InfoModal.module.css';
import { CommentSection } from '../Comments/CommentSection';
import { fetchExtraMovieDetails } from '../../services/tmdb';
import { doc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useToast } from '../../contexts/ToastContext';

export function InfoModal({ isOpen, onClose, movie }) {
    const { addToast } = useToast();
    const [providers, setProviders] = useState([]);
    const [trailerKey, setTrailerKey] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);

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
                    const movieRef = doc(db, 'lists', 'teste123', 'movies', movie.id);
                    updateDoc(movieRef, { 
                        watchProviders: extras.watchProviders,
                        trailerKey: extras.trailerKey 
                    }).catch(() => {});
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
            const moviesRef = collection(db, 'lists', 'teste123', 'movies');
            
            const q = query(moviesRef, where("tmdbId", "==", movie.tmdbId));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                addToast(`${movie.title} já está na sua lista!`, 'error');
                setIsAdding(false);
                return;
            }

            await addDoc(moviesRef, movie);
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
                            <img src={movie.backdropUrl} alt="Banner" className={styles.bannerImg} />
                        ) : (
                            <img src={movie.posterUrl} alt="Fundo Borrado" className={styles.bannerImgBlur} />
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
                            <img src={movie.posterUrl} alt={movie.title} className={styles.poster} />
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
                        </div>
                    </div>
                </div>

                {/* --- COMENTÁRIOS --- */}
                {movie.id ? (
                    <div className={styles.commentsContainer}>
                        <CommentSection movieId={movie.id} />
                    </div>
                ) : (
                    <div className={styles.commentsContainer}>
                        <div style={{ textAlign: 'center', margin: '40px 0' }}>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '1.1rem' }}>
                                Para liberar a área de comentários e avaliações, adicione este filme à sua lista! 📌
                            </p>
                            <button 
                                onClick={handleAddToList} 
                                disabled={isAdding}
                                className={styles.btnAddToList}
                            >
                                {isAdding ? 'Adicionando...' : 'Adicionar à Lista 📌'}
                            </button>
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
        </>,
        document.body
    );
}