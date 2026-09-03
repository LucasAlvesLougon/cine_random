import { useState } from 'react';
import styles from './Header.module.css';
import { useAuth } from '../contexts/AuthContext';
import { formatUserName } from '../utils/format';
import { InstallPwaModal } from './Modal/InstallPwaModal';
import { usePwaInstall } from '../hooks/usePwaInstall';

export function Header() {
    const { user, logout } = useAuth();
    const [isInstallOpen, setIsInstallOpen] = useState(false);
    const { isInstallable, isInstalled, isIos, promptInstall } = usePwaInstall();

    const displayName = formatUserName(user?.email);
    const initial = displayName.charAt(0).toUpperCase();

    return (
    <>
        <header className={styles.header}>
            <h1 className={styles.title}>
                <span className={styles.brandRed}>Cine</span>Random
            </h1>

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
                        📲 Instalar App
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