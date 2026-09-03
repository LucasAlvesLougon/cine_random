import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useTransform, useAnimationControls } from 'framer-motion';
import { api } from '../../services/api';
import styles from './MatchModal.module.css';
import { triggerHaptic } from '../../utils/haptics';

function TinderCard({ movie, onVote, controls, isNext = false }) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-16, 16]);
    const likeOpacity = useTransform(x, [20, 80], [0, 1]);
    const nopeOpacity = useTransform(x, [-20, -80], [0, 1]);

    const handleDragEnd = (_event, info) => {
        if (isNext) return;
        const threshold = 70;
        const velocityThreshold = 300;

        if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
            onVote(true, true);
        } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
            onVote(false, true);
        }
    };

    if (isNext) {
        return (
            <motion.div
                initial={{ scale: 0.94, y: 14, opacity: 0.6 }}
                animate={{ scale: 0.94, y: 14, opacity: 0.6 }}
                transition={{ duration: 0.2 }}
                className={`${styles.card} ${styles.cardBack}`}
            >
                {movie.posterUrl ? (
                    <img 
                        src={movie.posterUrl} 
                        alt={movie.title} 
                        className={styles.fullPoster} 
                        draggable={false}
                    />
                ) : (
                    <div className={styles.noPosterFull}>🎬</div>
                )}
                <div className={styles.fullPosterOverlay} />
                <div className={styles.cardContent}>
                    <div className={styles.chipsRow}>
                        {movie.releaseYear && <span className={styles.chip}>{movie.releaseYear}</span>}
                        {movie.tmdbRating && <span className={`${styles.chip} ${styles.chipRating}`}>★ {movie.tmdbRating}</span>}
                    </div>
                    <h4 className={styles.movieTitle}>{movie.title}</h4>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            style={{ x, rotate, zIndex: 2 }}
            animate={controls}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.8}
            dragSnapToOrigin={true}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
            className={styles.card}
        >
            {/* Stamp Dinâmico de CURTIR (Direita) */}
            <motion.div style={{ opacity: likeOpacity }} className={`${styles.stamp} ${styles.stampLike}`}>
                CURTIR
            </motion.div>

            {/* Stamp Dinâmico de PASSAR (Esquerda) */}
            <motion.div style={{ opacity: nopeOpacity }} className={`${styles.stamp} ${styles.stampNope}`}>
                PASSAR
            </motion.div>

            {movie.posterUrl ? (
                <img 
                    src={movie.posterUrl} 
                    alt={movie.title} 
                    className={styles.fullPoster} 
                    draggable={false}
                />
            ) : (
                <div className={styles.noPosterFull}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                        <line x1="7" y1="2" x2="7" y2="22"></line>
                        <line x1="17" y1="2" x2="17" y2="22"></line>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <line x1="2" y1="7" x2="7" y2="7"></line>
                        <line x1="2" y1="17" x2="7" y2="17"></line>
                        <line x1="17" y1="17" x2="22" y2="17"></line>
                        <line x1="17" y1="7" x2="22" y2="7"></line>
                    </svg>
                </div>
            )}
            
            <div className={styles.fullPosterOverlay} />

            <div className={styles.cardContent}>
                <div className={styles.chipsRow}>
                    {movie.releaseYear && (
                        <span className={styles.chip}>{movie.releaseYear}</span>
                    )}
                    {movie.tmdbRating && (
                        <span className={`${styles.chip} ${styles.chipRating}`}>★ {movie.tmdbRating}</span>
                    )}
                    {movie.genres && movie.genres.length > 0 && (
                        <span className={styles.chip}>{movie.genres[0]}</span>
                    )}
                </div>

                <h4 className={styles.movieTitle}>{movie.title}</h4>

                {movie.synopsis && (
                    <p className={styles.synopsisText}>{movie.synopsis}</p>
                )}
            </div>
        </motion.div>
    );
}

