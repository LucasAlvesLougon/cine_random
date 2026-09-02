import { useState } from 'react';
import { Layout } from './components/Layout';
import { MovieList } from './components/Movies/MovieList';
import { AddMovie } from './components/Movies/AddMovie';
import { DiscoverRoulette } from './components/Movies/DiscoverRoulette';
import { InfoModal } from './components/Modal/InfoModal';
import { ConfirmModal } from './components/Modal/ConfirmModal';
import { Home } from './components/Home/Home';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import { MoviesProvider } from './contexts/MoviesContext';
import { getPeriodOfDay } from './utils/time';
import { GoogleLogin } from '@react-oauth/google';
import { api } from './services/api';
import './App.css';

function App() {
  const { user, loginEmail, signupEmail, processGoogleToken } = useAuth();
  const { addToast } = useToast();
  const [activeList, setActiveList] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [listToDelete, setListToDelete] = useState(null);
  
  const period = getPeriodOfDay();

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLoginView) {
        await loginEmail(email, password);
      } else {
        await signupEmail(email, password);
      }
    } catch (error) {
      console.error(error);
      if (error.response?.status === 400) {
        addToast(error.response.data.detail || "Erro ao criar conta.", "error");
      } else if (error.response?.status === 401) {
        addToast("Email ou senha incorretos.", "error");
      } else {
        addToast("Erro na autenticação. Verifique os dados e tente novamente.", "error");
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await processGoogleToken(credentialResponse.credential);
    } catch {
      addToast("Falha ao se conectar com nosso Servidor via Google.", "error");
    }
  };

  if (user && !activeList) {
    return (
      <Layout>
        <Home onSelectList={setActiveList} />
      </Layout>
    );
  }

  return (
    <Layout>
      {user && activeList ? (
        <MoviesProvider listCode={activeList.code}>
          <div className="activeListHeader">
            <button 
              onClick={() => setActiveList(null)} 
              title="Voltar para Minhas Listas"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = 'var(--text)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = 'var(--text-secondary)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            {isEditingName ? (
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (newListName.trim() && newListName !== activeList.name) {
                  try {
                    await api.put(`/lists/${activeList.code}`, { name: newListName, code: activeList.code });
                    setActiveList({ ...activeList, name: newListName });
                  } catch (error) {
                    addToast(error.response?.data?.detail || "Erro ao renomear lista.", "error");
                  }
                }
                setIsEditingName(false);
              }} style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                <input 
                  type="text" 
                  value={newListName} 
                  onChange={(e) => setNewListName(e.target.value)} 
                  autoFocus
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', outline: 'none', width: '100%' }}
                />
                <button type="submit" style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Salvar</button>
                <button type="button" onClick={() => setIsEditingName(false)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cancelar</button>
              </form>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', minWidth: 0 }}>
                <h2 className="activeListTitle" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                  {activeList.name}
                </h2>
                <button
                  onClick={() => {
                    setNewListName(activeList.name);
                    setIsEditingName(true);
                  }}
                  title="Renomear Lista"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = 'var(--text)'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = 'var(--text-secondary)'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button
                  onClick={() => setListToDelete(activeList)}
                  title="Excluir Lista"
                  style={{ background: 'rgba(255, 69, 58, 0.1)', border: '1px solid rgba(255, 69, 58, 0.2)', color: '#ff453a', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={(e) => { e.target.style.background = 'rgba(255, 69, 58, 0.2)'; e.target.style.borderColor = 'rgba(255, 69, 58, 0.3)'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'rgba(255, 69, 58, 0.1)'; e.target.style.borderColor = 'rgba(255, 69, 58, 0.2)'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              </div>
            )}
          </div>
          <div className='actionPanels'>
              <AddMovie onOpenInfo={setSelectedMovie} />
              <DiscoverRoulette onOpenInfo={setSelectedMovie} />
          </div>
          <MovieList onOpenInfo={setSelectedMovie} />
          
          <InfoModal 
            isOpen={!!selectedMovie} 
            onClose={() => setSelectedMovie(null)} 
            movie={selectedMovie} 
          />
          <ConfirmModal 
            isOpen={!!listToDelete}
            onClose={() => setListToDelete(null)}
            onConfirm={async () => {
                try {
                  await api.delete(`/lists/${listToDelete.code}`);
                  setActiveList(null);
                  addToast("Lista excluída com sucesso.", "success");
                } catch (error) {
                  addToast(error.response?.data?.detail || "Erro ao excluir lista.", "error");
                }
            }}
            title="Excluir Lista"
            message="Tem certeza que deseja excluir esta lista? Todos os filmes serão apagados e os convidados perderão o acesso. Esta ação não pode ser desfeita."
          />
        </MoviesProvider>
      ) : (
        <div className='loginHero'>
          <div className='loginCard'>
            <h1 className='loginTitle'>Sua {period} de Cinema.</h1>
            <p className='loginSubtitle'>Acesse sua conta para organizar seus filmes.</p>
            
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <input 
                type='email' 
                placeholder='Seu email' 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: 'white' }}
                required 
              />
              <input 
                type='password' 
                placeholder='Sua senha' 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: 'white' }}
                required 
              />
              <button type='submit' className='loginBtnBig' style={{ marginTop: '0.5rem' }}>
                {isLoginView ? 'Entrar com Email' : 'Criar Conta'}
              </button>
            </form>
            
            <p 
              onClick={() => setIsLoginView(!isLoginView)}
              style={{ cursor: 'pointer', color: 'var(--text-faint)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem' }}
            >
              {isLoginView ? 'Ainda não tem conta? Criar' : 'Já tem conta? Fazer login'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>OU</span>
              <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', colorScheme: 'light' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => { addToast("Login com Google cancelado ou falhou.", "error"); }}
                theme='filled_black'
                shape='pill'
                size='large'
                text='continue_with'
              />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;

