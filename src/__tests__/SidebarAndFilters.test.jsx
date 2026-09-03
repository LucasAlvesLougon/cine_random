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

    it('ListDrawFilterModal deve alternar filmes assistidos e selecionar streamings', () => {
        const setIncludeWatched = vi.fn();
        const setSelectedProviders = vi.fn();
        const mockProviders = [{ name: 'Netflix' }, { name: 'HBO Max' }];

        render(
            <ListDrawFilterModal 
                isOpen={true}
                onClose={vi.fn()}
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

        fireEvent.click(screen.getByText('Incluir filmes assistidos'));
        expect(setIncludeWatched).toHaveBeenCalledWith(true);

        fireEvent.click(screen.getByText('Netflix'));
        expect(setSelectedProviders).toHaveBeenCalled();
    });

    it('DiscoverFilterModal deve permitir selecionar gênero e década', () => {
        const setGenre = vi.fn();
        const setDecade = vi.fn();
        const genres = [{ id: '28', label: 'Ação' }];
        const decades = [{ id: '1980', label: 'Anos 80' }];

        render(
            <DiscoverFilterModal 
                isOpen={true}
                onClose={vi.fn()}
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
        expect(setGenre).toHaveBeenCalledWith('28');

        fireEvent.click(screen.getByText('Anos 80'));
        expect(setDecade).toHaveBeenCalledWith('1980');
    });

    it('CatalogFilterModal deve permitir filtrar por status, gênero e streaming', () => {
        const setFilter = vi.fn();
        const setSelectedGenre = vi.fn();
        const setSelectedProviders = vi.fn();

        render(
            <CatalogFilterModal 
                isOpen={true}
                onClose={vi.fn()}
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
        expect(setFilter).toHaveBeenCalledWith('unwatched');

        fireEvent.click(screen.getByText('Comédia'));
        expect(setSelectedGenre).toHaveBeenCalledWith('Comédia');
    });
});
