import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import styles from './MatchModal.module.css';

export function MatchModal({ isOpen, onClose, movies = [], onOpenInfo, listCode }) {
    const [deck, setDeck] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [matches, setMatches] = useState([]);
    const [isFinished, setIsFinished] = useState(false);
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
        if (liked && currentMovie) {
            setMatches(prev => [...prev, currentMovie]);
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
                                <span className={styles.badge}>🔥 Match da Galera</span>
                                <h3 className={styles.counter}>{currentIndex + 1} de {deck.length}</h3>
                            </div>

                            <AnimatePresence mode="popLayout">
                                <motion.div
                                    key={currentMovie.id}
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className={styles.card}
                                >
                                    {currentMovie.posterUrl ? (
                                        <img 
                                            src={currentMovie.posterUrl} 
                                            alt={currentMovie.title} 
                                            className={styles.poster} 
                                        />
                                    ) : (
                                        <div className={styles.noPoster}>🎬</div>
                                    )}

                                    <div className={styles.cardInfo}>
                                        <h4>{currentMovie.title}</h4>
                                        <p className={styles.meta}>
                                            {currentMovie.releaseYear} • ⭐ {currentMovie.tmdbRating}
                                            {currentMovie.genres && currentMovie.genres.length > 0 && (
                                                ` • ${currentMovie.genres.slice(0, 2).join(', ')}`
                                            )}
                                        </p>
                                        {currentMovie.synopsis && (
                                            <p className={styles.synopsis}>{currentMovie.synopsis}</p>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            <div className={styles.actions}>
                                <button 
                                    className={`${styles.actionBtn} ${styles.btnDislike}`}
                                    onClick={() => handleVote(false)}
                                    title="Passar Filme"
                                >
                                    ✕ Passar
                                </button>
                                <button 
                                    className={`${styles.actionBtn} ${styles.btnLike}`}
                                    onClick={() => handleVote(true)}
                                    title="Quero Assistir"
                                >
                                    💚 Assistir
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
                                        onClick={() => { onClose(); onOpenInfo(movie); }}
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
