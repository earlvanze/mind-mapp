import { useEffect } from 'react';

export function useAutosave(onSave: () => void, delay = 500) {
  useEffect(() => {
    let t: number | undefined;
    const handler = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => onSave(), delay);
    };
    window.addEventListener('keyup', handler);
    return () => window.removeEventListener('keyup', handler);
  }, [onSave, delay]);
}
