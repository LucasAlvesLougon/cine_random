import styles from './Header.module.css';
import { useAuth } from '../contexts/AuthContext'; // Puxando nosso hook!

export function Header() {
    const { user, loginGoogle, logout } = useAuth(); // Pega os dados do contexto

    return (
    <header className={styles.header}>
        <h1 className={styles.title}>
            <span className={styles.brandPurple}>Cine</span>Random
        </h1>

        <div>
        {user ? (
            <div className={styles.userInfo}>
            <span>Olá, <strong>{user.displayName || user.email}</strong>!</span>
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