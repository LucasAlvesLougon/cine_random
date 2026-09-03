import { createPortal } from 'react-dom';
import styles from './InstallPwaModal.module.css';

export function InstallPwaModal({ isOpen, onClose, isIos, onInstall }) {
  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <div className={styles.iconHeader}>
          <div className={styles.appIconWrapper}>
            <span className={styles.appEmoji}>🍿</span>
          </div>
          <h3 className={styles.title}>Instalar Cine Random</h3>
          <p className={styles.subtitle}>
            Acesse seus filmes direto da tela inicial em tela cheia e com abertura instantânea!
          </p>
        </div>

        <div className={styles.content}>
          {isIos ? (
            <div className={styles.iosInstructions}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepText}>
                  Toque no botão de <strong>Compartilhar</strong> <span className={styles.iosIcon}>📤</span> na barra inferior do Safari.
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepText}>
                  Role a lista e selecione <strong>Adicionar à Tela de Início</strong> <span className={styles.iosIcon}>➕</span>.
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepText}>
                  Toque em <strong>Adicionar</strong> no topo direito para concluir! 🎉
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.androidFeatures}>
              <div className={styles.featureItem}>
                <span>⚡</span>
                <p><strong>0ms de Espera:</strong> Abertura instantânea como app nativo.</p>
              </div>
              <div className={styles.featureItem}>
                <span>📱</span>
                <p><strong>Tela Cheia:</strong> Sem barras de navegação do browser.</p>
              </div>
              <div className={styles.featureItem}>
                <span>🔔</span>
                <p><strong>Notificações:</strong> Receba avisos de novos filmes do grupo.</p>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {!isIos && onInstall ? (
            <button className={styles.btnInstall} onClick={onInstall}>
              📲 Instalar Agora no Celular
            </button>
          ) : (
            <button className={styles.btnClose} onClick={onClose}>
              Entendi!
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
