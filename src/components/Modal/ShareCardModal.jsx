import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../../contexts/ToastContext';
import { getListInviteUrl } from '../../utils/share';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import styles from './ShareCardModal.module.css';

export function ShareCardModal({ isOpen, onClose, movie, listCode }) {
    const dialogRef = useDialogFocus(isOpen && !!movie, onClose);
    const { addToast } = useToast();
    const [copied, setCopied] = useState(false);

    if (!isOpen || !movie) return null;

    const providersText = movie.watchProviders && movie.watchProviders.length > 0
        ? movie.watchProviders.map(p => p.name).join(', ')
        : 'Confira onde assistir no app';

    const inviteUrl = listCode ? getListInviteUrl(listCode) : window.location.origin;
    const shareText = `🍿 Hoje é dia de Sessão Pipoca no Cine Random!\n\n🎬 *${movie.title}* (${movie.releaseYear})\n⭐ Nota TMDB: ${movie.tmdbRating}\n📺 Onde Assistir: ${providersText}\n\nEntre na nossa lista: ${inviteUrl}\nCódigo alternativo: *${listCode || 'CINE'}* 🎟️`;

    const handleCopyText = async () => {
        try {
            await navigator.clipboard.writeText(shareText);
            setCopied(true);
            addToast('Texto do convite copiado para a área de transferência!', 'success');
            setTimeout(() => setCopied(false), 3000);
        } catch {
            addToast('Não foi possível copiar automaticamente.', 'error');
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Sessão Cine Random: ${movie.title}`,
                    text: shareText,
                    url: inviteUrl,
                });
            } catch {
                // Compartilhamento cancelado pelo usuário
            }
        } else {
            handleCopyText();
        }
    };

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div ref={dialogRef} className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Convite da sessão de cinema" tabIndex={-1}>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar convite da sessão">✕</button>

                <div className={styles.cardPreview}>
                    {movie.backdropUrl ? (
                        <div 
                            className={styles.backdrop} 
                            style={{ backgroundImage: `url(${movie.backdropUrl})` }}
                        />
                    ) : (
                        <div className={styles.backdropFallback} />
                    )}
                    
                    <div className={styles.overlayGradient} />

                    <div className={styles.cardContent}>
                        <div className={styles.brandBadge}>🍿 Cine Random • Sessão Pipoca</div>
                        
                        <div className={styles.movieRow}>
                            {movie.posterUrl && (
                                <img src={movie.posterUrl} alt={movie.title} className={styles.poster} />
                            )}
                            <div className={styles.movieDetails}>
                                <h3 className={styles.title}>{movie.title}</h3>
                                <p className={styles.meta}>{movie.releaseYear} • ⭐ {movie.tmdbRating}</p>
                                {movie.genres && (
                                    <p className={styles.genres}>{movie.genres.slice(0, 3).join(', ')}</p>
                                )}
                            </div>
                        </div>

                        {movie.watchProviders && movie.watchProviders.length > 0 && (
                            <div className={styles.streamingSection}>
                                <span className={styles.streamingLabel}>Disponível em:</span>
                                <div className={styles.streamingBadges}>
                                    {movie.watchProviders.map((p, i) => (
                                        <div key={i} className={styles.streamingBadge}>
                                            <img src={p.logoUrl} alt={p.name} />
                                            <span>{p.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {listCode && (
                            <div className={styles.codeBox}>
                                <span>Código da Lista:</span>
                                <strong>{listCode}</strong>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.actions}>
                    <button onClick={handleCopyText} className={styles.btnCopy}>
                        {copied ? '✅ Convite Copiado!' : '📋 Copiar para WhatsApp'}
                    </button>
                    {typeof navigator !== 'undefined' && navigator.share && (
                        <button onClick={handleNativeShare} className={styles.btnShare}>
                            📲 Compartilhar
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
