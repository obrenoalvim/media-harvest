# TODO Improvements

### Add a test setup for the DevTools extension logic
- **Category:** Test
- **What:** No test framework (vitest/jest) is configured anywhere in the repo, so the extension's core logic — `sanitizeFilename`/`EXT_BY_MIME` in `background.js`, and `classifyMedia`/`getExtension`/`getFileName`/`hashUrl`/`ensureExtension`/`uniqueZipName` in `panel.js` — ships with zero automated coverage. These are pure functions and would be easy to unit test if extracted or exported.
- **Where:** `public/extension/background.js`, `public/extension/panel.js`
- **Why:** They handle cross-OS filename sanitization and zip-entry naming — exactly the kind of edge-case-heavy logic (Windows reserved names, path length limits, duplicate names) that regresses silently without tests.
- **Risk:** Requires adding a new devDependency (vitest) and restructuring the IIFEs to expose functions for import — out of scope for a safe-only pass.
- **Effort:** Medium

### Cap in-memory `mediaItems` array for very long sessions
- **Category:** Bug
- **What:** `dismissedHashes` has a `DISMISSED_MAX` FIFO cap (`panel.js`), but the live `mediaItems`/`itemsByUrl` collections that back the visible grid have no cap. A very long browsing session on a media-heavy site could accumulate thousands of DOM cards and grow unbounded.
- **Where:** `public/extension/panel.js` (`mediaItems`, `itemsByUrl`, `registerItem`, `renderGrid`)
- **Why:** Could degrade panel performance or memory usage over a long-running DevTools session.
- **Risk:** Any cap policy (FIFO eviction, virtualized rendering) changes user-visible behavior — which items disappear and when — so it needs a product decision, not a silent fix.
- **Effort:** Medium
