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
                    <span className={styles.badge}>📜 Memória da Turma</span>
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
                            <div className={styles.emptyIcon}>🍿</div>
                            <h4>Nenhum sorteio registrado ainda</h4>
                            <p>Use a Roleta "Me Surpreenda" ou o "Match da Galera" para sortear o primeiro filme!</p>
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
                                        <div className={styles.noThumbnail}>🎬</div>
                                    )}

                                    <div className={styles.details}>
                                        <div className={styles.topRow}>
                                            <strong className={styles.movieTitle}>{item.movie_title}</strong>
                                            <span className={`${styles.typeBadge} ${item.draw_type === 'match' ? styles.badgeMatch : styles.badgeRoulette}`}>
                                                {item.draw_type === 'match' ? '🔥 Match' : '🎲 Roleta'}
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
