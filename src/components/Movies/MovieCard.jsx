import { useState } from 'react';
import { triggerHaptic } from '../../utils/haptics';
import styles from './MovieCard.module.css';

// Adicionamos a prop onOpenInfo
export function MovieCard({ movie, onToggleWatched, onDelete, onOpenInfo }) {
    const [imgLoaded, setImgLoaded] = useState(false);

    const groupRating = movie.comments && movie.comments.length > 0
        ? (movie.comments.reduce((acc, c) => acc + (c.rating || 0), 0) / movie.comments.length).toFixed(1)
        : null;

    return (
    <div className={styles.card}>
        <div className={styles.posterWrapper} onClick={() => onOpenInfo(movie)}>
            {movie.posterUrl ? (
                <img 
                    src={movie.posterUrl} 
                    alt={movie.title} 
                    className={`${styles.poster} ${imgLoaded ? styles.loaded : ''}`} 
                    onLoad={() => setImgLoaded(true)}
                />
            ) : (
                <div className={styles.poster} style={{ backgroundColor: '#222' }} />
            )}

            {movie.watchProviders && movie.watchProviders.length > 0 && (
                <div className={styles.providerBadges} title={movie.watchProviders.map(p => p.name).join(', ')}>
                    {movie.watchProviders.slice(0, 3).map((p, idx) => (
                        <img key={idx} src={p.logoUrl} alt={p.name} className={styles.providerBadge} />
                    ))}
                    {movie.watchProviders.length > 3 && (
                        <span className={styles.moreProviders}>+{movie.watchProviders.length - 3}</span>
                    )}
                </div>
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
                {groupRating && (
                    <>
                        <span style={{color: 'var(--text-faint)'}}> • </span>
                        <span className={styles.groupRating} title={`Média do Grupo: ${groupRating} (${movie.comments.length} avaliações)`}>
                            👥 ★ {groupRating}
                        </span>
                    </>
                )}
            </div>

            <div className={styles.actions}>
                <button 
                    onClick={() => {
                        triggerHaptic('light');
                        onToggleWatched(movie.id, movie.watched);
                    }}
                    className={`${styles.btn} ${movie.watched ? styles.isWatched : ''}`}
                >
                    {movie.watched ? (
                        <>
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Assistido
                        </>
                    ) : (
                        <>
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Marcar
                        </>
                    )}
                </button>
                <button 
                    onClick={() => {
                        triggerHaptic('warning');
                        onDelete(movie.id);
                    }}
                    className={`${styles.btn} ${styles.btnDelete}`}
                    title="Remover"
                >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
    );
}