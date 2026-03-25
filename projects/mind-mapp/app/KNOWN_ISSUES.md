# Known Issues

## Security
- Vite/esbuild moderate advisory (see AUDIT.md) — build-time only, no runtime impact

## Performance
- Large maps (>1000 nodes) may experience lag — canvas renderer planned
- No virtualization yet — all nodes render even when off-screen

## Browser Compatibility
- Tested primarily on modern Chrome/Firefox/Safari
- IE11 not supported (uses modern JS features)

## Mobile
- Touch gestures implemented (pinch zoom, pan)
- Mobile UX could be improved for small screens
- No dedicated mobile app yet
