import styles from './Header.module.css';
import { useAuth } from '../contexts/AuthContext'; // Puxando nosso hook!

export function Header() {
    const { user, loginGoogle, logout } = useAuth(); // Pega os dados do contexto

    return (
    <header className={styles.header}>
        <h1 className={styles.title}>
            <span className={styles.brandRed}>Cine</span>Random
        </h1>

        <div>
        {user ? (
            <div className={styles.userInfo}>
            <span className={styles.greetingText}>Olá, <strong>{user.email.split('@')[0]}</strong>!</span>
            <div className={styles.avatar}>{user.email.charAt(0).toUpperCase()}</div>
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