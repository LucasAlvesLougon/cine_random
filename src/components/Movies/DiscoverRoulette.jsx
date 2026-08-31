import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { fetchRandomMovieByOptions, preloadMovieCache } from '../../services/tmdb';
import { DrawModal } from '../Modal/DrawModal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import styles from './DiscoverRoulette.module.css';

const GENRES = [
    { id: '28', label: 'Ação 💥' },
    { id: '35', label: 'Comédia 😂' },
    { id: '27', label: 'Terror 👻' },
    { id: '878', label: 'Ficção 🚀' },
    { id: '10749', label: 'Romance ❤️' }
];

const DECADES = [
    { id: '1980', label: 'Anos 80 📼' },
    { id: '1990', label: 'Anos 90 🎮' },
    { id: '2000', label: 'Anos 2000 💿' },
    { id: 'recent', label: 'Lançamentos 🍿' }
];

const SUSPENSE_MESSAGES = [
    { title: "Buscando nos arquivos do TMDB..." },
    { title: "Filtrando os melhores..." },
    { title: "Lendo a mente dos críticos..." },
    { title: "Preparando a pipoca..." }
];

export function DiscoverRoulette({ onOpenInfo }) {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [genre, setGenre] = useState('');
    const [decade, setDecade] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [winner, setWinner] = useState(null);
    const [loading, setLoading] = useState(false);

    // Preload cache in the background when filters change!
    useEffect(() => {
        preloadMovieCache(genre, decade);
    }, [genre, decade]);

    const handleDraw = async () => {
        setLoading(true);
        setIsModalOpen(true);
        
        try {
            const movie = await fetchRandomMovieByOptions({ genreId: genre, decade });
            setWinner(movie);
        } catch (e) {
            addToast(e.message || "Erro ao sortear filme.", "error");
            setIsModalOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToList = async (movieData) => {
        try {
            const moviesRef = collection(db, 'lists', 'teste123', 'movies');
            
            const q = query(moviesRef, where("tmdbId", "==", movieData.tmdbId));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                addToast(`O filme já está na sua lista!`, 'error');
                return;
            }

            await addDoc(moviesRef, {
                ...movieData,
                addedBy: user?.uid || 'anonimo',
                createdAt: serverTimestamp()
            });
            addToast("Filme adicionado à sua lista!", "success");
            setIsModalOpen(false);
            setWinner(null);
        } catch (error) {
            console.error("Erro ao adicionar:", error);
            addToast("Erro ao adicionar filme.", "error");
        }
    };

    const renderChips = (options, currentVal, setVal) => (
        <div className={styles.chipGroup}>
            {options.map(opt => (
                <button
                    key={opt.id}
                    className={`${styles.chip} ${currentVal === opt.id ? styles.chipActive : ''}`}
                    onClick={() => setVal(opt.id)}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h3>Modo Descoberta Avançado</h3>
                    <p>Filtre o catálogo mundial e deixe o destino escolher o que você vai assistir hoje.</p>
                </div>
            </div>
            
            <div className={styles.filtersSection}>
                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Gênero:</span>
                    {renderChips(GENRES, genre, setGenre)}
                </div>
                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Época:</span>
                    {renderChips(DECADES, decade, setDecade)}
                </div>
            </div>

            <div className={styles.actionsBlock}>
                <button onClick={handleDraw} disabled={loading} className={styles.drawBtn}>
                    {loading ? 'Sorteando...' : 'Sortear Filme do TMDB 🎲'}
                </button>
            </div>
            
            <DrawModal 
                isOpen={isModalOpen} 
                onClose={() => { setIsModalOpen(false); setWinner(null); }} 
                winnerMovie={winner} 
                unwatchedMovies={SUSPENSE_MESSAGES}
                onAddToList={handleAddToList}
                onOpenInfo={onOpenInfo}
            />
        </div>
    );
}
