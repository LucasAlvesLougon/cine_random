import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { OnboardingModal } from '../components/Home/OnboardingModal';

describe('OnboardingModal', () => {
    it('não renderiza quando está fechado', () => {
        const { container } = render(<OnboardingModal isOpen={false} onClose={vi.fn()} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('apresenta o fluxo inicial e conclui ao começar', () => {
        const onClose = vi.fn();

        render(<OnboardingModal isOpen={true} onClose={onClose} />);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Sua próxima sessão começa aqui' })).toBeInTheDocument();
        expect(screen.getByText('Crie uma lista')).toBeInTheDocument();
        expect(screen.getByText('Convide amigos')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Começar agora' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
