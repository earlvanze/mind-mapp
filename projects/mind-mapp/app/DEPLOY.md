# Mind Mapp — Deploy (static)

The build output is in `dist/`. Serve it with any static host.

## Local quick serve
```bash
cd projects/mind-mapp/app
npm run build
npx serve dist
```

## Notes
- No backend required
- All data stored in browser localStorage
- Build output is static; host on Netlify/Vercel/S3
