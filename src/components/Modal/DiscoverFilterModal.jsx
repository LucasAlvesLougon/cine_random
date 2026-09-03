import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './FilterModals.module.css';

export function DiscoverFilterModal({
    isOpen,
    onClose,
    genre,
    setGenre,
    decade,
    setDecade,
    genres = [],
    decades = []
}) {
    const [tempGenre, setTempGenre] = useState(genre);
    const [tempDecade, setTempDecade] = useState(decade);

    useEffect(() => {
        if (isOpen) {
            setTempGenre(genre);
            setTempDecade(decade);
        }
    }, [isOpen, genre, decade]);

    if (!isOpen) return null;

    const handleReset = () => {
        setTempGenre('');
        setTempDecade('');
    };

    const handleApply = () => {
        setGenre(tempGenre);
        setDecade(tempDecade);
        onClose();
    };

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.headerTitle}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="21" x2="4" y2="14"></line>
                            <line x1="4" y1="10" x2="4" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12" y2="3"></line>
                            <line x1="20" y1="21" x2="20" y2="16"></line>
                            <line x1="20" y1="12" x2="20" y2="3"></line>
                            <line x1="1" y1="14" x2="7" y2="14"></line>
                            <line x1="9" y1="8" x2="15" y2="8"></line>
                            <line x1="17" y1="16" x2="23" y2="16"></line>
                        </svg>
                        Filtros do Modo Descoberta
                    </h3>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.body}>
                    {/* Gênero */}
                    <div className={styles.section}>
                        <span className={styles.sectionLabel}>Gênero do Filme</span>
                        <div className={styles.chipGrid}>
                            {genres.map(opt => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    className={`${styles.chip} ${tempGenre === opt.id ? styles.chipActive : ''}`}
                                    onClick={() => setTempGenre(opt.id)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Época / Década */}
                    <div className={styles.section}>
                        <span className={styles.sectionLabel}>Época de Lançamento</span>
                        <div className={styles.chipGrid}>
                            {decades.map(opt => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    className={`${styles.chip} ${tempDecade === opt.id ? styles.chipActive : ''}`}
                                    onClick={() => setTempDecade(opt.id)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button type="button" onClick={handleReset} className={styles.btnReset}>
                        Limpar
                    </button>
                    <button type="button" onClick={handleApply} className={styles.btnApply}>
                        Aplicar Filtros
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
