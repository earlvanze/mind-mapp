import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterPanel from './FilterPanel';
import { useMindMapStore } from '../store/useMindMapStore';

const mockNodes = {
  n1: { id: 'n1', text: 'Alpha', x: 0, y: 0, parentId: null, children: [], createdAt: Date.parse('2025-01-01'), updatedAt: Date.parse('2025-01-01') },
  n2: { id: 'n2', text: 'Beta', x: 100, y: 100, parentId: null, children: [], createdAt: Date.parse('2025-06-15'), updatedAt: Date.parse('2025-06-15') },
};

const makePartialStore = () => ({
  nodes: mockNodes,
  activeTagFilters: [] as string[],
  matchMode: 'any' as const,
  setTagFilter: vi.fn(),
  clearTagFilters: vi.fn(),
  toggleMatchMode: vi.fn(),
  styleFilterShapes: [] as string[],
  styleFilterColors: [] as string[],
  styleFilterIcons: [] as string[],
  styleFilterDateMode: undefined as 'created' | 'updated' | undefined,
  styleFilterDateFrom: undefined as number | undefined,
  styleFilterDateTo: undefined as number | undefined,
  setStyleFilterShapes: vi.fn(),
  setStyleFilterColors: vi.fn(),
  setStyleFilterIcons: vi.fn(),
  setStyleFilterDate: vi.fn(),
  clearStyleFilters: vi.fn(),
});

vi.mock('../store/useMindMapStore');

describe('FilterPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the filter panel', () => {
    vi.mocked(useMindMapStore).mockReturnValue(makePartialStore());
    render(<FilterPanel />);
    expect(screen.getByRole('region', { name: /advanced filter panel/i })).toBeInTheDocument();
  });

  it('switches to date tab and shows date inputs', async () => {
    const user = userEvent.setup();
    vi.mocked(useMindMapStore).mockReturnValue(makePartialStore());
    render(<FilterPanel />);
    await user.click(screen.getByRole('button', { name: /date/i }));
    expect(screen.getByLabelText(/from date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to date/i)).toBeInTheDocument();
  });

  // Regression test: previously the "To" date input value expression called
  // .getTime() on an already-numeric timestamp, producing NaN and an empty
  // input instead of the formatted date string.
  it('To date input shows ISO date string when styleFilterDateTo is set', async () => {
    const user = userEvent.setup();
    const toDate = Date.parse('2025-12-31');
    const store = makePartialStore();
    (store as typeof store & { styleFilterDateMode: 'created'; styleFilterDateTo: number }).styleFilterDateMode = 'created';
    store.styleFilterDateTo = toDate;
    vi.mocked(useMindMapStore).mockReturnValue(store);
    render(<FilterPanel />);
    await user.click(screen.getByRole('button', { name: /date/i }));
    const toInput = screen.getByLabelText(/to date/i) as HTMLInputElement;
    expect(toInput.value).toBe('2025-12-31');
  });

  it('date inputs are empty when no date filter is set', async () => {
    const user = userEvent.setup();
    vi.mocked(useMindMapStore).mockReturnValue(makePartialStore());
    render(<FilterPanel />);
    await user.click(screen.getByRole('button', { name: /date/i }));
    const fromInput = screen.getByLabelText(/from date/i) as HTMLInputElement;
    const toInput = screen.getByLabelText(/to date/i) as HTMLInputElement;
    expect(fromInput.value).toBe('');
    expect(toInput.value).toBe('');
  });
});
