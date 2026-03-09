import { beforeEach, describe, expect, it } from 'vitest';
import { useMindMapStore, type Node } from './useMindMapStore';

const ROOT_ID = 'n_root';

function resetStore() {
  const root: Node = {
    id: ROOT_ID,
    text: 'Root',
    x: 320,
    y: 180,
    parentId: null,
    children: [],
  };

  useMindMapStore.setState({
    nodes: { [ROOT_ID]: root },
    focusId: ROOT_ID,
    editingId: undefined,
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,
  });
}

describe('useMindMapStore history', () => {
  beforeEach(() => {
    resetStore();
  });

  it('undoes and redoes addChild mutations', () => {
    const store = useMindMapStore.getState();

    store.addChild(ROOT_ID);
    expect(Object.keys(useMindMapStore.getState().nodes)).toHaveLength(2);
    expect(useMindMapStore.getState().canUndo).toBe(true);

    useMindMapStore.getState().undo();
    expect(Object.keys(useMindMapStore.getState().nodes)).toHaveLength(1);
    expect(useMindMapStore.getState().canRedo).toBe(true);

    useMindMapStore.getState().redo();
    expect(Object.keys(useMindMapStore.getState().nodes)).toHaveLength(2);
    expect(useMindMapStore.getState().canUndo).toBe(true);
  });

  it('clears redo stack when new mutation happens after undo', () => {
    useMindMapStore.getState().addChild(ROOT_ID);
    useMindMapStore.getState().undo();

    expect(useMindMapStore.getState().canRedo).toBe(true);

    useMindMapStore.getState().addChild(ROOT_ID);

    expect(useMindMapStore.getState().canRedo).toBe(false);
    expect(useMindMapStore.getState().future).toHaveLength(0);
  });

  it('does not create history for no-op setText', () => {
    useMindMapStore.getState().setText(ROOT_ID, 'Root');

    expect(useMindMapStore.getState().past).toHaveLength(0);
    expect(useMindMapStore.getState().canUndo).toBe(false);
  });
});
