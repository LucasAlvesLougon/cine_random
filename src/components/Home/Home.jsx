
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { InstallPwaModal } from '../Modal/InstallPwaModal';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import styles from './Home.module.css';

export function Home({ onSelectList }) {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [lists, setLists] = useState([]);
    const [joinCode, setJoinCode] = useState('');
    const [newListName, setNewListName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isInstallOpen, setIsInstallOpen] = useState(false);
    const { isInstallable, isInstalled, isIos, promptInstall } = usePwaInstall();

    const fetchMyLists = async () => {
        try {
            const res = await api.get('/lists/my');
            setLists(res.data);
        } catch (error) {
            console.error(error);
            addToast('Erro ao buscar suas listas', 'error');
        }
    };
    
    useEffect(() => {
        fetchMyLists();
    }, []);

    const handleCreateList = async (e) => {
        e.preventDefault();
        if (!newListName.trim()) return;
        try {
            // Generate a random 6-character code
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            await api.post('/lists/', { name: newListName, code });
            setNewListName('');
            setIsCreating(false);
            fetchMyLists();
            addToast('Lista criada com sucesso!', 'success');
        } catch {
            addToast('Erro ao criar lista', 'error');
        }
    };

    const handleJoinList = async (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;
        try {
            await api.post('/lists/join/' + joinCode.trim());
            setJoinCode('');
            fetchMyLists();
            addToast('Você entrou na lista!', 'success');
        } catch (error) {
            addToast(error.response?.data?.detail || 'Erro ao entrar na lista', 'error');
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className={styles.title}>Listas Compartilhadas</h1>
                    <p className={styles.subtitle}>Logado como {user?.email}</p>
                </div>
                {!isInstalled && (isInstallable || isIos) && (
                    <button 
                        onClick={() => setIsInstallOpen(true)}
                        style={{ background: 'rgba(52, 199, 89, 0.15)', border: '1px solid rgba(52, 199, 89, 0.35)', color: '#30d158', padding: '8px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Instalar App
                    </button>
                )}
            </header>

            <div className={styles.content}>
                <h2 className={styles.sectionTitle}>Minhas Listas</h2>
                
                <div className={styles.listsGrid}>
                    {lists.map(list => (
                        <div key={list.id} className={styles.listCard} onClick={() => onSelectList(list)}>
                            <h3>{list.name}</h3>
                            <p>Código para convidar: <strong>{list.code}</strong></p>
                            <span className={styles.openBtn}>Abrir Lista</span>
                        </div>
                    ))}
                    
                    {!isCreating ? (
                        <div className={styles.createCard} onClick={() => setIsCreating(true)}>
                            <h3>+ Nova Lista</h3>
                            <p>Criar uma lista do zero</p>
                        </div>
                    ) : (
                        <div className={styles.createFormCard}>
                            <form onSubmit={handleCreateList}>
                                <h3>Nova Lista</h3>
                                <input 
                                    type='text' 
                                    placeholder='Nome da Lista' 
                                    value={newListName}
                                    onChange={e => setNewListName(e.target.value)}
                                    autoFocus
                                />
                                <div className={styles.formActions}>
                                    <button type='button' onClick={() => setIsCreating(false)}>Cancelar</button>
                                    <button type='submit' className={styles.primaryBtn}>Criar</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className={styles.joinCard}>
                        <h3>Entrar com Código</h3>
                        <p>Já tem um convite?</p>
                        <form onSubmit={handleJoinList} className={styles.joinForm}>
                            <input 
                                type='text' 
                                placeholder='Ex: A4B2C9' 
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value)}
                            />
                            <button type='submit'>Entrar</button>
                        </form>
                    </div>
                </div>
            </div>

            <InstallPwaModal 
                isOpen={isInstallOpen}
                onClose={() => setIsInstallOpen(false)}
                isIos={isIos}
                onInstall={async () => {
                    await promptInstall();
                    setIsInstallOpen(false);
                }}
            />
        </div>
    );
}

