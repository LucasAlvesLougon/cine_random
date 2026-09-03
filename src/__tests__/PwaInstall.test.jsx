import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InstallPwaModal } from '../components/Modal/InstallPwaModal';
import { triggerHaptic } from '../utils/haptics';
import { shareContent } from '../utils/share';

describe('PWA & Native Mobile Features', () => {
  it('não deve renderizar InstallPwaModal quando isOpen for false', () => {
    const { container } = render(
      <InstallPwaModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.querySelector('.overlay')).toBeNull();
  });

  it('deve renderizar modal com botão de instalação no Android/Chrome', () => {
    const onInstallMock = vi.fn();
    render(
      <InstallPwaModal isOpen={true} onClose={vi.fn()} isIos={false} onInstall={onInstallMock} />
    );

    expect(screen.getByText('Instalar Cine Random')).toBeInTheDocument();
    const installBtn = screen.getByText('📲 Instalar Agora no Celular');
    expect(installBtn).toBeInTheDocument();

    fireEvent.click(installBtn);
    expect(onInstallMock).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar instruções do Safari quando for iOS', () => {
    render(
      <InstallPwaModal isOpen={true} onClose={vi.fn()} isIos={true} />
    );

    expect(screen.getByText('Adicionar à Tela de Início')).toBeInTheDocument();
    expect(screen.getByText('Entendi!')).toBeInTheDocument();
  });

  it('triggerHaptic não deve quebrar quando navigator.vibrate não existir', () => {
    expect(() => triggerHaptic('light')).not.toThrow();
    expect(() => triggerHaptic('success')).not.toThrow();
  });

  it('shareContent deve chamar clipboard quando navigator.share não existir', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const res = await shareContent({
      title: 'Teste',
      text: 'Mensagem de teste',
      url: 'https://cinerandom.app',
    });

    expect(res.shared).toBe(true);
    expect(res.method).toBe('clipboard');
    expect(writeTextMock).toHaveBeenCalledWith('Mensagem de teste https://cinerandom.app');
  });
});
