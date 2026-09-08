# MediaHarvest

A Chrome/Brave DevTools extension that captures every image and video from a page's network requests, plus the landing page for it.

## Structure

- `public/extension/` — the DevTools extension itself (load this folder as an unpacked extension)
- `src/`, `index.html` — the marketing landing page (Vite + React + Tailwind)

## Extension

1. Go to `chrome://extensions` (or `brave://extensions`)
2. Enable **Developer mode**
3. **Load unpacked** → select `public/extension`
4. Open DevTools (F12) on any page → the **MediaHarvest** tab captures images/videos as they load, filterable and downloadable

## Landing page

```bash
npm install
npm run dev      # dev server
npm run build    # production build
```
