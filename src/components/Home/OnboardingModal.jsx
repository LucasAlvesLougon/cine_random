import styles from './OnboardingModal.module.css';

const steps = [
    { title: 'Crie uma lista', text: 'Dê um nome para a sua sessão de cinema.' },
    { title: 'Adicione filmes', text: 'Busque títulos no catálogo ou use o Modo Descoberta.' },
    { title: 'Convide amigos', text: 'Compartilhe um link para todos colaborarem na mesma lista.' },
    { title: 'Escolha juntos', text: 'Use a roleta para decidir o filme da noite.' },
];

export function OnboardingModal({ isOpen, onClose }) {
    if (!isOpen) return null;
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
            <div className={styles.modal}>
                <div className={styles.eyebrow}>COMECE EM 2 MINUTOS</div>
                <h2 id="onboarding-title">Sua próxima sessão começa aqui</h2>
                <p className={styles.subtitle}>Organize os filmes, convide o grupo e deixe o Cine Random decidir quando bater a dúvida.</p>
                <ol className={styles.steps}>
                    {steps.map((step, index) => (
                        <li key={step.title}>
                            <span className={styles.number}>{index + 1}</span>
                            <div><strong>{step.title}</strong><p>{step.text}</p></div>
                        </li>
                    ))}
                </ol>
                <button type="button" className={styles.primary} onClick={onClose}>Começar agora</button>
                <button type="button" className={styles.secondary} onClick={onClose}>Fechar</button>
            </div>
        </div>
    );
}
