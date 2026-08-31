import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { MovieCard } from './MovieCard';
import styles from './MovieList.module.css';

export function MovieList() {
    const [movies, setMovies] = useState([]);
    const listCode = "teste123"; // Código de lista fixo por enquanto

    // useEffect roda quando o componente aparece na tela
    useEffect(() => {
    // Aponta para a coleção no Firestore
    const moviesRef = collection(db, 'lists', listCode, 'movies');

    // onSnapshot escuta as mudanças em TEMPO REAL!
    const unsubscribe = onSnapshot(moviesRef, (snapshot) => {
        const loadedMovies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() // Pega title, watched, posterUrl, etc.
        }));
        setMovies(loadedMovies);
    });

    // Limpa a escuta do banco de dados quando fecharmos a tela
    return () => unsubscribe();
    }, []);

    // Funções para manipular o banco de dados
    const toggleWatched = async (movieId, currentStatus) => {
    const movieRef = doc(db, 'lists', listCode, 'movies', movieId);
    await updateDoc(movieRef, { watched: !currentStatus });
    };

    const deleteMovie = async (movieId) => {
    const movieRef = doc(db, 'lists', listCode, 'movies', movieId);
    await deleteDoc(movieRef);
    };

    if (movies.length === 0) {
    return <p>Nenhum filme na lista. Que tal adicionar um?</p>;
    }

    return (
    <div className={styles.grid}>
        {movies.map(movie => (
        <MovieCard
            key={movie.id}
            movie={movie}
            onToggleWatched={toggleWatched}
            onDelete={deleteMovie}
        />
        ))}
    </div>
    );
}