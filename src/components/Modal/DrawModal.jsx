import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './DrawModal.module.css';
import { fetchExtraMovieDetails } from '../../services/tmdb';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const SLOT_ITEMS = [
    "O Poderoso Chefão", "Matrix", "Interestelar", "Vingadores", "O Iluminado", 
    "Pulp Fiction", "Avatar", "Clube da Luta", "A Origem", "Batman", 
    "Forrest Gump", "O Senhor dos Anéis", "Star Wars", "De Volta Para o Futuro", "Jurassic Park",
    // Loop
    "O Poderoso Chefão", "Matrix", "Interestelar", "Vingadores", "O Iluminado", 
    "Pulp Fiction", "Avatar", "Clube da Luta", "A Origem", "Batman", 
    "Forrest Gump", "O Senhor dos Anéis", "Star Wars", "De Volta Para o Futuro", "Jurassic Park"
];

export function DrawModal({ isOpen, onClose, winnerMovie, unwatchedMovies, onAddToList, onOpenInfo }) {
    const [isSpinning, setIsSpinning] = useState(true);
    const [spinTitle, setSpinTitle] = useState('');
    const [providers, setProviders] = useState([]);

    // Efeito para buscar os provedores caso o filme sorteado seja antigo e não tenha
    useEffect(() => {
        if (!isOpen || !winnerMovie) {
            setProviders([]);
            return;
        }
        
        if (winnerMovie.watchProviders) {
            setProviders(winnerMovie.watchProviders);
        } else if (winnerMovie.tmdbId) {
            fetchExtraMovieDetails(winnerMovie.tmdbId).then(extras => {
                setProviders(extras.watchProviders);
                if (winnerMovie.id && !onAddToList) {
                    const movieRef = doc(db, 'lists', 'teste123', 'movies', winnerMovie.id);
                    updateDoc(movieRef, { watchProviders: extras.watchProviders, trailerKey: extras.trailerKey }).catch(() => {});
                }
            });
        }
    }, [isOpen, winnerMovie, onAddToList]);

    useEffect(() => {
        if (isOpen) {
            if (!winnerMovie) {
                setIsSpinning(true);
            } else {
                // Suspense digno de cassino! Roda por 2.5s para apreciar o caça-níqueis
                const timer = setTimeout(() => {
                    setIsSpinning(false);
                }, 2500);
                return () => clearTimeout(timer);
            }
        }
    }, [isOpen, winnerMovie]);

    if (!isOpen) return null;

    return createPortal(
    <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
        
        {isSpinning || !winnerMovie ? (
            <div className={styles.spinningState}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '16px' }}>O destino está escolhendo...</h2>
                
                <div className={styles.slotMachine}>
                    <div className={styles.slotTrack}>
                        {SLOT_ITEMS.map((item, index) => (
                            <div key={index} className={styles.slotItem}>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
                
            </div>
        ) : (
            <div className={styles.winnerContent}>
                <h2 className={styles.winnerHeader}>Sugestão da Noite:</h2>
                
                <div 
                    className={styles.movieInfoCard}
                    onClick={() => {
                        if (onOpenInfo) {
                            onClose();
                            onOpenInfo(winnerMovie);
                        }
                    }}
                >
                    <img src={winnerMovie.posterUrl} alt={winnerMovie.title} className={styles.winnerPoster} />
                    <div className={styles.movieDetails}>
                        <h3 className={styles.movieTitle}>{winnerMovie.title}</h3>
                        <div className={styles.movieMeta}>
                            {winnerMovie.releaseYear} • ⭐ {winnerMovie.tmdbRating}
                        </div>
                        <p className={styles.movieSynopsis}>
                            {winnerMovie.synopsis 
                                ? (winnerMovie.synopsis.length > 110 ? winnerMovie.synopsis.substring(0, 110) + '...' : winnerMovie.synopsis) 
                                : "Sinopse não disponível para este título."}
                        </p>
                        
                        {providers.length > 0 ? (
                            <div className={styles.providersBlock}>
                                <span>Onde assistir:</span>
                                <div className={styles.providersList}>
                                    {providers.slice(0, 4).map(p => (
                                        <img key={p.name} src={p.logoUrl} alt={p.name} title={p.name} className={styles.providerLogo} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className={styles.providersBlock}>
                                <span>Alternativa Grátis:</span>
                                <a href="https://www.stremio.com/" target="_blank" rel="noopener noreferrer" className={styles.stremioLink}>
                                    Abrir no Stremio 🟣
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.modalActions}>
                    {onAddToList && (
                        <button onClick={() => onAddToList(winnerMovie)} className={styles.btnAddToList}>
                            Salvar na Lista 📌
                        </button>
                    )}
                    <button onClick={onClose} className={styles.closeButton}>
                        {onAddToList ? "Dispensar" : "Fechar"}
                    </button>
                </div>
            </div>
        )}

        </div>
    </div>,
    document.body
    );
}