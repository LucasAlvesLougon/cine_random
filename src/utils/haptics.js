/**
 * Dispara vibrações táteis sutis (Haptic Feedback) em smartphones compatíveis.
 * Totalmente seguro com fallback silencioso caso o dispositivo não suporte.
 */
export function triggerHaptic(type = 'light') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (type) {
      case 'light': // Toque suave / swipe / like
        navigator.vibrate(12);
        break;
      case 'medium': // Ação importante / roleta girando
        navigator.vibrate(25);
        break;
      case 'success': // Match encontrado / filme sorteado
        navigator.vibrate([15, 50, 25]);
        break;
      case 'warning': // Remoção / dislike
        navigator.vibrate([30, 40, 15]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch {
    // Ignora silenciosamente se o browser bloquear ou não suportar
  }
}
