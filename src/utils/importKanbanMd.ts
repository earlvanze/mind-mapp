/**
 * Obsidian Kanban.md parser.
 * 
 * Converts Obsidian Kanban markdown boards into MindMapp trees.
 * Format: ## Column Name followed by - [ ] task items (nested supported)
 */

import type { Node } from '../store/useMindMapStore';
import {
  type KanbanBoard,
  type KanbanCard,
  type KanbanTransformTemplate,
  transformKanbanToMindMap,
} from './kanbanTransforms';

interface RawColumn {
  name: string;
  cards: RawCard[];
}

interface RawCard {
  text: string;
  completed: boolean;
  children: RawCard[];
}

function parseKanbanMarkdown(content: string): RawColumn[] {
  const lines = content.replace(/^\uFEFF/, '').split('\n');
  const columns: RawColumn[] = [];
  let currentColumn: RawColumn | null = null;
  const cardStack: { card: RawCard; indent: number }[] = [];

  for (const line of lines) {
    // Column header: ## Name or ### Name
    const columnMatch = line.match(/^#{2,6}\s+(.+)$/);
    if (columnMatch) {
      // Save previous column
      if (currentColumn) {
        columns.push(currentColumn);
      }
      currentColumn = { name: columnMatch[1].trim(), cards: [] };
      cardStack.length = 0;
      continue;
    }

    if (!currentColumn) continue;

    // Task item: - [ ] or - [x] with optional indentation
    const taskMatch = line.match(/^(\s*)-\s*\[([ xX])\]\s+(.+)$/);
    if (taskMatch) {
      const [, indent, status, text] = taskMatch;
      const indentLevel = indent.length;
      const completed = status.toLowerCase() === 'x';

      const card: RawCard = {
        text: text.trim(),
        completed,
        children: [],
      };

      // Pop stack until we find parent at lower indent
      while (cardStack.length > 0 && cardStack[cardStack.length - 1].indent >= indentLevel) {
        cardStack.pop();
      }

      if (cardStack.length === 0) {
        // Top-level card
        currentColumn.cards.push(card);
      } else {
        // Nested card - add to parent
        cardStack[cardStack.length - 1].card.children.push(card);
      }

      cardStack.push({ card, indent: indentLevel });
      continue;
    }

    // Bullet item (non-task): - text
    const bulletMatch = line.match(/^(\s*)-\s+(.+)$/);
    if (bulletMatch) {
      const [, indent, text] = bulletMatch;
      const indentLevel = indent.length;

      const card: RawCard = {
        text: text.trim(),
        completed: false,
        children: [],
      };

      while (cardStack.length > 0 && cardStack[cardStack.length - 1].indent >= indentLevel) {
        cardStack.pop();
      }

      if (cardStack.length === 0) {
        currentColumn.cards.push(card);
      } else {
        cardStack[cardStack.length - 1].card.children.push(card);
      }

      cardStack.push({ card, indent: indentLevel });
    }
  }

  // Save last column
  if (currentColumn) {
    columns.push(currentColumn);
  }

  return columns;
}

function convertCard(card: RawCard, status: string): KanbanCard {
  return {
    title: card.text,
    status,
    labels: [],
    completed: card.completed,
    children: card.children.map(c => convertCard(c, status)),
  };
}

export function parseKanbanMdBoard(content: string): KanbanBoard {
  const columns = parseKanbanMarkdown(content);
  
  return {
    name: 'Kanban Board',
    columns: columns.map((col, idx) => ({
      id: `col_${idx}`,
      name: col.name,
      cards: col.cards.map(c => convertCard(c, col.name)),
    })),
  };
}

export function parseKanbanMd(
  content: string,
  template: KanbanTransformTemplate = 'by-status',
): Record<string, Node> {
  return transformKanbanToMindMap(parseKanbanMdBoard(content), template);
}

export function isKanbanMdContent(content: string): boolean {
  const trimmed = content.trim();
  
  // Must have column headers with task lists
  const hasColumn = /^#{2,6}\s+.+$/m.test(trimmed);
  const hasTasks = /^(\s*)-\s*\[[ xX]\]\s+.+$/m.test(trimmed);
  
  return hasColumn && hasTasks;
}
