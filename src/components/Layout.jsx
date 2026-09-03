import { Header } from './Header';
import styles from './Layout.module.css';

export function Layout({ 
    children, 
    activeList = null, 
    onOpenMembers = () => {}, 
    onOpenHistory = () => {}, 
    onBackToLists = null 
}) {
    return (
    <div className={styles.container}>
        <Header 
            activeList={activeList}
            onOpenMembers={onOpenMembers}
            onOpenHistory={onOpenHistory}
            onBackToLists={onBackToLists}
        />
        <main className={styles.mainContent}>
        {children}
        </main>
    </div>
    );
}