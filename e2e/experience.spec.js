import { test, expect } from '@playwright/test';

const list = { id: 1, name: 'Sessão de Sexta', code: 'ABC123', owner_id: 1 };
const poster = (title) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="360"><rect width="240" height="360" fill="#242426"/><rect x="0" y="0" width="12" height="360" fill="#ff453a"/><text x="28" y="180" fill="white" font-size="18" font-family="Arial">${title}</text></svg>`)}`;
const movie = (id, title = `Filme ${id}`) => ({
    id, tmdbId: id + 1000, title, posterUrl: poster(title), backdropUrl: null,
    releaseYear: '2020', tmdbRating: 7.5, watched: id === 1,
    genres: ['Drama'], watchProviders: [], trailerKey: null, director: 'Direção', cast: [],
    synopsis: 'Um filme para ver com o grupo.', comments: [], runtime: 110,
});

async function mockApi(page, pages = [[]]) {
    await page.route('http://localhost:8000/**', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const path = url.pathname;
        const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS' };
        if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        const reply = (body, status = 200) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) });
        if (path === '/auth/login') return reply({ access_token: 'local-test-only', email: 'teste@cine.local', user_id: 1 });
        if (path === '/lists/my') return reply([list]);
        if (path === '/lists/join/ABC123') return reply(list);
        if (path === '/lists/ABC123/movies') {
            const pageNumber = Number(url.searchParams.get('page') || '1');
            const items = pages[pageNumber - 1] || [];
            const total = pages.flat().length;
            return reply({ items, total, page: pageNumber, page_size: 50, has_next: pageNumber < pages.length });
        }
        if (path === '/lists/ABC123/ws-ticket') return reply({ ticket: 'local-test-ticket' });
        if (path === '/lists/ABC123/history') return reply(request.method() === 'POST' ? { id: 1 } : []);
        if (path === '/lists/ABC123/members') return reply([{ id: 1, email: 'teste@cine.local', is_owner: true }]);
        if (path.startsWith('/tmdb')) return reply({ results: [] });
        return reply({ detail: 'Endpoint não simulado' }, 404);
    });
    await page.routeWebSocket('ws://localhost:8000/**', () => {});
}

async function seedSession(page, activeList = list) {
    await page.addInitScript((savedList) => {
        localStorage.setItem('access_token', 'local-test-only');
        localStorage.setItem('user_email', 'teste@cine.local');
        localStorage.setItem('user_id', '1');
        localStorage.setItem('cine_random_onboarding_seen_1', '1');
        if (savedList) localStorage.setItem('cine_random_active_list', JSON.stringify(savedList));
    }, activeList);
}

test('desktop: lista vazia orienta, foca adição e compartilha link direto', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockApi(page);
    await seedSession(page);
    await page.goto('/');

    await expect(page.getByText('Sua lista ainda não tem filmes')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sortear da lista' })).toBeDisabled();
    await page.getByRole('button', { name: 'Adicionar o primeiro filme' }).click();
    await expect(page.getByRole('textbox', { name: 'Buscar filme para adicionar à lista' })).toBeFocused();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: 'Convidar amigos' }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('/join/ABC123');
    await page.screenshot({ path: testInfo.outputPath('desktop-empty.png') });
});

test('celular estreito: lista vazia mantém ações legíveis e acessíveis', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await mockApi(page);
    await seedSession(page);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Convidar amigos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sortear da lista' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Adicionar o primeiro filme' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('mobile-empty-320.png') });
});

test('celular: catálogo paginado, filtros, pôster por teclado e sorteio', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const first = Array.from({ length: 50 }, (_, index) => movie(index + 1, index === 0 ? 'Matrix' : undefined));
    const second = Array.from({ length: 10 }, (_, index) => movie(index + 51, index === 0 ? 'Alien' : undefined));
    await mockApi(page, [first, second]);
    await seedSession(page);
    await page.goto('/');

    await expect(page.getByText(/60 filmes na lista.*50 carregados/)).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('mobile-populated.png') });
    await page.getByRole('button', { name: 'Filtros do catálogo' }).click();
    await expect(page.getByRole('dialog', { name: 'Filtros do Catálogo de Filmes' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Filtros do Catálogo de Filmes' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Filtros do catálogo' })).toBeFocused();

    await page.getByRole('textbox', { name: 'Buscar filme na lista' }).fill('Alien');
    await expect(page.getByText(/Nenhum filme carregado corresponde/)).toBeVisible();
    await page.getByRole('button', { name: 'Carregar mais filmes' }).click();
    await expect(page.getByText(/60 filmes na lista.*59 para ver.*1 visto/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ver detalhes de Alien no pôster' })).toBeVisible();
    await page.getByRole('button', { name: 'Ver detalhes de Alien no pôster' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Alien' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Ver detalhes de Alien no pôster' })).toBeFocused();

    await page.getByRole('button', { name: 'Sortear da lista' }).click();
    await expect(page.getByRole('dialog', { name: 'O destino está escolhendo...' })).toBeVisible();
    await expect(page.getByRole('dialog', { name: /Filme|Matrix|Alien/ })).toBeVisible({ timeout: 6000 });
});

test('convite aberto sem sessão continua após o login', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.setItem('cine_random_onboarding_seen_1', '1'));
    await page.goto('/join/ABC123');
    await expect(page.getByText(/Entre ou crie uma conta para aceitar o convite da lista ABC123/)).toBeVisible();
    await page.getByPlaceholder('Seu email').fill('teste@cine.local');
    await page.getByPlaceholder('Sua senha').fill('senha-local');
    await page.getByRole('button', { name: 'Entrar com Email' }).click();
    await expect(page.getByRole('heading', { name: 'Sessão de Sexta' })).toBeVisible();
    await expect(page).toHaveURL('/');
});

test('sorteio consulta páginas ainda não carregadas antes de escolher', async ({ page }) => {
    const first = Array.from({ length: 50 }, (_, index) => movie(index + 1));
    const second = Array.from({ length: 10 }, (_, index) => movie(index + 51));
    await mockApi(page, [first, second]);
    await seedSession(page);
    let requestedSecondPage = false;
    page.on('request', request => {
        if (request.url().includes('/lists/ABC123/movies') && request.url().includes('page=2')) requestedSecondPage = true;
    });
    await page.goto('/');
    await expect(page.getByText(/60 filmes na lista.*50 carregados/)).toBeVisible();
    await page.getByRole('button', { name: 'Sortear da lista' }).click();
    await expect.poll(() => requestedSecondPage).toBe(true);
});
