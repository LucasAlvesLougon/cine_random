import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarDrawer } from '../components/Navigation/SidebarDrawer';
import { ListDrawFilterModal } from '../components/Modal/ListDrawFilterModal';
import { DiscoverFilterModal } from '../components/Modal/DiscoverFilterModal';
import { CatalogFilterModal } from '../components/Modal/CatalogFilterModal';
import { ToastProvider } from '../contexts/ToastContext';

vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 1, email: 'cinefilo@pipoca.com' },
        logout: vi.fn()
    })
}));

describe('SidebarDrawer and Dedicated Filter Modals', () => {
    it('SidebarDrawer não deve renderizar quando isOpen for false', () => {
        const { container } = render(
            <ToastProvider>
                <SidebarDrawer isOpen={false} onClose={vi.fn()} />
            </ToastProvider>
        );
        expect(container.querySelector('.drawer')).toBeNull();
    });

    it('SidebarDrawer deve exibir informações da lista e disparar callbacks', () => {
        const mockList = { id: 1, name: 'Sessão Pipoca', code: 'PIP01' };
        const onOpenMembers = vi.fn();
        const onOpenHistory = vi.fn();
        const onClose = vi.fn();

        render(
            <ToastProvider>
                <SidebarDrawer 
                    isOpen={true} 
                    onClose={onClose} 
                    activeList={mockList} 
                    onOpenMembers={onOpenMembers}
                    onOpenHistory={onOpenHistory}
                />
            </ToastProvider>
        );

        expect(screen.getByText('Sessão Pipoca')).toBeInTheDocument();
        expect(screen.getByText('PIP01')).toBeInTheDocument();

        const membersBtn = screen.getByText('Participantes');
        fireEvent.click(membersBtn);
        expect(onOpenMembers).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalled();

        const historyBtn = screen.getByText('Histórico de Sorteios');
        fireEvent.click(historyBtn);
        expect(onOpenHistory).toHaveBeenCalledTimes(1);
    });

    it('ListDrawFilterModal deve aplicar filtros apenas ao clicar em Aplicar Filtros', () => {
        const setIncludeWatched = vi.fn();
        const setSelectedProviders = vi.fn();
        const mockProviders = [{ name: 'Netflix' }, { name: 'HBO Max' }];
        const onClose = vi.fn();

        render(
            <ListDrawFilterModal 
                isOpen={true}
                onClose={onClose}
                includeWatched={false}
                setIncludeWatched={setIncludeWatched}
                selectedProviders={[]}
                setSelectedProviders={setSelectedProviders}
                availableProviders={mockProviders}
            />
        );

        expect(screen.getByText('Filtros de Sorteio da Lista')).toBeInTheDocument();
        expect(screen.getByText('Incluir filmes assistidos')).toBeInTheDocument();
        expect(screen.getByText('Netflix')).toBeInTheDocument();

        // Clica na opção
        fireEvent.click(screen.getByText('Incluir filmes assistidos'));
        // Não deve ter chamado setIncludeWatched ainda
        expect(setIncludeWatched).not.toHaveBeenCalled();

        // Clica em aplicar
        fireEvent.click(screen.getByText('Aplicar Filtros'));
        expect(setIncludeWatched).toHaveBeenCalledWith(true);
        expect(onClose).toHaveBeenCalled();
    });

    it('DiscoverFilterModal deve aplicar gênero e década apenas ao clicar em Aplicar', () => {
        const setGenre = vi.fn();
        const setDecade = vi.fn();
        const genres = [{ id: '28', label: 'Ação' }];
        const decades = [{ id: '1980', label: 'Anos 80' }];
        const onClose = vi.fn();

        render(
            <DiscoverFilterModal 
                isOpen={true}
                onClose={onClose}
                genre=""
                setGenre={setGenre}
                decade=""
                setDecade={setDecade}
                genres={genres}
                decades={decades}
            />
        );

        expect(screen.getByText('Filtros do Modo Descoberta')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Ação'));
        fireEvent.click(screen.getByText('Anos 80'));
        expect(setGenre).not.toHaveBeenCalled();

        fireEvent.click(screen.getByText('Aplicar Filtros'));
        expect(setGenre).toHaveBeenCalledWith('28');
        expect(setDecade).toHaveBeenCalledWith('1980');
        expect(onClose).toHaveBeenCalled();
    });

    it('CatalogFilterModal deve aplicar status, gênero e streaming apenas ao clicar em Aplicar', () => {
        const setFilter = vi.fn();
        const setSelectedGenre = vi.fn();
        const setSelectedProviders = vi.fn();
        const onClose = vi.fn();

        render(
            <CatalogFilterModal 
                isOpen={true}
                onClose={onClose}
                filter="all"
                setFilter={setFilter}
                selectedGenre=""
                setSelectedGenre={setSelectedGenre}
                selectedProviders={[]}
                setSelectedProviders={setSelectedProviders}
                availableGenres={['Comédia', 'Drama']}
                availableProviders={[{ name: 'Prime Video' }]}
            />
        );

        expect(screen.getByText('Filtros do Catálogo de Filmes')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Para Assistir'));
        fireEvent.click(screen.getByText('Comédia'));
        expect(setFilter).not.toHaveBeenCalled();

        fireEvent.click(screen.getByText('Aplicar Filtros'));
        expect(setFilter).toHaveBeenCalledWith('unwatched');
        expect(setSelectedGenre).toHaveBeenCalledWith('Comédia');
        expect(onClose).toHaveBeenCalled();
    });
});
