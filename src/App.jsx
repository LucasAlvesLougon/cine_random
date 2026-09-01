import { useState } from 'react';
import { Layout } from './components/Layout';
import { MovieList } from './components/Movies/MovieList';
import { AddMovie } from './components/Movies/AddMovie';
import { DiscoverRoulette } from './components/Movies/DiscoverRoulette';
import { InfoModal } from './components/Modal/InfoModal';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import { getPeriodOfDay } from './utils/time';
import { GoogleLogin } from '@react-oauth/google';
import './App.css';

function App() {
  const { user, loginEmail, signupEmail, processGoogleToken } = useAuth();
  const { addToast } = useToast();
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  
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
    } catch (error) {
      addToast("Falha ao se conectar com nosso Servidor via Google.", "error");
    }
  };

  return (
    <Layout>
      {user ? (
        <>
          <h2 style={{ padding: '0 40px', margin: '0 0 24px', fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.03em' }}>
            Sua {period} de Cinema
          </h2>
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
        </>
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

