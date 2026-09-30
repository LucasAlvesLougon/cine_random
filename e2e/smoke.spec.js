import { test, expect } from '@playwright/test';

test('exibe o login e permite abrir recuperação de senha', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Sua .* de Cinema/i })).toBeVisible();
    await expect(page.getByPlaceholder('Seu email')).toBeVisible();
    await page.getByRole('button', { name: 'Esqueci minha senha' }).click();

    await expect(page.getByRole('heading', { name: 'Recuperar senha' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar instruções' })).toBeVisible();
});

test('não exibe a funcionalidade removida de Match na tela de login', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Match da Galera')).toHaveCount(0);
});

test('entrada explica o produto e alterna para criar conta pelo teclado', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Monte uma lista de filmes com amigos e sorteie o filme da próxima sessão.')).toBeVisible();
    const toggle = page.getByRole('button', { name: 'Ainda não tem conta? Criar conta' });
    await toggle.focus();
    await expect(toggle).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Criar Conta' })).toBeVisible();
});
