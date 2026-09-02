import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import styles from './MembersModal.module.css';

export function MembersModal({ isOpen, onClose, listCode }) {
    const { addToast } = useToast();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchMembers = useCallback(async () => {
        if (!listCode) return;
        setLoading(true);
        try {
            const res = await api.get(`/lists/${listCode}/members`);
            setMembers(res.data);
        } catch (error) {
            console.error(error);
            addToast('Não foi possível carregar os participantes.', 'error');
        } finally {
            setLoading(false);
        }
    }, [listCode, addToast]);

    useEffect(() => {
        if (isOpen && listCode) {
            fetchMembers();
        }
    }, [isOpen, listCode, fetchMembers]);

    if (!isOpen) return null;

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(listCode);
            addToast(`Código ${listCode} copiado para convidar amigos!`, 'success');
        } catch {
            addToast('Não foi possível copiar o código.', 'error');
        }
    };

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>

                <div className={styles.header}>
                    <span className={styles.badge}>👥 Cine Clube</span>
                    <h3 className={styles.title}>Participantes da Lista</h3>
                    <p className={styles.subtitle}>Membros que podem votar, adicionar e sortear filmes</p>
                </div>

                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.emptyState}>
                            <div className={styles.spinner} />
                            <p>Carregando membros...</p>
                        </div>
                    ) : members.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>Nenhum participante encontrado.</p>
                        </div>
                    ) : (
                        <div className={styles.memberList}>
                            {members.map(member => (
                                <div key={member.id} className={styles.memberItem}>
                                    <div className={styles.avatar}>
                                        {member.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={styles.memberDetails}>
                                        <span className={styles.email}>{member.email}</span>
                                        {member.is_owner && (
                                            <span className={styles.ownerBadge}>👑 Criador da Lista</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button onClick={handleCopyCode} className={styles.btnInvite}>
                        🎟️ Copiar Código de Convite ({listCode})
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
