import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import styles from './HistoryModal.module.css';

export function HistoryModal({ isOpen, onClose, listCode, onOpenInfo }) {
    const { addToast } = useToast();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
        if (!listCode) return;
        setLoading(true);
        try {
            const res = await api.get(`/lists/${listCode}/history?limit=30`);
            setHistory(res.data);
        } catch (error) {
            console.error(error);
            addToast('Não foi possível carregar o histórico.', 'error');
        } finally {
            setLoading(false);
        }
    }, [listCode, addToast]);

    useEffect(() => {
        if (isOpen && listCode) {
            fetchHistory();
        }
    }, [isOpen, listCode, fetchHistory]);

    if (!isOpen) return null;

    const formatDate = (isoString) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return isoString;
        }
    };

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>

                <div className={styles.header}>
                    <span className={styles.badge}>Sorteios Recentes</span>
                    <h3 className={styles.title}>Histórico de Sorteios</h3>
                    <p className={styles.subtitle}>Filmes sorteados e selecionados nas sessões anteriores</p>
                </div>

                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.emptyState}>
                            <div className={styles.spinner} />
                            <p>Carregando histórico...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                                    <line x1="7" y1="2" x2="7" y2="22"></line>
                                    <line x1="17" y1="2" x2="17" y2="22"></line>
                                    <line x1="2" y1="12" x2="22" y2="12"></line>
                                </svg>
                            </div>
                            <h4>Nenhum sorteio registrado ainda</h4>
                            <p>Use a Roleta ou o Match da Galera para sortear o primeiro filme do grupo.</p>
                        </div>
                    ) : (
                        <div className={styles.timeline}>
                            {history.map(item => (
                                <div 
                                    key={item.id} 
                                    className={styles.historyItem}
                                    onClick={() => {
                                        if (item.movie_id) {
                                            onClose();
                                            onOpenInfo({ id: item.movie_id, title: item.movie_title, posterUrl: item.movie_poster });
                                        }
                                    }}
                                >
                                    {item.movie_poster ? (
                                        <img src={item.movie_poster} alt={item.movie_title} className={styles.thumbnail} />
                                    ) : (
                                        <div className={styles.noThumbnail}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                                            </svg>
                                        </div>
                                    )}

                                    <div className={styles.details}>
                                        <div className={styles.topRow}>
                                            <strong className={styles.movieTitle}>{item.movie_title}</strong>
                                            <span className={`${styles.typeBadge} ${item.draw_type === 'match' ? styles.badgeMatch : styles.badgeRoulette}`}>
                                                {item.draw_type === 'match' ? 'Match' : 'Roleta'}
                                            </span>
                                        </div>
                                        <span className={styles.date}>{formatDate(item.drawn_at)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
