import { useMindMapStore } from './store/useMindMapStore';
import Node from './components/Node';
import { useKeyboard } from './hooks/useKeyboard';

export default function App() {
  const { nodes } = useMindMapStore();
  useKeyboard();

  const exportJson = () => {
    const data = { nodes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmapp.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <div className="toolbar">
        <strong>Mind Mapp</strong>
        <span style={{ color: '#666' }}>MVP scaffold</span>
        <button onClick={exportJson}>Export JSON</button>
      </div>
      <div className="canvas">
        {Object.values(nodes).map(n => (
          <Node key={n.id} node={n} />
        ))}
      </div>
    </div>
  );
}
