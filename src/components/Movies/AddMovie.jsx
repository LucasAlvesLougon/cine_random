import { useState } from 'react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { fetchMovieDetails } from '../../services/tmdb';
import { DrawModal } from '../Modal/DrawModal';
import { useToast } from '../../contexts/ToastContext';
import styles from './AddMovie.module.css';

export function AddMovie({ onOpenInfo }) {
    const { addToast } = useToast();
    const [movieTitle, setMovieTitle] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [winner, setWinner] = useState(null);
    const [unwatchedMovies, setUnwatchedMovies] = useState([]);

    const listCode = "teste123";

    const handleAddMovie = async (e) => {
        e.preventDefault();
        if (!movieTitle.trim()) return;

        try {
            setLoading(true);
            const movieData = await fetchMovieDetails(movieTitle);
            const moviesRef = collection(db, 'lists', listCode, 'movies');
            
            const q = query(moviesRef, where("tmdbId", "==", movieData.tmdbId));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                addToast(`"${movieData.title}" já existe na sua lista!`, 'error');
                setMovieTitle('');
                return;
            }

            await addDoc(moviesRef, movieData);
            setMovieTitle('');
            addToast(`${movieData.title} foi salvo na lista!`, 'success');
        } catch (error) {
            addToast("Não foi possível adicionar o filme. Verifique o nome e tente novamente.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDrawFromList = async () => {
        try {
            const moviesRef = collection(db, 'lists', listCode, 'movies');
            const snapshot = await getDocs(moviesRef);
            const allMovies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const unwatched = allMovies.filter(m => !m.watched);
            
            if (unwatched.length === 0) {
                addToast("Nenhum filme não assistido na sua lista! Adicione novos filmes.", 'error');
                return;
            }
            
            setUnwatchedMovies(unwatched);
            const randomIndex = Math.floor(Math.random() * unwatched.length);
            
            setWinner(null);
            setIsModalOpen(true);
            
            setTimeout(() => {
                setWinner(unwatched[randomIndex]);
            }, 300);
            
        } catch (error) {
            console.error(error);
            addToast("Erro ao processar o sorteio.", 'error');
        }
    };

    return (
    <div className={styles.container}>
        <div className={styles.header}>
            <h3>Sua Lista do Grupo</h3>
            <p>Adicione filmes para assistir com seus amigos ou faça um sorteio com o que vocês já têm.</p>
        </div>
        
        <div className={styles.actionsBlock}>
            <form className={styles.form} onSubmit={handleAddMovie}>
                <input
                    type="text"
                    placeholder="Nome do filme..."
                    value={movieTitle}
                    onChange={(e) => setMovieTitle(e.target.value)}
                    className={styles.input}
                    disabled={loading}
                />
                <button type="submit" className={styles.button} disabled={loading}>
                    {loading ? 'Buscando...' : 'Adicionar'}
                </button>
            </form>

            <button onClick={handleDrawFromList} className={styles.drawBtn}>
                Sortear da Nossa Lista 🎲
            </button>
        </div>

        <DrawModal 
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setWinner(null); }}
            winnerMovie={winner}
            unwatchedMovies={unwatchedMovies}
            onOpenInfo={onOpenInfo}
        />
    </div>
    );
}