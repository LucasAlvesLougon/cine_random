/**
 * Compartilha conteúdo utilizando a Web Share API nativa do smartphone
 * com fallback transparente para a área de transferência caso não seja suportado.
 */
export async function shareContent({ title, text, url }) {
  const shareData = {
    title: title || 'Cine Random',
    text: text || 'Venha ver e sortear filmes comigo no Cine Random!',
    url: url || window.location.href,
  };

  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return { shared: true, method: 'native' };
    } catch (err) {
      if (err.name !== 'AbortError') {
        // Fallback para cópia se falhar
        await copyToClipboard(shareData.url || shareData.text);
        return { shared: true, method: 'clipboard' };
      }
      return { shared: false, method: 'aborted' };
    }
  }

  // Fallback para navegadores desktop que não suportam Web Share API
  const textToCopy = shareData.url ? `${shareData.text} ${shareData.url}` : shareData.text;
  await copyToClipboard(textToCopy);
  return { shared: true, method: 'clipboard' };
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}
