# Mind Mapp — UX Flow (v0.1)

## Primary Flow: Build a Map
1. **Open app** → root node auto‑created + focused
2. **Type** → label set on root
3. **Tab** → child created under root
4. **Enter** → sibling created
5. **Drag** → reposition nodes as structure clarifies
6. **Cmd/Ctrl+K** → jump to node, continue editing
7. **Export** → PNG for sharing, JSON for storage

## Secondary Flow: Restructure
- Select a node
- **Shift+Tab** to promote
- **Tab** to demote (child)
- Drag to adjust spatial layout

## Empty State
- Single editable root + quick hint overlay (keybindings)

## Error/Edge States
- Delete root: if only root exists, clear label instead
- Large map: show “fit to view” prompt

## Success Criteria
- Create 10+ nodes without touching mouse
- Export PNG in <2 clicks
- Search jump <1s
