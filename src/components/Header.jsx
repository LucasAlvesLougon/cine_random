import { useState } from 'react';
import styles from './Header.module.css';
import { useAuth } from '../contexts/AuthContext';
import { formatUserName } from '../utils/format';
import { InstallPwaModal } from './Modal/InstallPwaModal';
import { SidebarDrawer } from './Navigation/SidebarDrawer';
import { usePwaInstall } from '../hooks/usePwaInstall';

export function Header({ 
    activeList = null, 
    onOpenMembers = () => {}, 
    onOpenHistory = () => {}, 
    onBackToLists = null 
}) {
    const { user, logout } = useAuth();
    const [isInstallOpen, setIsInstallOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { isInstallable, isInstalled, isIos, promptInstall } = usePwaInstall();

    const displayName = formatUserName(user?.email);
    const initial = displayName.charAt(0).toUpperCase();

    return (
    <>
        <header className={styles.header}>
            <div className={styles.brandWrapper}>
                {user && (
                    <button 
                        onClick={() => setIsDrawerOpen(true)}
                        className={styles.btnMenu}
                        title="Abrir Menu Lateral"
                        aria-label="Menu Lateral"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                )}

                <h1 className={styles.title}>
                    <span className={styles.brandRed}>Cine</span>Random
                </h1>
            </div>

            <div>
            {user && (
                <div className={styles.userInfo}>
                {!isInstalled && (
                    <button 
                        onClick={() => {
                            if (isInstallable) {
                                promptInstall();
                            } else {
                                setIsInstallOpen(true);
                            }
                        }}
                        className={styles.btnInstallHeader}
                        title="Instalar Cine Random no celular ou computador"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Instalar App
                    </button>
                )}
                <span className={styles.greetingText}>Olá, <strong>{displayName}</strong>!</span>
                <div className={styles.avatar}>{initial}</div>
                <button onClick={logout} className={styles.btnAction}>
                    Sair
                </button>
                </div>
            )}
            </div>
        </header>

        {/* Menu Lateral Esquerdo */}
        <SidebarDrawer 
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            activeList={activeList}
            onOpenMembers={onOpenMembers}
            onOpenHistory={onOpenHistory}
            onBackToLists={onBackToLists}
            onOpenInstall={() => setIsInstallOpen(true)}
            isInstallable={isInstallable}
            isInstalled={isInstalled}
            isIos={isIos}
        />

        <InstallPwaModal 
            isOpen={isInstallOpen}
            onClose={() => setIsInstallOpen(false)}
            isIos={isIos}
            onInstall={async () => {
                await promptInstall();
                setIsInstallOpen(false);
            }}
        />
    </>
    );
}