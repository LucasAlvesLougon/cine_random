import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { GoogleLinkPasswordModal } from './components/Auth/GoogleLinkPasswordModal';
import { GoogleLogin } from '@react-oauth/google';
import { api } from './services/api';
import { getUserCacheKey } from './utils/storage';
import './App.css';

const GoogleIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <g>
      <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669 C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62 c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401 c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
    </g>
  </svg>
);

const ACTIVE_LIST_STORAGE_KEY = 'cine_random_active_list';
const LIST_CACHE_PREFIX = 'cine_random_my_lists_cache';

function App() {
  const { user, loginEmail, signupEmail, loginWithGoogle, confirmGoogleLink, loginDemo } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const listQueryKey = ['my-lists', user?.id];
  const listsCacheKey = user?.id ? getUserCacheKey(LIST_CACHE_PREFIX, user.id) : null;
  
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
    if (!user && !localStorage.getItem('access_token')) {
      localStorage.removeItem(ACTIVE_LIST_STORAGE_KEY);
      if (listsCacheKey) localStorage.removeItem(listsCacheKey);
      setActiveListState(null);
    }
  }, [user, listsCacheKey]);

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetToken] = useState(() => new URLSearchParams(window.location.search).get('token') || '');
  const [isPasswordResetView, setIsPasswordResetView] = useState(() => window.location.pathname === '/reset-password');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
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

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setIsResetSubmitting(true);
    try {
      if (resetToken) {
        await api.post('/auth/password-reset/confirm', {
          token: resetToken,
          new_password: resetPassword,
        });
        addToast('Senha redefinida. Faça login com a nova senha.', 'success');
        window.history.replaceState({}, '', '/');
        setIsPasswordResetView(false);
        setIsLoginView(true);
        setResetPassword('');
      } else {
        await api.post('/auth/password-reset/request', { email: resetEmail });
        addToast('Se o email estiver cadastrado, enviaremos as instruções.', 'success');
      }
    } catch (error) {
      addToast(error.response?.data?.detail || 'Não foi possível processar a recuperação.', 'error');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleLinkModalOpen, setIsGoogleLinkModalOpen] = useState(false);
  const [isGoogleLinkSubmitting, setIsGoogleLinkSubmitting] = useState(false);
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState('');
  const [googleLinkError, setGoogleLinkError] = useState('');
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const isDemoAuthEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';

  const handleGoogleCredential = async (credentialResponse) => {
    setIsGoogleLoading(true);
    try {
      if (!credentialResponse?.credential) {
        throw new Error('O Google não retornou uma credencial válida.');
      }
      await loginWithGoogle(credentialResponse.credential);
      addToast('Login com Google realizado com sucesso!', 'success');
    } catch (err) {
      if (err.response?.status === 409) {
        setPendingGoogleCredential(credentialResponse.credential);
        setGoogleLinkError('');
        setIsGoogleLinkModalOpen(true);
      } else {
        addToast(err.response?.data?.detail || err.message || 'Falha ao autenticar com Google.', 'error');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const closeGoogleLinkModal = () => {
    setIsGoogleLinkModalOpen(false);
    setPendingGoogleCredential('');
    setGoogleLinkError('');
  };

  const handleGoogleLinkConfirmation = async (localPassword) => {
    if (!pendingGoogleCredential) return;

    setIsGoogleLinkSubmitting(true);
    setGoogleLinkError('');
    try {
      await confirmGoogleLink(pendingGoogleCredential, localPassword);
      closeGoogleLinkModal();
      addToast('Login com Google realizado com sucesso!', 'success');
    } catch (err) {
      if (err.response?.status === 401) {
        setGoogleLinkError('A senha informada está incorreta.');
      } else {
        setGoogleLinkError(
          err.response?.data?.detail || 'Não foi possível vincular o Google agora.',
        );
      }
    } finally {
      setIsGoogleLinkSubmitting(false);
    }
  };

  const handleGoogleModalLogin = async (selectedEmail) => {
    setIsGoogleLoading(true);
    try {
      await loginDemo(selectedEmail);
      setIsGoogleModalOpen(false);
      addToast('Login com Google realizado com sucesso!', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || err.message || 'Falha ao autenticar com Google.', 'error');
    } finally {
      setIsGoogleLoading(false);
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
                  queryClient.setQueryData(listQueryKey, (old = []) => old.filter(l => l.code !== listToDelete.code));
                  try {
                    const current = queryClient.getQueryData(listQueryKey) || [];
                    if (listsCacheKey) localStorage.setItem(listsCacheKey, JSON.stringify(current));
                  } catch (e) { console.error(e); }
                  queryClient.invalidateQueries({ queryKey: listQueryKey });
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
            
            {isPasswordResetView ? (
              <form onSubmit={handlePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: 'white' }}>{resetToken ? 'Escolha uma nova senha' : 'Recuperar senha'}</h2>
                {!resetToken && <input type='email' placeholder='Seu email' value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: 'white' }} required />}
                {resetToken && <input type='password' placeholder='Nova senha (mínimo 8 caracteres)' value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} minLength={8} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: 'white' }} required />}
                <button type='submit' className='loginBtnBig' disabled={isResetSubmitting}>{isResetSubmitting ? 'Enviando...' : resetToken ? 'Salvar nova senha' : 'Enviar instruções'}</button>
                <button type='button' onClick={() => setIsPasswordResetView(false)} style={{ background: 'none', border: 0, color: 'var(--text-faint)', cursor: 'pointer' }}>Voltar para o login</button>
              </form>
            ) : (
              <>
                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                  <input type='email' placeholder='Seu email' value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: 'white' }} required />
                  <input type='password' placeholder='Sua senha' value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: 'white' }} required />
                  <button type='submit' className='loginBtnBig' style={{ marginTop: '0.5rem' }}>{isLoginView ? 'Entrar com Email' : 'Criar Conta'}</button>
                </form>
                {isLoginView && <button type='button' onClick={() => setIsPasswordResetView(true)} style={{ display: 'block', margin: '-0.5rem auto 1rem', background: 'none', border: 0, color: 'var(--text-faint)', cursor: 'pointer' }}>Esqueci minha senha</button>}
                <p onClick={() => setIsLoginView(!isLoginView)} style={{ cursor: 'pointer', color: 'var(--text-faint)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem' }}>{isLoginView ? 'Ainda não tem conta? Criar' : 'Já tem conta? Fazer login'}</p>
              </>
            )}

            {!isPasswordResetView && <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>OU</span>
              <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
            </div>}

            {!isPasswordResetView && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              {isGoogleLoading ? (
                <button type="button" className="googleLoginBtn" disabled>
                  <span className="googleSpinner" />
                  <span>Entrando com Google...</span>
                </button>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleCredential}
                  onError={() => addToast('Login com Google cancelado ou indisponível.', 'error')}
                  theme="filled_black"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                />
              )}

              {isDemoAuthEnabled && <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-faint, #777)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '4px 8px',
                  }}
                >
                  Simular contas Google / Demo
                </button>
              </div>}
            </div>}
          </div>
        </div>
      )}

      {isDemoAuthEnabled && isGoogleModalOpen && (
        <div className="googleModalOverlay" onClick={() => setIsGoogleModalOpen(false)}>
          <div className="googleModalContent" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="googleModalClose"
              onClick={() => setIsGoogleModalOpen(false)}
              aria-label="Fechar"
            >
              &times;
            </button>

            <div className="googleModalHeader">
              <GoogleIcon style={{ width: '24px', height: '24px' }} />
              <div>
                <h3>Fazer login com o Google</h3>
                <p>Escolha uma conta para continuar em Cine Random</p>
              </div>
            </div>

            <div className="googleAccountsList">
              <button
                type="button"
                onClick={() => handleGoogleModalLogin('lucas@gmail.com', 'Lucas Lougon')}
                disabled={isGoogleLoading}
                className="googleAccountCard"
              >
                <div className="googleAccountAvatar" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                  L
                </div>
                <div className="googleAccountInfo">
                  <div className="googleAccountName">Lucas Lougon</div>
                  <div className="googleAccountEmail">lucas@gmail.com</div>
                </div>
                <span className="googleCheckmark">✓</span>
              </button>

              <button
                type="button"
                onClick={() => handleGoogleModalLogin('demo@cinerandom.com', 'Cinéfilo Demo')}
                disabled={isGoogleLoading}
                className="googleAccountCard"
              >
                <div className="googleAccountAvatar" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                  C
                </div>
                <div className="googleAccountInfo">
                  <div className="googleAccountName">Cinéfilo Demo</div>
                  <div className="googleAccountEmail">demo@cinerandom.com</div>
                </div>
                <span className="googleCheckmark">✓</span>
              </button>
            </div>

            <div className="googleModalDivider">
              <p>Ou use outro e-mail Google:</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customGoogleEmail) {
                    handleGoogleModalLogin(customGoogleEmail, customGoogleEmail.split('@')[0]);
                  }
                }}
                className="googleCustomEmailForm"
              >
                <input
                  type="email"
                  placeholder="outro@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={!customGoogleEmail || isGoogleLoading}
                  className="googleCustomSubmitBtn"
                >
                  Entrar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <GoogleLinkPasswordModal
        isOpen={isGoogleLinkModalOpen}
        isSubmitting={isGoogleLinkSubmitting}
        error={googleLinkError}
        onClose={closeGoogleLinkModal}
        onSubmit={handleGoogleLinkConfirmation}
      />
    </Layout>
  );
}

export default App;
