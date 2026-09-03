import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './FilterModals.module.css';

export function CatalogFilterModal({
    isOpen,
    onClose,
    filter,
    setFilter,
    sortBy = 'added_desc',
    setSortBy,
    selectedGenre,
    setSelectedGenre,
    selectedProviders,
    setSelectedProviders,
    availableGenres = [],
    availableProviders = []
}) {
    const [tempFilter, setTempFilter] = useState(filter);
    const [tempSortBy, setTempSortBy] = useState(sortBy);
    const [tempGenre, setTempGenre] = useState(selectedGenre);
    const [tempProviders, setTempProviders] = useState(selectedProviders);

    useEffect(() => {
        if (isOpen) {
            setTempFilter(filter);
            setTempSortBy(sortBy);
            setTempGenre(selectedGenre);
            setTempProviders(selectedProviders);
        }
    }, [isOpen, filter, sortBy, selectedGenre, selectedProviders]);

    if (!isOpen) return null;

    const toggleProvider = (providerName) => {
        setTempProviders(prev => 
            prev.includes(providerName) 
                ? prev.filter(p => p !== providerName) 
                : [...prev, providerName]
        );
    };

    const handleReset = () => {
        setTempFilter('all');
        setTempSortBy('added_desc');
        setTempGenre('');
        setTempProviders([]);
    };

    const handleApply = () => {
        setFilter(tempFilter);
        if (setSortBy) setSortBy(tempSortBy);
        setSelectedGenre(tempGenre);
        setSelectedProviders(tempProviders);
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
                        Filtros do Catálogo de Filmes
                    </h3>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.body}>
                    {/* Status de Visualização */}
                    <div className={styles.section}>
                        <span className={styles.sectionLabel}>Status</span>
                        <div className={styles.chipGrid}>
                            <button
                                type="button"
                                className={`${styles.chip} ${tempFilter === 'all' ? styles.chipActive : ''}`}
                                onClick={() => setTempFilter('all')}
                            >
                                Todos os Filmes
                            </button>
                            <button
                                type="button"
                                className={`${styles.chip} ${tempFilter === 'unwatched' ? styles.chipActive : ''}`}
                                onClick={() => setTempFilter('unwatched')}
                            >
                                Para Assistir
                            </button>
                            <button
                                type="button"
                                className={`${styles.chip} ${tempFilter === 'watched' ? styles.chipActive : ''}`}
                                onClick={() => setTempFilter('watched')}
                            >
                                Já Assistidos
                            </button>
                        </div>
                    </div>

                    {/* Ordenação do Catálogo */}
                    <div className={styles.section}>
                        <span className={styles.sectionLabel}>Ordenar por</span>
                        <div className={styles.chipGrid}>
                            <button
                                type="button"
                                className={`${styles.chip} ${tempSortBy === 'added_desc' ? styles.chipActive : ''}`}
                                onClick={() => setTempSortBy('added_desc')}
                            >
                                📅 Recentes Adicionados
                            </button>
                            <button
                                type="button"
                                className={`${styles.chip} ${tempSortBy === 'added_asc' ? styles.chipActive : ''}`}
                                onClick={() => setTempSortBy('added_asc')}
                            >
                                ⏳ Antigos Adicionados
                            </button>
                            <button
                                type="button"
                                className={`${styles.chip} ${tempSortBy === 'release_desc' ? styles.chipActive : ''}`}
                                onClick={() => setTempSortBy('release_desc')}
                            >
                                🎬 Lançamento Mais Novo
                            </button>
                            <button
                                type="button"
                                className={`${styles.chip} ${tempSortBy === 'release_asc' ? styles.chipActive : ''}`}
                                onClick={() => setTempSortBy('release_asc')}
                            >
                                🎞️ Clássicos / Mais Antigos
                            </button>
                            <button
                                type="button"
                                className={`${styles.chip} ${tempSortBy === 'rating_desc' ? styles.chipActive : ''}`}
                                onClick={() => setTempSortBy('rating_desc')}
                            >
                                ⭐ Melhor Avaliados
                            </button>
                            <button
                                type="button"
                                className={`${styles.chip} ${tempSortBy === 'rating_asc' ? styles.chipActive : ''}`}
                                onClick={() => setTempSortBy('rating_asc')}
                            >
                                📉 Menor Avaliação
                            </button>
                        </div>
                    </div>

                    {/* Gêneros */}
                    {availableGenres.length > 0 && (
                        <div className={styles.section}>
                            <span className={styles.sectionLabel}>Gêneros</span>
                            <div className={styles.chipGrid}>
                                <button
                                    type="button"
                                    className={`${styles.chip} ${tempGenre === '' ? styles.chipActive : ''}`}
                                    onClick={() => setTempGenre('')}
                                >
                                    Todos os Gêneros
                                </button>
                                {availableGenres.map(g => (
                                    <button
                                        key={g}
                                        type="button"
                                        className={`${styles.chip} ${tempGenre === g ? styles.chipActive : ''}`}
                                        onClick={() => setTempGenre(g)}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Streamings */}
                    {availableProviders.length > 0 && (
                        <div className={styles.section}>
                            <span className={styles.sectionLabel}>Onde Assistir (Streamings)</span>
                            <div className={styles.chipGrid}>
                                <button
                                    type="button"
                                    className={`${styles.chip} ${tempProviders.length === 0 ? styles.chipActive : ''}`}
                                    onClick={() => setTempProviders([])}
                                >
                                    Todos os Streamings
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
