import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MembersModal } from '../components/Modal/MembersModal';
import { ToastProvider } from '../contexts/ToastContext';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
    api: {
        get: vi.fn(),
        delete: vi.fn()
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
            expect(screen.getByText('Criador da Lista')).toBeInTheDocument();
            expect(screen.getByText('amigo@cinema.com')).toBeInTheDocument();
        });

        // Não deve mostrar botão de remover quando isOwner for false
        expect(screen.queryByTitle('Remover participante da lista')).toBeNull();
    });

    it('deve exibir botão de remover participante se o usuário for o criador da lista e abrir modal de confirmação', async () => {
        const mockMembers = [
            { id: 1, email: 'dono@cinema.com', is_owner: true },
            { id: 2, email: 'amigo@cinema.com', is_owner: false }
        ];

        api.get.mockResolvedValue({ data: mockMembers });
        api.delete.mockResolvedValueOnce({ data: { message: 'Removido' } });

        render(
            <ToastProvider>
                <MembersModal isOpen={true} onClose={vi.fn()} listCode="MBR01" isOwner={true} />
            </ToastProvider>
        );

        await waitFor(() => {
            expect(screen.getByTitle('Remover participante da lista')).toBeInTheDocument();
        });

        // Clica no botão de remover com fireEvent
        const removeBtn = screen.getByTitle('Remover participante da lista');
        fireEvent.click(removeBtn);

        // O ConfirmModal deve abrir
        expect(screen.getByText('Remover Participante')).toBeInTheDocument();
        expect(screen.getByText(/Tem certeza que deseja remover amigo@cinema.com/)).toBeInTheDocument();

        // Clica em confirmar com fireEvent
        const confirmBtn = screen.getByRole('button', { name: 'Remover' });
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(api.delete).toHaveBeenCalledWith('/lists/MBR01/members/2');
        });
    });
});
