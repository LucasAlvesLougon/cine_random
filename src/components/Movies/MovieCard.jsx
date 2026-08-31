import { useState } from 'react'; // IMPORTAR useState
import { CommentSection } from '../Comments/CommentSection'; // IMPORTAR O NOVO COMPONENTE
import styles from './MovieCard.module.css';

export function MovieCard({ movie, onToggleWatched, onDelete }) {
    // NOVO ESTADO: controla se a aba de comentários está aberta ou fechada
    const [showComments, setShowComments] = useState(false);

    return (
    <div className={styles.card}>
        {movie.posterUrl ? (
        <img src={movie.posterUrl} alt={movie.title} className={styles.poster} />
        ) : (
        <div className={styles.poster} style={{ backgroundColor: '#444' }} />
        )}

        <div className={styles.info}>
        <h3 className={styles.title}>{movie.title}</h3>
        <p style={{ margin: 0, color: '#aaa' }}>{movie.releaseYear} • ⭐ {movie.tmdbRating}</p>

        <div className={styles.actions}>
            <button onClick={() => onToggleWatched(movie.id, movie.watched)}>
            {movie.watched ? "❌ Desmarcar" : "✅ Assistido"}
            </button>
            <button onClick={() => onDelete(movie.id)} style={{ backgroundColor: '#cc0000' }}>
            Remover
            </button>
        </div>

        {/* NOVO BOTÃO: Mostra/Esconde comentários */}
        <button
            onClick={() => setShowComments(!showComments)}
            style={{ width: '100%', marginTop: '10px', padding: '5px' }}
        >
            {showComments ? "Ocultar Comentários" : "Ver Comentários"}
        </button>

        {/* RENDERIZAÇÃO CONDICIONAL: Só mostra a sessão se showComments for true */}
        {showComments && (
            <CommentSection movieId={movie.id} />
        )}
        </div>
    </div>
    );
}