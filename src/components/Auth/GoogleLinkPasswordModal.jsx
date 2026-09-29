import { useEffect, useState } from 'react';
import styles from './GoogleLinkPasswordModal.module.css';

export function GoogleLinkPasswordModal({
    isOpen,
    isSubmitting,
    error,
    onClose,
    onSubmit,
}) {
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (!isOpen) setPassword('');
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(password);
    };

    return (
        <div className={styles.overlay} role="presentation">
            <div
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="google-link-title"
            >
                <button
                    type="button"
                    className={styles.close}
                    onClick={onClose}
                    aria-label="Fechar"
                    disabled={isSubmitting}
                >
                    &times;
                </button>

                <h2 id="google-link-title">Já existe uma conta com este email.</h2>
                <p>
                    Digite sua senha para confirmar a conta e continuar usando o Google.
                </p>

                {error && <p className={styles.error} role="alert">{error}</p>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <label htmlFor="google-link-password">Senha da conta existente</label>
                    <input
                        id="google-link-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoFocus
                        required
                        autoComplete="current-password"
                    />
                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.cancel}
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={styles.submit}
                            disabled={isSubmitting || !password}
                        >
                            {isSubmitting ? 'Confirmando...' : 'Vincular e entrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
