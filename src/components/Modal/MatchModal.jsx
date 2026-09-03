import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { api } from '../../services/api';
import styles from './MatchModal.module.css';
import { triggerHaptic } from '../../utils/haptics';

function TinderCard({ movie, onVote }) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-220, 220], [-20, 20]);
    const likeOpacity = useTransform(x, [20, 90], [0, 1]);
    const nopeOpacity = useTransform(x, [-20, -90], [0, 1]);

    const handleDragEnd = (_event, info) => {
        const threshold = 90;
        const velocityThreshold = 400;

        if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
            onVote(true);
        } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
            onVote(false);
        }
    };

    return (
        <motion.div
            key={movie.id}
            style={{ x, rotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={(custom) => ({
                x: custom === 'like' ? 350 : -350,
                opacity: 0,
                rotate: custom === 'like' ? 25 : -25,
                transition: { duration: 0.22 }
            })}
            whileDrag={{ scale: 1.03, cursor: 'grabbing' }}
            className={styles.glassCard}
        >
            {/* Stamp / Badge Dinâmico de LIKE */}
            <motion.div style={{ opacity: likeOpacity }} className={`${styles.stamp} ${styles.stampLike}`}>
                🔥 CURTIR
            </motion.div>

            {/* Stamp / Badge Dinâmico de NOPE */}
            <motion.div style={{ opacity: nopeOpacity }} className={`${styles.stamp} ${styles.stampNope}`}>
                ❌ PASSAR
            </motion.div>

            <div className={styles.posterContainer}>
                {movie.posterUrl ? (
                    <img 
                        src={movie.posterUrl} 
                        alt={movie.title} 
                        className={styles.posterImage} 
                        draggable={false}
                    />
                ) : (
                    <div className={styles.noPosterImage}>🎬</div>
                )}
                <div className={styles.posterOverlay} />
            </div>

            <div className={styles.glassCardContent}>
                <div className={styles.chipsRow}>
                    {movie.releaseYear && (
                        <span className={styles.glassChip}>📅 {movie.releaseYear}</span>
                    )}
                    {movie.tmdbRating && (
                        <span className={`${styles.glassChip} ${styles.chipRating}`}>⭐ {movie.tmdbRating}</span>
                    )}
                    {movie.genres && movie.genres.length > 0 && (
                        <span className={styles.glassChip}>🎭 {movie.genres[0]}</span>
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
    const [exitDirection, setExitDirection] = useState('like');
    const savedMatchesRef = useRef(new Set());

    useEffect(() => {
        if (isOpen) {
            const unwatched = (movies || []).filter(m => !m.watched);
            const shuffled = [...unwatched].sort(() => 0.5 - Math.random());
            setDeck(shuffled.slice(0, 10));
            setCurrentIndex(0);
            setMatches([]);
            setIsFinished(false);
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

    const handleVote = (liked) => {
        setExitDirection(liked ? 'like' : 'dislike');
        if (liked) {
            triggerHaptic('light');
            if (currentMovie) {
                setMatches(prev => [...prev, currentMovie]);
            }
        } else {
            triggerHaptic('warning');
        }

        if (currentIndex + 1 >= deck.length) {
            setIsFinished(true);
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handleRestart = () => {
        const unwatched = movies.filter(m => !m.watched);
        const shuffled = [...unwatched].sort(() => 0.5 - Math.random());
        setDeck(shuffled.slice(0, 10));
        setCurrentIndex(0);
        setMatches([]);
        setIsFinished(false);
        savedMatchesRef.current.clear();
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
                                    <span className={styles.badge}>🔥 Match da Galera</span>
                                </div>
                                <h3 className={styles.counter}>{currentIndex + 1} de {deck.length}</h3>
                            </div>

                            <div className={styles.cardWrapper}>
                                <AnimatePresence mode="popLayout" custom={exitDirection}>
                                    <TinderCard 
                                        key={currentMovie.id} 
                                        movie={currentMovie} 
                                        onVote={handleVote} 
                                    />
                                </AnimatePresence>
                            </div>

                            <div className={styles.swipeHint}>
                                <span>👈 Arraste para passar</span>
                                <span className={styles.hintDot}>•</span>
                                <span>Arraste para curtir 👉</span>
                            </div>

                            <div className={styles.actions}>
                                <button 
                                    className={`${styles.actionCircleBtn} ${styles.btnDislike}`}
                                    onClick={() => handleVote(false)}
                                    title="Passar Filme (Swipe Esquerda)"
                                >
                                    ✕
                                </button>
                                <button 
                                    className={`${styles.actionCircleBtn} ${styles.btnLike}`}
                                    onClick={() => handleVote(true)}
                                    title="Quero Assistir (Swipe Direita)"
                                >
                                    💚
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <h3>Sua lista está sem filmes não assistidos!</h3>
                            <p>Adicione mais títulos para jogar o Match da Galera.</p>
                            <button onClick={onClose} className={styles.btnPrimary}>Fechar</button>
                        </div>
                    )
                ) : (
                    <div className={styles.resultContainer}>
                        <div className={styles.trophy}>🎉</div>
                        <h3>Sessão de Votação Concluída!</h3>
                        <p>Você deu match em <strong>{matches.length}</strong> filmes desta rodada.</p>

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
                                            <span>⭐ {movie.tmdbRating} • {movie.releaseYear}</span>
                                        </div>
                                        <button className={styles.btnDetails}>Ver ➔</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={styles.subtext}>Nenhum filme foi curtido nessa rodada. Que tal tentar de novo?</p>
                        )}

                        <div className={styles.resultActions}>
                            <button onClick={handleRestart} className={styles.btnSecondary}>Jogar Novamente 🔄</button>
                            <button onClick={onClose} className={styles.btnPrimary}>Concluir ✅</button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
