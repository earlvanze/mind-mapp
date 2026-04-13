# MEMORY.md - Long-Term Memory

## Mind Mapp Project
- Full-stack mind-mapping app: Vite + React + Zustand + Konva + Supabase
- 820 tests across 76 test files, all green
- Features shipped: canvas, radial/tree/force layouts, Prezi-zoom, offline sync, OCR handwriting input, OPML import/export, find & replace, template library, rebindable keyboard shortcuts, tablet optimization, node notes panel

## Tech Stack
- Frontend: React, Zustand, Konva, react-konva, tesseract.js v7 (OCR)
- Backend: Supabase (auth, CRUD, background sync)
- Offline: IndexedDB via idb-keyval, sync queue
- Tests: vitest with jsdom, forks pool, 120s timeout

## Status
- Branch: main, up to date with origin/main
- Backlog: fully shipped, no open items
- Last significant work: Node Notes panel (node.comment + Shift+N toggle)
