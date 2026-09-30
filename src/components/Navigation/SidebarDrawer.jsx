import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { shareListInvite } from '../../utils/share';
import { formatUserName } from '../../utils/format';
import styles from './SidebarDrawer.module.css';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { useReducedMotion } from 'framer-motion';

export function SidebarDrawer({ 
    isOpen, 
    onClose, 
    activeList, 
    onOpenMembers, 
    onOpenHistory, 
    onBackToLists,
    onOpenInstall,
    isInstallable,
    isInstalled,
    isIos
}) {
    const dialogRef = useDialogFocus(isOpen, onClose);
    const reduceMotion = useReducedMotion();
    const { user, logout } = useAuth();
    const { addToast } = useToast();

    const displayName = formatUserName(user?.email);
    const initial = displayName.charAt(0).toUpperCase();

    const handleCopyCode = async () => {
        if (!activeList) return;
        try {
            const res = await shareListInvite({ code: activeList.code, name: activeList.name });
            if (res.method === 'clipboard') addToast('Link direto e código de convite copiados!', 'success');
        } catch {
            addToast('Não foi possível compartilhar o convite.', 'error');
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2 }}
                        className={styles.backdrop} 
                        onClick={onClose} 
                    />

                    {/* Drawer Painel Lateral */}
                    <motion.div 
                        initial={reduceMotion ? false : { x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
                        className={styles.drawer}
                        onClick={(e) => e.stopPropagation()}
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Menu de navegação"
                        tabIndex={-1}
                    >
                        <div className={styles.drawerHeader}>
                            <div className={styles.brand}>
                                <span className={styles.brandRed}>Cine</span>Random
                            </div>
                            <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar menu">
                                ✕
                            </button>
                        </div>

                        <div className={styles.drawerContent}>
                            {/* Sessão da Lista Ativa */}
                            {activeList ? (
                                <div className={styles.section}>
                                    <span className={styles.sectionTitle}>Lista Ativa</span>
                                    <div className={styles.listCard}>
                                        <div className={styles.listCardHeader}>
                                            <h4>{activeList.name}</h4>
                                            <span className={styles.listCodeBadge}>{activeList.code}</span>
                                        </div>

                                        <div className={styles.menuNav}>
                                            <button 
                                                className={styles.menuItem}
                                                onClick={() => { onClose(); onOpenMembers(); }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="9" cy="7" r="4"></circle>
                                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                                </svg>
                                                <span>Participantes</span>
                                            </button>

                                            <button 
                                                className={styles.menuItem}
                                                onClick={() => { onClose(); onOpenHistory(); }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <polyline points="12 6 12 12 16 14"></polyline>
                                                </svg>
                                                <span>Histórico de Sorteios</span>
                                            </button>

                                            <button 
                                                className={styles.menuItem}
                                                onClick={handleCopyCode}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                </svg>
                                                <span>Convidar amigos</span>
                                            </button>

                                            {onBackToLists && (
                                                <button 
                                                    className={`${styles.menuItem} ${styles.menuItemSwitch}`}
                                                    onClick={() => { onClose(); onBackToLists(); }}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="15 18 9 12 15 6"></polyline>
                                                    </svg>
                                                    <span>Trocar de Lista</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.section}>
                                    <span className={styles.sectionTitle}>Navegação</span>
                                    <p className={styles.emptyNote}>Selecione ou crie uma lista para ver participantes e histórico.</p>
                                </div>
                            )}

                            {/* App PWA Install */}
                            {!isInstalled && (isInstallable || isIos) && onOpenInstall && (
                                <div className={styles.section}>
                                    <button 
                                        className={styles.btnInstallDrawer}
                                        onClick={() => { onClose(); onOpenInstall(); }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                        <span>Instalar no Dispositivo</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Rodapé com Conta do Usuário */}
                        <div className={styles.drawerFooter}>
                            {user && (
                                <div className={styles.userSection}>
                                    <div className={styles.avatar}>{initial}</div>
                                    <div className={styles.userDetails}>
                                        <strong>{displayName}</strong>
                                        <span>{user.email}</span>
                                    </div>
                                    <button onClick={() => { onClose(); logout(); }} className={styles.btnLogout} aria-label="Sair da conta">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                            <polyline points="16 17 21 12 16 7"></polyline>
                                            <line x1="21" y1="12" x2="9" y2="12"></line>
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
