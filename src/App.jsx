import { Layout } from './components/Layout';
  import { MovieList } from './components/Movies/MovieList';
  import { useAuth } from './contexts/AuthContext';
  import './App.css';

  function App() {
    const { user } = useAuth(); // Pegamos o usuário do estado global

    return (
      <Layout>
        {user ? (
          <>
            <h2>Filmes da Lista</h2>
            {/* Futuramente, o campo de adicionar filme (TMDB) entra aqui em cima */}
            <MovieList />
          </>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <h2>Bem-vindo ao Sorteador de Filmes</h2>
            <p>Faça login pelo cabeçalho para ver a sua lista de filmes.</p>
          </div>
        )}
      </Layout>
    );
  }

  export default App;