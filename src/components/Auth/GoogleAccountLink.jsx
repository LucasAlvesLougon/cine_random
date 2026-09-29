import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import styles from './GoogleAccountLink.module.css';

export function GoogleAccountLink() {
    const { linkGoogleAccount } = useAuth();
    const { addToast } = useToast();
    const [isLinking, setIsLinking] = useState(false);
    const [linkDetail, setLinkDetail] = useState('');

    const handleGoogleCredential = async (credentialResponse) => {
        if (!credentialResponse?.credential) {
            addToast('O Google não retornou uma credencial válida.', 'error');
            return;
        }

        setIsLinking(true);
        try {
            const response = await linkGoogleAccount(credentialResponse.credential);
            const detail = response?.detail || 'Conta Google vinculada com sucesso.';
            setLinkDetail(detail);
            addToast(detail, 'success');
        } catch (error) {
            addToast(
                error.response?.data?.detail || 'Não foi possível vincular a conta Google.',
                'error',
            );
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <section className={styles.card} aria-labelledby="google-link-title">
            <div>
                <h2 id="google-link-title" className={styles.title}>Conta Google</h2>
                <p className={styles.description}>
                    Entre com sua senha e vincule o Google para acessar sua conta de qualquer forma.
                </p>
            </div>

            {linkDetail ? (
                <p className={styles.success} role="status">{linkDetail}</p>
            ) : isLinking ? (
                <button type="button" className={styles.loadingButton} disabled>
                    Vinculando Google...
                </button>
            ) : (
                <GoogleLogin
                    onSuccess={handleGoogleCredential}
                    onError={() => addToast('O login Google foi cancelado ou falhou.', 'error')}
                    theme="filled_black"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                />
            )}
        </section>
    );
}
