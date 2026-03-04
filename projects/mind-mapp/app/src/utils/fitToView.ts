import { useMindMapStore } from '../store/useMindMapStore';

export function fitToView() {
  const el = document.querySelector('.canvas') as HTMLElement | null;
  if (!el) return;
  const nodes = useMindMapStore.getState().nodes;
  const values = Object.values(nodes);
  if (!values.length) return;
  const minX = Math.min(...values.map(n => n.x));
  const maxX = Math.max(...values.map(n => n.x));
  const minY = Math.min(...values.map(n => n.y));
  const maxY = Math.max(...values.map(n => n.y));

  const padding = 100;
  const width = (maxX - minX) + padding;
  const height = (maxY - minY) + padding;
  const scaleX = window.innerWidth / width;
  const scaleY = window.innerHeight / height;
  const scale = Math.min(1.6, Math.max(0.4, Math.min(scaleX, scaleY)));

  const originX = -minX + padding / 2;
  const originY = -minY + padding / 2;
  el.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
}
