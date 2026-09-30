
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { InstallPwaModal } from '../Modal/InstallPwaModal';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { getUserCacheKey } from '../../utils/storage';
import { OnboardingModal } from './OnboardingModal';
import styles from './Home.module.css';

const LIST_CACHE_PREFIX = 'cine_random_my_lists_cache';

export function Home({ onSelectList }) {
    const { user } = useAuth();
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const [joinCode, setJoinCode] = useState('');
    const [newListName, setNewListName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [inviteFailed, setInviteFailed] = useState(false);
    const [isInstallOpen, setIsInstallOpen] = useState(false);
    const { isInstallable, isInstalled, isIos, promptInstall } = usePwaInstall();
    const listsCacheKey = user?.id ? getUserCacheKey(LIST_CACHE_PREFIX, user.id) : null;
    const listQueryKey = useMemo(() => ['my-lists', user?.id], [user?.id]);
    const inviteCode = window.location.pathname.match(/^\/join\/([A-Za-z0-9_-]+)\/?$/)?.[1]?.toUpperCase() || '';
    const attemptedInviteRef = useRef('');
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => (
        Boolean(user?.id && !localStorage.getItem(`cine_random_onboarding_seen_${user.id}`))
    ));

    const { data: lists = [], isLoading } = useQuery({
        queryKey: listQueryKey,
        queryFn: async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return [];
            try {
                const res = await api.get('/lists/my');
                try {
                    localStorage.setItem(listsCacheKey, JSON.stringify(res.data));
                } catch (e) {
                    console.error('Erro ao salvar cache de listas:', e);
                }
                return res.data;
            } catch (error) {
                console.error(error);
                const cached = listsCacheKey && localStorage.getItem(listsCacheKey);
                if (cached) return JSON.parse(cached);
                throw error;
            }
        },
        initialData: () => {
            try {
                const cached = listsCacheKey && localStorage.getItem(listsCacheKey);
                return cached ? JSON.parse(cached) : undefined;
            } catch {
                return undefined;
            }
        },
        staleTime: 1000 * 60 * 3, // 3 minutos
    });

    const completeOnboarding = () => {
        if (user?.id) localStorage.setItem(`cine_random_onboarding_seen_${user.id}`, '1');
        setIsOnboardingOpen(false);
    };

    const joinList = useCallback(async (code) => {
        if (!code?.trim() || isJoining) return;
        setInviteFailed(false);
        setIsJoining(true);
        try {
            const res = await api.post('/lists/join/' + code.trim().toUpperCase());
            queryClient.setQueryData(listQueryKey, (old = []) => {
                if (old.some(l => l.id === res.data.id)) return old;
                return [...old, res.data];
            });
            const current = queryClient.getQueryData(listQueryKey) || [];
            if (listsCacheKey) localStorage.setItem(listsCacheKey, JSON.stringify(current));
            queryClient.invalidateQueries({ queryKey: listQueryKey });
            setJoinCode('');
            addToast('Você entrou na lista!', 'success');
            if (inviteCode) {
                window.history.replaceState({}, '', '/');
                onSelectList(res.data);
            }
        } catch (error) {
            if (inviteCode && [400, 409].includes(error.response?.status)) {
                try {
                    const response = await api.get('/lists/my');
                    const existing = response.data.find(list => list.code === code.trim().toUpperCase());
                    if (existing) {
                        window.history.replaceState({}, '', '/');
                        onSelectList(existing);
                        return;
                    }
                } catch {
                    // Mantém o convite aberto para uma nova tentativa manual.
                }
            }
            setJoinCode(code.trim().toUpperCase());
            if (inviteCode) setInviteFailed(true);
            addToast(error.response?.data?.detail || 'Não foi possível aceitar este convite.', 'error');
        } finally {
            setIsJoining(false);
        }
    }, [addToast, inviteCode, isJoining, listQueryKey, listsCacheKey, onSelectList, queryClient]);

    useEffect(() => {
        if (!inviteCode || !user?.id) return;
        if (attemptedInviteRef.current === inviteCode) return;
        attemptedInviteRef.current = inviteCode;
        joinList(inviteCode);
    }, [inviteCode, joinList, user?.id]);

    const handleCreateList = async (e) => {
        e.preventDefault();
        if (!newListName.trim()) return;
        try {
            const res = await api.post('/lists/', { name: newListName });
            
            // Atualização rápida de cache local
            queryClient.setQueryData(listQueryKey, (old = []) => [...old, res.data]);
            try {
                const current = queryClient.getQueryData(listQueryKey) || [];
                localStorage.setItem(listsCacheKey, JSON.stringify(current));
            } catch (err) {
                console.error(err);
            }
            queryClient.invalidateQueries({ queryKey: listQueryKey });

            setNewListName('');
            setIsCreating(false);
            addToast('Lista criada com sucesso!', 'success');
        } catch {
            addToast('Erro ao criar lista', 'error');
        }
    };

    const handleJoinList = async (e) => {
        e.preventDefault();
        await joinList(joinCode);
    };

    const handleSelectList = (list) => {
        if (inviteCode) window.history.replaceState({}, '', '/');
        onSelectList(list);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className={styles.title}>Listas Compartilhadas</h1>
                    <p className={styles.subtitle}>Logado como {user?.email}</p>
                </div>
                <div className={styles.headerActions}>
                    <button type="button" onClick={() => setIsOnboardingOpen(true)} className={styles.helpButton}>Como funciona?</button>
                    {!isInstalled && (isInstallable || isIos) && (
                        <button
                            onClick={() => setIsInstallOpen(true)}
                            style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Instalar App
                        </button>
                    )}
                </div>
            </header>

            <div className={styles.content}>
                {inviteCode && <p className={styles.inviteNotice} role="status">{inviteFailed ? `Não foi possível aceitar o convite para ${inviteCode} automaticamente. Confira o código abaixo ou abra outra lista.` : `Convite para a lista ${inviteCode}. Estamos tentando adicionar você.`}</p>}
                <h2 className={styles.sectionTitle}>Minhas Listas</h2>
                
                <div className={styles.listsGrid}>
                    {isLoading && lists.length === 0 && (
                        <>
                            <div className={styles.skeletonCard} aria-hidden="true">
                                <div>
                                    <div className={styles.skeletonTitle}></div>
                                    <div className={styles.skeletonSub}></div>
                                </div>
                                <div className={styles.skeletonButton}></div>
                            </div>
                            <div className={styles.skeletonCard} aria-hidden="true">
                                <div>
                                    <div className={styles.skeletonTitle}></div>
                                    <div className={styles.skeletonSub}></div>
                                </div>
                                <div className={styles.skeletonButton}></div>
                            </div>
                        </>
                    )}

                    {lists.map(list => (
                        <div key={list.id} className={styles.listCard}>
                            <h3>{list.name}</h3>
                            <p>Código para convidar: <strong>{list.code}</strong></p>
                            <span className={styles.openBtn}>Abrir Lista</span>
                            <button type="button" className={styles.cardAction} onClick={() => handleSelectList(list)} aria-label={`Abrir lista ${list.name}`} />
                        </div>
                    ))}
                    
                    {!isCreating ? (
                        <button type="button" className={styles.createCard} onClick={() => setIsCreating(true)}>
                            <span className={styles.createTitle}>+ Nova Lista</span>
                            <span>Criar uma lista do zero</span>
                        </button>
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
                        <h3>Entrar com código</h3>
                        <p>Já tem um convite?</p>
                        <form onSubmit={handleJoinList} className={styles.joinForm}>
                            <input 
                                type='text' 
                                aria-label='Código da lista'
                                placeholder='Ex: A4B2C9' 
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value)}
                            />
                            <button type='submit' disabled={isJoining}>{isJoining ? 'Entrando...' : 'Entrar'}</button>
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
            <OnboardingModal isOpen={isOnboardingOpen} onClose={completeOnboarding} />
        </div>
    );
}

