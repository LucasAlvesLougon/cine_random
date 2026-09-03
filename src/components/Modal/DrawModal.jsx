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

    // Efeito para buscar os provedores caso o filme sorteado seja antigo e não tenha
    useEffect(() => {
        if (!isOpen || !winnerMovie) {
            setProviders([]);
            return;
        }
        
        if (winnerMovie.watchProviders) {
            setProviders(winnerMovie.watchProviders);
        } else if (winnerMovie.tmdbId) {
            fetchExtraMovieDetails(winnerMovie.tmdbId).then(extras => {
                setProviders(extras.watchProviders);
                if (winnerMovie.id && !onAddToList) {
                    // API update would go here if needed
                }
            });
        }
    }, [isOpen, winnerMovie, onAddToList]);

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
            }, 2500); // Exatos 2.5s de suspense
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

    // Se a lista de filmes for muito pequena (ex: só 2 filmes), repetimos até ter no mínimo 15 
    // para garantir que o caça-níqueis tenha "massa" suficiente para girar rápido sem quebrar
    while (baseItems.length < 15) {
        baseItems = [...baseItems, ...baseItems];
    }
    
    // Duplicamos a lista final para garantir o loop perfeito de 50%
    const SLOT_ITEMS = [...baseItems, ...baseItems];
    
    // Distância exata da metade da lista
    const spinDistance = (SLOT_ITEMS.length / 2) * 100;
    
    // O segredo do loop perfeito: a duração TEM que escalar de acordo com a distância
    // Se não, listas gigantes giram na velocidade da luz e quebram a interface.
    // Cada item leva exatos 0.025s para passar na tela.
    const spinDuration = (SLOT_ITEMS.length / 2) * 0.025;

    return createPortal(
    <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
        
        {isSpinning || !winnerMovie ? (
            <div className={styles.spinningState}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 500, color: 'var(--text-secondary)', margin: '0 0 24px' }}>O destino está escolhendo...</h2>
                
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
                <h2 className={styles.winnerHeader}>Sugestão da {period}:</h2>
                
                <div 
                    className={styles.movieInfoCard}
                    onClick={() => {
                        if (onOpenInfo) {
                            onClose();
                            onOpenInfo(winnerMovie);
                        }
                    }}
                >
                    <img 
                        src={winnerMovie.posterUrl} 
                        alt={winnerMovie.title} 
                        className={`${styles.winnerPoster} ${posterLoaded ? styles.loaded : ''}`}
                        onLoad={() => setPosterLoaded(true)}
                    />
                    <div className={styles.movieDetails}>
                        <h3 className={styles.movieTitle}>{winnerMovie.title}</h3>
                        <div className={styles.movieMeta}>
                            {winnerMovie.releaseYear} • ⭐ {winnerMovie.tmdbRating}
                        </div>
                        <p className={styles.movieSynopsis}>
                            {winnerMovie.synopsis 
                                ? (winnerMovie.synopsis.length > 110 ? winnerMovie.synopsis.substring(0, 110) + '...' : winnerMovie.synopsis) 
                                : "Sinopse não disponível para este título."}
                        </p>
                        
                        {providers.length > 0 ? (
                            <div className={styles.providersBlock}>
                                <span>Onde assistir:</span>
                                <div className={styles.providersList}>
                                    {providers.slice(0, 4).map(p => (
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

                <div className={styles.modalActions}>
                    <button onClick={() => setIsShareModalOpen(true)} className={styles.btnShareAction} title="Compartilhar Sessão">
                        📸 Convite
                    </button>
                    {onAddToList && (
                        <button onClick={() => onAddToList(winnerMovie)} className={styles.btnAddToList}>
                            Salvar na Lista 📌
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