import styles from './Header.module.css';

export function Header() {
    return (
    <header className={styles.header}>
        <h1 className={styles.title}>🎬 Sorteador de Filmes</h1>
        {/* Futuramente colocaremos o botão de Login/Logout aqui */}
        <div>Usuário não logado</div>
    </header>
    );
}