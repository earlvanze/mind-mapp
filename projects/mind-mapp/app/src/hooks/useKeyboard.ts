import { useEffect } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';

export function useKeyboard() {
  const { focusId, addSibling, addChild } = useMindMapStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSibling(focusId);
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        addChild(focusId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusId, addSibling, addChild]);
}
