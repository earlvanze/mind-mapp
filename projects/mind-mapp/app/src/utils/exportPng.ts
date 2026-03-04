import { toPng } from 'html-to-image';

export async function exportPng(element: HTMLElement) {
  const dataUrl = await toPng(element, { cacheBust: true, backgroundColor: '#f8f9fb' });
  const link = document.createElement('a');
  link.download = 'mindmapp.png';
  link.href = dataUrl;
  link.click();
}
