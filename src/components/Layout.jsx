import { Header } from './Header';
import styles from './Layout.module.css';

// A propriedade 'children' representa tudo que for colocado DENTRO do Layout
export function Layout({ children }) {
    return (
    <div className={styles.container}>
        <Header />
        <main className={styles.mainContent}>
        {children}
        </main>
    </div>
    );
}