// Export Template Presets — save and restore named node style configurations

import type { NodeStyle } from '../store/useMindMapStore';

export interface TemplatePreset {
  id: string;
  name: string;
  /** Light or dark theme this template targets */
  theme: 'light' | 'dark';
  /** Default style applied to all nodes in the map */
  defaultStyle: NodeStyle;
  /** Optional per-node-color preset overrides (can be empty) */
  colorPresets?: NodeStyle[];
  createdAt: number;
}

const DEFAULT_PRESETS: TemplatePreset[] = [
  {
    id: 'minimal-light',
    name: 'Minimal Light',
    theme: 'light',
    defaultStyle: {
      backgroundColor: '#ffffff',
      textColor: '#111827',
      borderColor: '#d1d5db',
      borderWidth: 1,
      shape: 'rounded',
      fontSize: 'medium',
    },
    colorPresets: [],
    createdAt: Date.now(),
  },
  {
    id: 'minimal-dark',
    name: 'Minimal Dark',
    theme: 'dark',
    defaultStyle: {
      backgroundColor: '#1f2937',
      textColor: '#f9fafb',
      borderColor: '#4b5563',
      borderWidth: 1,
      shape: 'rounded',
      fontSize: 'medium',
    },
    colorPresets: [],
    createdAt: Date.now(),
  },
  {
    id: 'colorful-light',
    name: 'Colorful Light',
    theme: 'light',
    defaultStyle: {
      backgroundColor: '#ffffff',
      textColor: '#111827',
      borderColor: '#3b82f6',
      borderWidth: 2,
      shape: 'rounded',
      fontSize: 'medium',
    },
    colorPresets: [
      { backgroundColor: 'primary', textColor: '#ffffff', borderColor: '#2563eb', shape: 'rounded' },
      { backgroundColor: 'success', textColor: '#ffffff', borderColor: '#059669', shape: 'rounded' },
      { backgroundColor: 'warning', textColor: '#1f2937', borderColor: '#d97706', shape: 'rounded' },
      { backgroundColor: 'danger', textColor: '#ffffff', borderColor: '#dc2626', shape: 'rounded' },
    ],
    createdAt: Date.now(),
  },
  {
    id: 'colorful-dark',
    name: 'Colorful Dark',
    theme: 'dark',
    defaultStyle: {
      backgroundColor: '#1f2937',
      textColor: '#f9fafb',
      borderColor: '#3b82f6',
      borderWidth: 2,
      shape: 'rounded',
      fontSize: 'medium',
    },
    colorPresets: [
      { backgroundColor: 'primary', textColor: '#ffffff', borderColor: '#3b82f6', shape: 'rounded' },
      { backgroundColor: 'success', textColor: '#ffffff', borderColor: '#10b981', shape: 'rounded' },
      { backgroundColor: 'warning', textColor: '#ffffff', borderColor: '#f59e0b', shape: 'rounded' },
      { backgroundColor: 'danger', textColor: '#ffffff', borderColor: '#ef4444', shape: 'rounded' },
    ],
    createdAt: Date.now(),
  },
  {
    id: 'presentation-light',
    name: 'Presentation Light',
    theme: 'light',
    defaultStyle: {
      backgroundColor: '#4f46e5',
      textColor: '#ffffff',
      borderColor: '#3730a3',
      borderWidth: 2,
      shape: 'rounded',
      fontSize: 'large',
      bold: true,
    },
    colorPresets: [],
    createdAt: Date.now(),
  },
  {
    id: 'presentation-dark',
    name: 'Presentation Dark',
    theme: 'dark',
    defaultStyle: {
      backgroundColor: '#1d4ed8',
      textColor: '#ffffff',
      borderColor: '#3b82f6',
      borderWidth: 2,
      shape: 'rounded',
      fontSize: 'large',
      bold: true,
    },
    colorPresets: [],
    createdAt: Date.now(),
  },
];

const TEMPLATE_STORAGE_KEY = 'mindmapp.v1.exportTemplates';

function loadStored(): TemplatePreset[] {
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TemplatePreset[];
  } catch {
    return [];
  }
}

function saveStored(presets: TemplatePreset[]) {
  try {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // ignore
  }
}

export function getTemplatePresets(): TemplatePreset[] {
  const stored = loadStored();
  if (stored.length > 0) return stored;
  return DEFAULT_PRESETS;
}

export function getPresetById(id: string): TemplatePreset | undefined {
  return getTemplatePresets().find(p => p.id === id);
}

export function saveTemplatePreset(preset: Omit<TemplatePreset, 'id' | 'createdAt'>): TemplatePreset {
  const id = 'tpl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const full: TemplatePreset = { ...preset, id, createdAt: Date.now() };
  const all = loadStored();
  all.push(full);
  saveStored(all);
  return full;
}

export function deleteTemplatePreset(id: string) {
  const all = loadStored().filter(p => p.id !== id);
  saveStored(all);
}

export function renameTemplatePreset(id: string, name: string) {
  const all = loadStored().map(p => p.id === id ? { ...p, name } : p);
  saveStored(all);
}
