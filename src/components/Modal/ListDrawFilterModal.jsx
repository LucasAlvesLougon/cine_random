import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './FilterModals.module.css';
import { useDialogFocus } from '../../hooks/useDialogFocus';

export function ListDrawFilterModal({
    isOpen,
    onClose,
    includeWatched,
    setIncludeWatched,
    selectedProviders,
    setSelectedProviders,
    availableProviders = []
}) {
    const dialogRef = useDialogFocus(isOpen, onClose);
    const [tempIncludeWatched, setTempIncludeWatched] = useState(includeWatched);
    const [tempProviders, setTempProviders] = useState(selectedProviders);

    useEffect(() => {
        if (isOpen) {
            setTempIncludeWatched(includeWatched);
            setTempProviders(selectedProviders);
        }
    }, [isOpen, includeWatched, selectedProviders]);

    if (!isOpen) return null;

    const toggleProvider = (providerName) => {
        setTempProviders(prev => 
            prev.includes(providerName)
                ? prev.filter(p => p !== providerName)
                : [...prev, providerName]
        );
    };

    const handleReset = () => {
        setTempIncludeWatched(false);
        setTempProviders([]);
    };

    const handleApply = () => {
        setIncludeWatched(tempIncludeWatched);
        setSelectedProviders(tempProviders);
        onClose();
    };

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div ref={dialogRef} className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="list-draw-filter-title" tabIndex={-1}>
                <div className={styles.header}>
                    <h3 id="list-draw-filter-title" className={styles.headerTitle}>
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
                        Filtros de Sorteio da Lista
                    </h3>
                    <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar filtros do sorteio">✕</button>
                </div>

                <div className={styles.body}>
                    {/* Toggle Filmes Assistidos */}
                    <div className={styles.section}>
                        <span className={styles.sectionLabel}>Status dos Filmes</span>
                        <button type="button"
                            className={styles.toggleRow} 
                            onClick={() => setTempIncludeWatched(!tempIncludeWatched)}
                            aria-pressed={tempIncludeWatched}
                        >
                            <div className={styles.toggleInfo}>
                                <span className={styles.toggleTitle}>Incluir filmes assistidos</span>
                                <span className={styles.toggleDesc}>
                                    {tempIncludeWatched ? 'Filmes já vistos podem ser sorteados' : 'Apenas filmes não assistidos serão sorteados'}
                                </span>
                            </div>
                            <div className={`${styles.toggleSwitch} ${tempIncludeWatched ? styles.toggleSwitchActive : ''}`}>
                                <div className={styles.toggleKnob} />
                            </div>
                        </button>
                    </div>

                    {/* Streamings */}
                    {availableProviders.length > 0 && (
                        <div className={styles.section}>
                            <span className={styles.sectionLabel}>Streamings para Sortear</span>
                            <div className={styles.chipGrid}>
                                <button
                                    type="button"
                                    className={`${styles.chip} ${tempProviders.length === 0 ? styles.chipActive : ''}`}
                                    onClick={() => setTempProviders([])}
                                >
                                    Todos os Serviços
                                </button>
                                {availableProviders.map(p => (
                                    <button
                                        key={p.name}
                                        type="button"
                                        className={`${styles.chip} ${tempProviders.includes(p.name) ? styles.chipActive : ''}`}
                                        onClick={() => toggleProvider(p.name)}
                                    >
                                        {p.logoUrl && <img src={p.logoUrl} alt={p.name} className={styles.chipLogo} />}
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
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
