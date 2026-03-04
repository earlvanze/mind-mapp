import { useEffect } from 'react';

type Options = { selector: string };

export function usePanZoom({ selector }: Options) {
  useEffect(() => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return;
    let isPanning = false;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;
    let scale = 1;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = Math.sign(e.deltaY) * -0.1;
      scale = Math.min(2, Math.max(0.4, scale + delta));
      el.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!e.shiftKey) return;
      isPanning = true;
      startX = e.clientX;
      startY = e.clientY;
      el.style.cursor = 'grabbing';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      el.style.transform = `translate(${originX + dx}px, ${originY + dy}px) scale(${scale})`;
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isPanning) return;
      isPanning = false;
      originX += e.clientX - startX;
      originY += e.clientY - startY;
      el.style.cursor = 'default';
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') el.style.cursor = 'grab';
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') el.style.cursor = 'default';
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [selector]);
}
