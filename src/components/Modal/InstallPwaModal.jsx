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
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff453a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
              <line x1="7" y1="2" x2="7" y2="22"></line>
              <line x1="17" y1="2" x2="17" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <line x1="2" y1="7" x2="7" y2="7"></line>
              <line x1="2" y1="17" x2="7" y2="17"></line>
              <line x1="17" y1="17" x2="22" y2="17"></line>
              <line x1="17" y1="7" x2="22" y2="7"></line>
            </svg>
          </div>
          <h3 className={styles.title}>Instalar Cine Random</h3>
          <p className={styles.subtitle}>
            Acesse seus filmes direto da tela inicial em tela cheia e com abertura instantânea.
          </p>
        </div>

        <div className={styles.content}>
          {isIos ? (
            <div className={styles.iosInstructions}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepText}>
                  Toque no botão de <strong>Compartilhar</strong> na barra inferior do Safari.
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepText}>
                  Role a lista e selecione <strong>Adicionar à Tela de Início</strong>.
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepText}>
                  Toque em <strong>Adicionar</strong> no topo direito para concluir.
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.androidFeatures}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </div>
                <p><strong>0ms de Espera:</strong> Abertura instantânea como app nativo.</p>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                  </svg>
                </div>
                <p><strong>Tela Cheia:</strong> Sem barras de navegação do navegador.</p>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>
                <p><strong>Notificações:</strong> Receba avisos de novos filmes do grupo.</p>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {!isIos && onInstall ? (
            <button className={styles.btnInstall} onClick={onInstall}>
              Instalar Agora no Dispositivo
            </button>
          ) : (
            <button className={styles.btnClose} onClick={onClose}>
              Entendi
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
