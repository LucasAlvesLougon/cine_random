import styles from './MovieCard.module.css';

// Adicionamos a prop onOpenInfo
export function MovieCard({ movie, onToggleWatched, onDelete, onOpenInfo }) {
    return (
    <div className={styles.card}>
        <div className={styles.posterWrapper} onClick={() => onOpenInfo(movie)}>
            {movie.posterUrl ? (
                <img src={movie.posterUrl} alt={movie.title} className={styles.poster} />
            ) : (
                <div className={styles.poster} style={{ backgroundColor: '#222' }} />
            )}
        </div>

        <div className={styles.info}>
            <h3 
                className={styles.title} 
                onClick={() => onOpenInfo(movie)}
                style={{ cursor: 'pointer' }}
            >
                {movie.title}
            </h3>
            <div className={styles.meta}>
                {movie.releaseYear} <span style={{color: 'var(--text-faint)'}}>•</span> ⭐ {movie.tmdbRating}
            </div>

            <div className={styles.actions}>
                <button
                    onClick={() => onToggleWatched(movie.id, movie.watched)}
                    className={`${styles.btn} ${movie.watched ? styles.isWatched : ''}`}
                >
                    {movie.watched ? "Assistido" : "Marcar Assistido"}
                </button>
                <button
                    onClick={() => onDelete(movie.id)}
                    className={`${styles.btn} ${styles.btnDelete}`}
                    title="Remover"
                >
                    🗑️
                </button>
            </div>
        </div>
    </div>
    );
}