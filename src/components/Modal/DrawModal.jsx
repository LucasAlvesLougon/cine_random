import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './DrawModal.module.css';
import { fetchExtraMovieDetails } from '../../services/tmdb';
import { getPeriodOfDay } from '../../utils/time';
import { ShareCardModal } from './ShareCardModal';
import { api } from '../../services/api';
import { triggerHaptic } from '../../utils/haptics';

export function DrawModal({ isOpen, onClose, winnerMovie, unwatchedMovies, onAddToList, onOpenInfo, listCode }) {
    const [isSpinning, setIsSpinning] = useState(true);
    const [providers, setProviders] = useState([]);
    const [posterLoaded, setPosterLoaded] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const hasRecordedRef = useRef(false);
    const period = getPeriodOfDay();

    // Resetar estado da imagem quando um novo filme for sorteado
    useEffect(() => {
        setPosterLoaded(false);
        hasRecordedRef.current = false;
    }, [winnerMovie?.tmdbId]);

    // Efeito para buscar os provedores caso o filme sorteado não tenha
    useEffect(() => {
        if (!isOpen || !winnerMovie) {
            setProviders([]);
            return;
        }
        
        if (winnerMovie.watchProviders && winnerMovie.watchProviders.length > 0) {
            setProviders(winnerMovie.watchProviders);
        } else if (winnerMovie.tmdbId) {
            fetchExtraMovieDetails(winnerMovie.tmdbId).then(extras => {
                if (extras.watchProviders) {
                    setProviders(extras.watchProviders);
                }
            }).catch(() => {});
        }
    }, [isOpen, winnerMovie]);

    useEffect(() => {
        if (isOpen) {
            setIsSpinning(true);
            triggerHaptic('medium');
            const timer = setTimeout(() => {
                setIsSpinning(false);
                triggerHaptic('success');
                if (winnerMovie && listCode && !hasRecordedRef.current) {
                    hasRecordedRef.current = true;
                    api.post(`/lists/${listCode}/history`, {
                        movie_id: winnerMovie.id || null,
                        movie_title: winnerMovie.title,
                        movie_poster: winnerMovie.posterUrl || null,
                        draw_type: 'roulette'
                    }).catch(err => console.error('Erro ao salvar no histórico:', err));
                }
            }, 2500); // 2.5s de suspense
            return () => clearTimeout(timer);
        }
    }, [isOpen, winnerMovie, listCode]);

    if (!isOpen) return null;

    const DEFAULT_SLOT_ITEMS = [
        "O Poderoso Chefão", "Matrix", "Interestelar", "Vingadores", "O Iluminado", 
        "Pulp Fiction", "Avatar", "Clube da Luta", "A Origem", "Batman", 
        "Forrest Gump", "O Senhor dos Anéis", "Star Wars", "De Volta Para o Futuro", "Jurassic Park"
    ];

    let baseItems = unwatchedMovies && unwatchedMovies.length > 0 
        ? unwatchedMovies.map(m => m.title) 
        : DEFAULT_SLOT_ITEMS;

    while (baseItems.length < 15) {
        baseItems = [...baseItems, ...baseItems];
    }
    
    const SLOT_ITEMS = [...baseItems, ...baseItems];
    const spinDistance = (SLOT_ITEMS.length / 2) * 100;
    const spinDuration = (SLOT_ITEMS.length / 2) * 0.025;

    return createPortal(
    <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
        
        {isSpinning || !winnerMovie ? (
            <div className={styles.spinningState}>
                <h2 className={styles.spinningTitle}>O destino está escolhendo...</h2>
                
                <div className={styles.slotMachine}>
                    <div 
                        className={styles.slotTrack}
                        style={{ 
                            '--spin-distance': `-${spinDistance}px`,
                            '--spin-duration': `${spinDuration}s`
                        }}
                    >
                        {SLOT_ITEMS.map((title, index) => (
                            <div key={index} className={styles.slotItem}>
                                {title}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            <div className={styles.winnerContent}>
                <div className={styles.winnerBadge}>Sugestão da {period}</div>
                
                <div 
                    className={styles.movieCardFull}
                    onClick={() => {
                        if (onOpenInfo) {
                            onClose();
                            onOpenInfo(winnerMovie);
                        }
                    }}
                >
                    {winnerMovie.posterUrl ? (
                        <img 
                            src={winnerMovie.posterUrl} 
                            alt={winnerMovie.title} 
                            className={`${styles.fullPoster} ${posterLoaded ? styles.loaded : ''}`}
                            onLoad={() => setPosterLoaded(true)}
                        />
                    ) : (
                        <div className={styles.noPosterFull}>🎬</div>
                    )}

                    <div className={styles.fullPosterOverlay} />

                    <div className={styles.cardBottomContent}>
                        <div className={styles.chipsRow}>
                            {winnerMovie.releaseYear && (
                                <span className={styles.chip}>{winnerMovie.releaseYear}</span>
                            )}
                            {winnerMovie.tmdbRating && (
                                <span className={`${styles.chip} ${styles.chipRating}`}>★ {winnerMovie.tmdbRating}</span>
                            )}
                            {winnerMovie.genres && winnerMovie.genres.length > 0 && (
                                <span className={styles.chip}>{winnerMovie.genres[0]}</span>
                            )}
                        </div>

                        <h3 className={styles.movieTitle}>{winnerMovie.title}</h3>

                        {winnerMovie.synopsis && (
                            <p className={styles.movieSynopsis}>
                                {winnerMovie.synopsis.length > 120 
                                    ? winnerMovie.synopsis.substring(0, 120) + '...' 
                                    : winnerMovie.synopsis}
                            </p>
                        )}

                        {/* Onde Assistir */}
                        {providers.length > 0 ? (
                            <div className={styles.providersBlock}>
                                <span className={styles.providersLabel}>Onde assistir:</span>
                                <div className={styles.providersList}>
                                    {providers.slice(0, 4).map(p => (
                                        <img key={p.name} src={p.logoUrl} alt={p.name} title={p.name} className={styles.providerLogo} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className={styles.providersBlock}>
                                <span className={styles.providersLabel}>Alternativa Grátis:</span>
                                <a 
                                    href="https://www.stremio.com/" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className={styles.stremioLink}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Abrir no Stremio
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <button onClick={() => setIsShareModalOpen(true)} className={styles.btnShareAction} title="Compartilhar Sessão">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                            <polyline points="16 6 12 2 8 6"></polyline>
                            <line x1="12" y1="2" x2="12" y2="15"></line>
                        </svg>
                        Criar Convite
                    </button>
                    {onAddToList && (
                        <button onClick={() => onAddToList(winnerMovie)} className={styles.btnAddToList}>
                            Salvar na Lista
                        </button>
                    )}
                    <button onClick={onClose} className={styles.closeButton}>
                        {onAddToList ? "Dispensar" : "Fechar"}
                    </button>
                </div>
            </div>
        )}

        </div>

        <ShareCardModal 
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            movie={winnerMovie}
            listCode={listCode}
        />
    </div>,
    document.body
    );
}