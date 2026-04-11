import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HandwritingCanvas from './HandwritingCanvas';

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(() => Promise.resolve({
    recognize: vi.fn(),
    terminate: vi.fn(),
  })),
}));

vi.mock('../store/useMindMapStore', () => ({
  useMindMapStore: vi.fn(() => ({
    focusId: 'n_root',
    addChild: vi.fn(),
    setText: vi.fn(),
    nodes: {},
  })),
}));

describe('HandwritingCanvas', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <HandwritingCanvas open={false} onClose={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders dialog when open', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<HandwritingCanvas open={true} onClose={vi.fn()} />);
    });
    expect(screen.getByText(/handwriting/i)).toBeInTheDocument();
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('has close button', async () => {
    await act(async () => {
      render(<HandwritingCanvas open={true} onClose={vi.fn()} />);
    });
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('has clear and recognize buttons', async () => {
    await act(async () => {
      render(<HandwritingCanvas open={true} onClose={vi.fn()} />);
    });
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recognize/i })).toBeInTheDocument();
  });
});
