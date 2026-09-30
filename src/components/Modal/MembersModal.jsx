import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmModal } from './ConfirmModal';
import { shareListInvite } from '../../utils/share';
import styles from './MembersModal.module.css';
import { useDialogFocus } from '../../hooks/useDialogFocus';

export function MembersModal({ isOpen, onClose, listCode, isOwner }) {
    const dialogRef = useDialogFocus(isOpen, onClose);
    const { addToast } = useToast();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState(null);

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
            setMemberToRemove(null);
        }
    }, [isOpen, listCode, fetchMembers]);

    if (!isOpen) return null;

    const handleCopyCode = async () => {
        try {
            const res = await shareListInvite({ code: listCode, name: `Lista ${listCode}` });
            if (res.method === 'clipboard') addToast('Link de convite copiado!', 'success');
        } catch {
            addToast('Não foi possível compartilhar o convite.', 'error');
        }
    };

    const handleConfirmRemove = async () => {
        if (!memberToRemove) return;
        try {
            await api.delete(`/lists/${listCode}/members/${memberToRemove.id}`);
            addToast(`${memberToRemove.email} foi removido da lista.`, 'success');
            setMemberToRemove(null);
            fetchMembers();
        } catch (error) {
            addToast(error.response?.data?.detail || 'Erro ao remover participante.', 'error');
        }
    };

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div ref={dialogRef} className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="members-modal-title" tabIndex={-1}>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar participantes">✕</button>

                <div className={styles.header}>
                    <span className={styles.badge}>Cine Clube</span>
                    <h3 id="members-modal-title" className={styles.title}>Participantes da Lista</h3>
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
                                            <span className={styles.ownerBadge}>Criador da Lista</span>
                                        )}
                                    </div>
                                    {isOwner && !member.is_owner && (
                                        <button 
                                            className={styles.btnRemoveMember}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMemberToRemove(member);
                                            }}
                                            title="Remover participante da lista"
                                            aria-label={`Remover ${member.email} da lista`}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button onClick={handleCopyCode} className={styles.btnInvite}>
                        Copiar Link de Convite
                    </button>
                </div>

                <ConfirmModal 
                    isOpen={!!memberToRemove}
                    onClose={() => setMemberToRemove(null)}
                    onConfirm={handleConfirmRemove}
                    title="Remover Participante"
                    message={`Tem certeza que deseja remover ${memberToRemove?.email} desta lista? Esta pessoa não poderá mais acessar nem sortear filmes com o grupo.`}
                    confirmText="Remover"
                />
            </div>
        </div>,
        document.body
    );
}
