# Keyboard Navigation Audit — WCAG 2.1 AA
**Date:** March 27, 2026  
**Version:** v0.11.0  
**Status:** ✅ PASS

## Audit Scope
WCAG 2.1 AA Success Criterion 2.1.1 (Keyboard) requires all functionality to be available via keyboard interface without requiring specific timings for individual keystrokes.

## Interactive Elements Audited

### ✅ Primary Canvas & Nodes
- **Node elements** (`<div role="treeitem">`)
  - `tabIndex={isFocused ? 0 : -1}` — proper focus management
  - `onKeyDown` handler for Enter/Space to trigger editing
  - `onClick` for mouse users
  - `aria-selected` for selection state
- **Canvas** (`<canvas>`)
  - `onClick` handler for click-to-create nodes
  - Keyboard shortcuts available for all canvas operations (see below)

### ✅ Dialogs
All dialogs properly implement:
- `role="dialog"` and `aria-modal="true"`
- `aria-labelledby` and `aria-describedby`
- Close button is `<button>` with `aria-label`
- Escape key to close (via global keyboard handlers)
- Click-outside-to-close backdrop (mouse convenience, not required for keyboard users)

**Dialogs checked:**
1. **Search Dialog** (`SearchDialog.tsx`)
   - `<input>` for search query (auto-focused)
   - `<button>` for close
   - Arrow keys for result navigation
   - Enter to jump to result
   - Escape to close

2. **Help Dialog** (`HelpDialog.tsx`)
   - `<input>` for filter (auto-focused)
   - `<button>` for close
   - Escape to clear filter, then close

3. **Version History Dialog** (`VersionHistoryDialog.tsx`)
   - `<input>` for snapshot name
   - `<button>` elements for all actions (Save/Load/Rename/Delete)
   - Escape to close

### ✅ Toolbar Buttons
All toolbar buttons (`App.tsx`) are proper `<button>` elements with:
- `title` attribute for tooltip
- `aria-keyshortcuts` for keyboard shortcut hints
- `disabled` state when appropriate
- Click and keyboard activation

**Examples:**
- Undo/Redo (Cmd+Z / Cmd+Shift+Z)
- Fit to view (F)
- Center focused node (C)
- Navigation buttons (↑↓←→ with Alt/Shift modifiers)

### ✅ Style Toolbar & Pickers
**StyleToolbar.tsx** implements:
- Picker trigger buttons with `aria-expanded` and `aria-controls`
- Focus trap within open pickers (Tab/Shift+Tab cycle within picker)
- Escape to close picker and return focus to trigger
- All picker contents use semantic elements:
  - Color presets: `<button>` grid with `aria-label`
  - Color inputs: `<input type="color">` with `aria-label`
  - Shape options: `<button>` grid with `aria-label`
  - Border width: `<input type="range">` with `aria-label`
  - Icon picker: `<button>` grid with emoji characters
  - Image URL: `<input type="text">` + `<input type="file">`
  - Link URL: `<input type="url">`

**Keyboard shortcuts for color presets:**
- Cmd/Ctrl+1-7 apply presets without opening picker

### ✅ Mini-Map
**MiniMap.tsx** (`<svg>` element):
- `tabIndex={0}` — keyboard focusable
- `aria-label` with comprehensive usage instructions
- `onKeyDown` handler for:
  - Arrow keys: pan viewport (+ Shift for larger steps)
  - Page Up/Down: page viewport vertically (+ Shift for horizontal)
  - Home/End: jump viewport to map edges
- `onClick` for mouse navigation (convenience)
- Node circles have `onClick` to focus (mouse convenience)

### ✅ Rich Text Toolbar
**Node.tsx** (inline formatting when editing):
- `<button>` elements for Bold, Italic, Bullet, Numbered
- `title` attributes with shortcuts
- Keyboard shortcuts work globally (Cmd+B/I)

### ✅ Breadcrumb Navigation
**App.tsx** breadcrumb path:
- `<button>` elements for each ancestor
- Click to focus ancestor
- Keyboard shortcuts available (Alt+↑ for parent, etc.)

### ✅ Notices & Status
**App.tsx** import/export notices:
- `<div role="status">` or `<div role="alert">`
- `<button>` to dismiss
- Automatically dismissed after timeout (keyboard users can dismiss early)

## Non-Interactive Elements
These elements have `onClick` but are NOT required to be keyboard-accessible per WCAG:
- **Overlay backdrops** (`.search-overlay`) — click-to-close convenience; Escape key provides keyboard equivalent
- **Canvas background** — click-to-create convenience; keyboard shortcuts (Enter/Tab) provide equivalent

## Keyboard Shortcuts Coverage
All major functionality has keyboard equivalents:
- **Node operations:** Enter, Tab, Shift+Tab, Delete, Backspace, D, X, C/V
- **Navigation:** Arrow keys, R, [, ], Home, End, Alt+↑↓←→
- **Selection:** Space, Cmd/Ctrl+A, S, G, N, P, L, T
- **View:** F, C, Alt+F, Shift+C, +/-, 0
- **Search:** Cmd/Ctrl+K
- **Layout:** L (cycle tree/radial/force)
- **Export:** Cmd/Ctrl+S, E (opens export menu)
- **Undo/Redo:** Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z
- **Theme:** Shift+T
- **Help:** ? or Cmd/Ctrl+/

## Conclusion
✅ **All interactive elements are keyboard-accessible.**
✅ **No functionality requires mouse/pointer.**
✅ **Focus management is correct (focus visible, focus trap in pickers).**
✅ **All elements use semantic HTML or proper ARIA roles.**

**Status:** WCAG 2.1 AA Success Criterion 2.1.1 (Keyboard) — **PASS**

## Recommendations for Future
- Consider adding `aria-expanded` to more picker buttons (partially done)
- Consider `aria-haspopup="menu"` for picker buttons (optional enhancement)
- Consider roving tabindex for picker grids (optional enhancement for fewer Tab stops)
