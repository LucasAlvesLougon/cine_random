import styles from './Header.module.css';
import { useAuth } from '../contexts/AuthContext'; // Puxando nosso hook!

export function Header() {
    const { user, loginGoogle, logout } = useAuth(); // Pega os dados do contexto

    return (
    <header className={styles.header}>
        <h1 className={styles.title}>🎬 Sorteador de Filmes</h1>

        <div>
        {user ? (
            // Se o usuário existir (estiver logado), mostra os dados e botão Sair
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>Olá, {user.displayName || user.email}!</span>
            <button onClick={logout} style={{ padding: '5px 10px', cursor: 'pointer' }}>
                Sair
            </button>
            </div>
        ) : (
            // Se não estiver logado, mostra botão de Entrar
            <button onClick={loginGoogle} style={{ padding: '5px 10px', cursor: 'pointer' }}>
            Entrar com Google
            </button>
        )}
        </div>
    </header>
    );
}