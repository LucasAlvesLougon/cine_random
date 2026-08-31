import styles from './MovieCard.module.css';

// Recebemos o filme via "props"
export function MovieCard({ movie, onToggleWatched, onDelete }) {
    return (
    <div className={styles.card}>
        {/* Se não tiver pôster, colocamos um cinza */}
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
        </div>
    </div>
    );
}