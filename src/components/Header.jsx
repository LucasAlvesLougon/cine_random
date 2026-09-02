import styles from './Header.module.css';
import { useAuth } from '../contexts/AuthContext'; // Puxando nosso hook!
import { formatUserName } from '../utils/format';

export function Header() {
    const { user, loginGoogle, logout } = useAuth(); // Pega os dados do contexto

    const displayName = formatUserName(user?.email);
    const initial = displayName.charAt(0).toUpperCase();

    return (
    <header className={styles.header}>
        <h1 className={styles.title}>
            <span className={styles.brandRed}>Cine</span>Random
        </h1>

        <div>
        {user ? (
            <div className={styles.userInfo}>
            <span className={styles.greetingText}>Olá, <strong>{displayName}</strong>!</span>
            <div className={styles.avatar}>{initial}</div>
            <button onClick={logout} className={styles.btnAction}>
                Sair
            </button>
            </div>
        ) : (
            <button onClick={loginGoogle} className={styles.btnLogin}>
            Entrar com Google
            </button>
        )}
        </div>
    </header>
    );
}