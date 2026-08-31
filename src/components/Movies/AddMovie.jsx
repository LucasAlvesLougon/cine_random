import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { fetchMovieDetails } from '../../services/tmdb';
import styles from './AddMovie.module.css';

export function AddMovie() {
    const [movieTitle, setMovieTitle] = useState('');
    const [loading, setLoading] = useState(false);

    const listCode = "teste123"; // O mesmo código de lista fixo que usamos na MovieList

    const handleAddMovie = async (e) => {
    e.preventDefault(); // Impede a página de recarregar

    if (!movieTitle.trim()) return; // Se estiver vazio, não faz nada

    try {
        setLoading(true);

        // 1. Vai no TMDB buscar a capa, nota, sinopse, etc.
        const movieData = await fetchMovieDetails(movieTitle);

        // 2. Salva no banco de dados do Firebase
        const moviesRef = collection(db, 'lists', listCode, 'movies');
        await addDoc(moviesRef, movieData);

        // 3. Limpa o input
        setMovieTitle('');
    } catch (error) {
        alert("Não foi possível adicionar o filme. Tente outro nome.");
    } finally {
        setLoading(false);
    }
    };

    return (
    <form className={styles.form} onSubmit={handleAddMovie}>
        <input
        type="text"
        placeholder="Digite o nome de um filme..."
        value={movieTitle}
        onChange={(e) => setMovieTitle(e.target.value)}
        className={styles.input}
        disabled={loading}
        />
        <button type="submit" className={styles.button} disabled={loading}>
        {loading ? 'Buscando...' : 'Adicionar Filme'}
        </button>
    </form>
    );
}