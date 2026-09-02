import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MembersModal } from '../components/Modal/MembersModal';
import { ToastProvider } from '../contexts/ToastContext';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
    api: {
        get: vi.fn()
    }
}));

describe('MembersModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('não deve renderizar quando isOpen for false', () => {
        const { container } = render(
            <ToastProvider>
                <MembersModal isOpen={false} onClose={vi.fn()} listCode="MBR01" />
            </ToastProvider>
        );
        expect(container.querySelector('.overlay')).toBeNull();
    });

    it('deve buscar e exibir participantes da lista quando aberto', async () => {
        const mockMembers = [
            { id: 1, email: 'dono@cinema.com', is_owner: true },
            { id: 2, email: 'amigo@cinema.com', is_owner: false }
        ];

        api.get.mockResolvedValueOnce({ data: mockMembers });

        render(
            <ToastProvider>
                <MembersModal isOpen={true} onClose={vi.fn()} listCode="MBR01" />
            </ToastProvider>
        );

        expect(screen.getByText('Participantes da Lista')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('dono@cinema.com')).toBeInTheDocument();
            expect(screen.getByText('👑 Criador da Lista')).toBeInTheDocument();
            expect(screen.getByText('amigo@cinema.com')).toBeInTheDocument();
        });
    });
});
