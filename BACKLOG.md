# Mind Mapp Backlog

## P0 — Critical (Ship Blockers)
- [x] Fix cron timeout: reduce test scope or increase timeout to 600s
- [x] Add handwriting.js integration for OCR input

## P1 — High Priority
- [x] Supabase auth integration
- [x] Save/load projects to Supabase
- [ ] Export JSON + PNG/SVG

## P2 — Medium Priority
- [ ] Prezi-style zoom into node (open sub-items)
- [ ] Offline support with sync
- [ ] Tablet/phablet optimization

## P3 — Nice to Have
- [ ] Realtime collaboration
- [ ] Template library
- [ ] Keyboard shortcuts

## Done
- [x] Project scaffold (Vite + React + Zustand)
- [x] Canvas rendering with Konva
- [x] Basic node creation and selection
- [x] Node expand/collapse with double-tap (300ms threshold)
- [x] Layout mode UI toggle (tree/radial/force)
- [x] handwriting.js OCR integration (tesseract.js v7, drawing canvas, recognize + insert)
- [x] Cron timeout fix (testTimeout 600s → 120s)
- [x] Edge CRUD + drag/drop:
  - Click-select edges (hit test on bezier midpoints)
  - Delete selected edge (Delete key)
  - Connect mode (click Connect button, drag from node to node)
  - Canvas-based edge rendering (CanvasEdges) for performance
  - Edge drag-reconnection: drag edge arrow to reconnect to another node
  - Pending connection preview line (dashed blue bezier)
  - `reconnectEdge` action in store with circular reference protection
- [x] Supabase auth + project save/load:
  - AuthDialog (password signup, signin, magic link)
  - CloudMenu in toolbar (☁️ button with dropdown)
  - cloudSync.ts lib (list/load/save/delete projects)
  - supabase-schema.sql (RLS policies)
  - .env.example (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
  - Graceful degradation when env vars not set