export function MatchModal({ isOpen, onClose, movies = [], onOpenInfo, listCode }) {
    const [deck, setDeck] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [matches, setMatches] = useState([]);
    const [isFinished, setIsFinished] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const controls = useAnimationControls();
    const savedMatchesRef = useRef(new Set());

    useEffect(() => {
        if (isOpen) {
            const unwatched = (movies || []).filter(m => !m.watched);
            const shuffled = [...unwatched].sort(() => 0.5 - Math.random());
            setDeck(shuffled.slice(0, 10));
            setCurrentIndex(0);
            setMatches([]);
            setIsFinished(false);
            setIsAnimating(false);
            savedMatchesRef.current.clear();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (isFinished && matches.length > 0 && listCode) {
            triggerHaptic('success');
            matches.forEach(m => {
                if (!savedMatchesRef.current.has(m.id)) {
                    savedMatchesRef.current.add(m.id);
                    api.post(`/lists/${listCode}/history`, {
                        movie_id: m.id || null,
                        movie_title: m.title,
                        movie_poster: m.posterUrl || null,
                        draw_type: 'match'
                    }).catch(err => console.error('Erro ao salvar match no histórico:', err));
                }
            });
        }
    }, [isFinished, matches, listCode]);

    if (!isOpen) return null;

    const currentMovie = deck[currentIndex];
    const nextMovie = deck[currentIndex + 1];

    const handleVote = async (liked, fromSwipe = false) => {
        if (isAnimating || !currentMovie) return;
        setIsAnimating(true);

        if (liked) {
            triggerHaptic('light');
            setMatches(prev => [...prev, currentMovie]);
        } else {
            triggerHaptic('warning');
        }

        // Animação de saída limpa
        if (!fromSwipe) {
            try {
                await controls.start({
                    x: liked ? 420 : -420,
                    rotate: liked ? 18 : -18,
                    opacity: 0,
                    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
                });
            } catch {
                // Fallback gracioso
            }
        }

        if (currentIndex + 1 >= deck.length) {
            setIsFinished(true);
        } else {
            setCurrentIndex(prev => prev + 1);
            try {
                controls.set({ x: 0, rotate: 0, opacity: 1 });
            } catch {
                // Fallback
            }
        }
        setIsAnimating(false);
    };

    const handleRestart = () => {
        const unwatched = movies.filter(m => !m.watched);
        const shuffled = [...unwatched].sort(() => 0.5 - Math.random());
        setDeck(shuffled.slice(0, 10));
        setCurrentIndex(0);
        setMatches([]);
        setIsFinished(false);
        setIsAnimating(false);
        savedMatchesRef.current.clear();
        controls.set({ x: 0, rotate: 0, opacity: 1 });
    };

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>

                {!isFinished ? (
                    currentMovie ? (
                        <div className={styles.swipeContainer}>
                            <div className={styles.header}>
                                <div className={styles.badgeWrapper}>
                                    <span className={styles.badge}>Match da Galera</span>
                                </div>
                                <h3 className={styles.counter}>{currentIndex + 1} de {deck.length}</h3>
                            </div>

                            <div className={styles.cardWrapper}>
                                {/* Próximo Card na Pilha */}
                                {nextMovie && (
                                    <TinderCard 
                                        key={`next-${nextMovie.id}`} 
                                        movie={nextMovie} 
                                        isNext={true}
                                    />
                                )}

                                {/* Card Ativo no Topo */}
                                <TinderCard 
                                    key={currentMovie.id} 
                                    movie={currentMovie} 
                                    onVote={handleVote} 
                                    controls={controls}
                                    isNext={false}
                                />
                            </div>

                            <div className={styles.swipeHint}>
                                <span>← Arraste para passar</span>
                                <span className={styles.hintDot}>•</span>
                                <span>Arraste para curtir →</span>
                            </div>

                            <div className={styles.actions}>
                                <button 
                                    className={`${styles.actionCircleBtn} ${styles.btnDislike}`}
                                    onClick={() => handleVote(false)}
                                    title="Passar Filme (Swipe Esquerda)"
                                    disabled={isAnimating}
                                >
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                                <button 
                                    className={`${styles.actionCircleBtn} ${styles.btnLike}`}
                                    onClick={() => handleVote(true)}
                                    title="Quero Assistir (Swipe Direita)"
                                    disabled={isAnimating}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <h3>Sua lista está sem filmes não assistidos</h3>
                            <p>Adicione mais títulos para iniciar a rodada do Match.</p>
                            <button onClick={onClose} className={styles.btnPrimary}>Fechar</button>
                        </div>
                    )
                ) : (
                    <div className={styles.resultContainer}>
                        <div className={styles.resultIcon}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#30d158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <h3>Sessão de Votação Concluída</h3>
                        <p>Você deu match em <strong>{matches.length}</strong> {matches.length === 1 ? 'filme' : 'filmes'} nesta rodada.</p>

                        {matches.length > 0 ? (
                            <div className={styles.matchList}>
                                {matches.map(movie => (
                                    <div 
                                        key={movie.id} 
                                        className={styles.matchItem}
                                        onClick={() => onOpenInfo(movie)}
                                    >
                                        {movie.posterUrl && <img src={movie.posterUrl} alt={movie.title} className={styles.matchThumbnail} />}
                                        <div className={styles.matchDetails}>
                                            <strong>{movie.title}</strong>
                                            <span>★ {movie.tmdbRating} • {movie.releaseYear}</span>
                                        </div>
                                        <button className={styles.btnDetails}>Ver →</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={styles.subtext}>Nenhum filme foi curtido nessa rodada. Que tal tentar de novo?</p>
                        )}

                        <div className={styles.resultActions}>
                            <button onClick={handleRestart} className={styles.btnSecondary}>Jogar Novamente</button>
                            <button onClick={onClose} className={styles.btnPrimary}>Concluir</button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
