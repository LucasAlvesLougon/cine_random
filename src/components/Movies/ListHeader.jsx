import { useState } from 'react';
import { useMovies } from '../../contexts/MoviesContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { HistoryModal } from '../Modal/HistoryModal';
import { MembersModal } from '../Modal/MembersModal';

export function ListHeader({ 
    activeList, 
    setActiveList, 
    onBack, 
    onDeleteList, 
    onOpenInfo,
    isHistoryOpen = false,
    setIsHistoryOpen = () => {},
    isMembersOpen = false,
    setIsMembersOpen = () => {}
}) {
    const { movies } = useMovies();
    const { user } = useAuth();
    const { addToast } = useToast();
    const [isEditingName, setIsEditingName] = useState(false);
    const [newListName, setNewListName] = useState(activeList.name);

    const isOwner = user && activeList && (
        activeList.owner_id === user.id || 
        activeList.owner_email === user.email || 
        activeList.owner === user.email
    );

    const unwatchedCount = movies.filter(m => !m.watched).length;
    const watchedCount = movies.filter(m => m.watched).length;

    const handleRename = async (e) => {
        e.preventDefault();
        if (newListName.trim() && newListName !== activeList.name) {
            try {
                await api.put(`/lists/${activeList.code}`, { name: newListName, code: activeList.code });
                setActiveList({ ...activeList, name: newListName });
                addToast('Lista renomeada com sucesso!', 'success');
            } catch (error) {
                addToast(error.response?.data?.detail || 'Erro ao renomear lista.', 'error');
            }
        }
        setIsEditingName(false);
    };

    return (
        <div className="activeListHeader">
            <div className="activeListHeaderMain">
                <button 
                    onClick={onBack} 
                    title="Voltar para Minhas Listas"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '10px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>

                {isEditingName ? (
                    <form onSubmit={handleRename} style={{ display: 'flex', gap: '10px', alignItems: 'center', minWidth: '260px' }}>
                        <input 
                            type="text" 
                            value={newListName} 
                            onChange={(e) => setNewListName(e.target.value)} 
                            autoFocus
                            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', outline: 'none', width: '100%' }}
                        />
                        <button type="submit" style={{ background: '#30d158', color: '#000', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase' }}>Salvar</button>
                        <button type="button" onClick={() => setIsEditingName(false)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase' }}>Cancelar</button>
                    </form>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <h2 className="activeListTitle" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                            {activeList.name}
                        </h2>
                        
                        <button
                            onClick={() => {
                                setNewListName(activeList.name);
                                setIsEditingName(true);
                            }}
                            title="Renomear Lista"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        
                        <button
                            onClick={() => onDeleteList(activeList)}
                            title="Excluir Lista"
                            style={{ background: 'rgba(255, 69, 58, 0.1)', border: '1px solid rgba(255, 69, 58, 0.2)', color: '#ff453a', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Apenas estatísticas minimalistas da lista */}
            <div className="activeListStats">
                <div className="statsPill">
                    {movies.length} {movies.length === 1 ? 'filme' : 'filmes'}
                    {movies.length > 0 && ` (${unwatchedCount} para ver • ${watchedCount} vistos)`}
                </div>
            </div>

            <HistoryModal 
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                listCode={activeList.code}
                onOpenInfo={onOpenInfo}
            />

            <MembersModal 
                isOpen={isMembersOpen}
                onClose={() => setIsMembersOpen(false)}
                listCode={activeList.code}
                isOwner={isOwner}
            />
        </div>
    );
}
