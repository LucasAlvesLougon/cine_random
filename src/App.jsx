import {Layout} from './components/Layout';
import {Loading} from './components/Loading';
import './App.css'

function App() {
  const estaCarregando = false;
  
  return (
    <Layout>
      {}
      {estaCarregando ? (
        <Loading />
      ) : (
        <div>
          <h2>Bem-vindo à sua lista de filmes!</h2>
          <p>Aqui entrarão os cards dos filmes na próxima tarefa.</p>
        </div>
      )}
    </Layout>
  );
}

export default App