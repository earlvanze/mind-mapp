import { useMindMapStore } from './store/useMindMapStore';
import Node from './components/Node';
import { useKeyboard } from './hooks/useKeyboard';

export default function App() {
  const { nodes } = useMindMapStore();
  useKeyboard();

  return (
    <div className="app">
      <div className="toolbar">
        <strong>Mind Mapp</strong>
        <span style={{ color: '#666' }}>MVP scaffold</span>
      </div>
      <div className="canvas">
        {Object.values(nodes).map(n => (
          <Node key={n.id} node={n} />
        ))}
      </div>
    </div>
  );
}
