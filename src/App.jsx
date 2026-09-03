import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { MovieList } from './components/Movies/MovieList';
import { AddMovie } from './components/Movies/AddMovie';
import { DiscoverRoulette } from './components/Movies/DiscoverRoulette';
import { InfoModal } from './components/Modal/InfoModal';
import { ConfirmModal } from './components/Modal/ConfirmModal';
import { ListHeader } from './components/Movies/ListHeader';
import { Home } from './components/Home/Home';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import { MoviesProvider } from './contexts/MoviesContext';
import { getPeriodOfDay } from './utils/time';
import { GoogleLogin } from '@react-oauth/google';
import { api } from './services/api';
import './App.css';

const ACTIVE_LIST_STORAGE_KEY = 'cine_random_active_list';

function App() {
  const { user, loginEmail, signupEmail, processGoogleToken } = useAuth();
  const { addToast } = useToast();
  
  // Persistência da lista ativa no localStorage para sobreviver a F5/refresh
  const [activeList, setActiveListState] = useState(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_LIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setActiveList = (list) => {
    setActiveListState(list);
    try {
      if (list) {
        localStorage.setItem(ACTIVE_LIST_STORAGE_KEY, JSON.stringify(list));
      } else {
        localStorage.removeItem(ACTIVE_LIST_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Erro ao salvar lista ativa:", e);
    }
  };

  // Se o usuário deslogar, limpa a persistência da lista
  useEffect(() => {
    if (!user) {
      localStorage.removeItem(ACTIVE_LIST_STORAGE_KEY);
      setActiveListState(null);
    }
  }, [user]);

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
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

  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  if (user && !activeList) {
    return (
      <Layout 
        activeList={null}
        onBackToLists={() => setActiveList(null)}
      >
        <Home onSelectList={setActiveList} />
      </Layout>
    );
  }

  return (
    <Layout
      activeList={activeList}
      onOpenMembers={() => setIsMembersOpen(true)}
      onOpenHistory={() => setIsHistoryOpen(true)}
      onBackToLists={() => setActiveList(null)}
    >
      {user && activeList ? (
        <MoviesProvider listCode={activeList.code}>
          <ListHeader 
            activeList={activeList}
            setActiveList={setActiveList}
            onBack={() => setActiveList(null)}
            onDeleteList={(list) => setListToDelete(list)}
            onOpenInfo={setSelectedMovie}
            isMembersOpen={isMembersOpen}
            setIsMembersOpen={setIsMembersOpen}
            isHistoryOpen={isHistoryOpen}
            setIsHistoryOpen={setIsHistoryOpen}
          />
          <div className='actionPanels'>
              <AddMovie onOpenInfo={setSelectedMovie} listCode={activeList?.code} />
              <DiscoverRoulette onOpenInfo={setSelectedMovie} listCode={activeList?.code} />
          </div>
          <MovieList onOpenInfo={setSelectedMovie} />
          
          <InfoModal 
            isOpen={!!selectedMovie} 
            onClose={() => setSelectedMovie(null)} 
            movie={selectedMovie} 
            listCode={activeList?.code}
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
