import { useState } from 'react';
import { Layout } from './components/Layout';
import { MovieList } from './components/Movies/MovieList';
import { AddMovie } from './components/Movies/AddMovie';
import { DiscoverRoulette } from './components/Movies/DiscoverRoulette';
import { InfoModal } from './components/Modal/InfoModal';
import { useAuth } from './contexts/AuthContext';
import './App.css';

function App() {
  const { user, loginGoogle } = useAuth(); // Pegamos o usuário do estado global
  const [selectedMovie, setSelectedMovie] = useState(null);

  return (
    <Layout>
      {user ? (
        <>
          <h2 style={{ padding: '0 40px', margin: '0 0 24px', fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.03em' }}>
            Sua Noite de Cinema
          </h2>
          <div className="actionPanels">
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
        <div className="loginHero">
          <div className="loginCard">
            <h1 className="loginTitle">Sua Noite de Cinema.</h1>
            <p className="loginSubtitle">Sincronize listas, sorteie filmes e decida o que assistir com a família e amigos em uma experiência premium.</p>
            <button onClick={loginGoogle} className="loginBtnBig">
              Iniciar com o Google
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;