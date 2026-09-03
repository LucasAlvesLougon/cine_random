import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './DrawModal.module.css';
import { api } from '../../services/api';
import { triggerHaptic } from '../../utils/haptics';

export function DrawModal({ isOpen, onClose, winnerMovie, unwatchedMovies, onOpenInfo, listCode }) {
    const hasRecordedRef = useRef(false);

    useEffect(() => {
        hasRecordedRef.current = false;
    }, [winnerMovie?.tmdbId, winnerMovie?.id]);

    useEffect(() => {
        if (isOpen) {
            triggerHaptic('medium');
            const timer = setTimeout(() => {
                triggerHaptic('success');
                if (winnerMovie) {
                    if (listCode && !hasRecordedRef.current) {
                        hasRecordedRef.current = true;
                        api.post(`/lists/${listCode}/history`, {
                            movie_id: winnerMovie.id || null,
                            movie_title: winnerMovie.title,
                            movie_poster: winnerMovie.posterUrl || null,
                            draw_type: 'roulette'
                        }).catch(err => console.error('Erro ao salvar no histórico:', err));
                    }
                    if (onOpenInfo) {
                        onOpenInfo(winnerMovie);
                    }
                    onClose();
                }
            }, 2200); // 2.2s de suspense girando a roleta
            return () => clearTimeout(timer);
        }
    }, [isOpen, winnerMovie, listCode, onOpenInfo, onClose]);

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
    const spinDistance = (SLOT_ITEMS.length / 2) * 90;
    const spinDuration = (SLOT_ITEMS.length / 2) * 0.025;

    return createPortal(
    <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
            
            <div className={styles.spinningState}>
                <div className={styles.badge}>Sorteando Filme</div>
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

                <p className={styles.spinningSubtitle}>Preparando a melhor recomendação para sua sessão...</p>
            </div>
        </div>
    </div>,
    document.body
    );
}