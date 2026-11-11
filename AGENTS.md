# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Approved product decisions

- Local preview only; do not deploy until requested.
- Product name: «Разбег». The sidebar wordmark has no company-name subtitle.
- User requested the unslop skill: quiet neutral surfaces, lime for useful selection/progress, sentence-case labels, readable text. No decorative AI styling.
- Status labels must fit Cyrillic text at desktop and mobile widths; minimum 11px type, explicit line-height, no forced small height or shrinking.
- Reusable role templates retain individual progress. Only HR-reviewed answers may be reused. PDF, DOC and DOCX are parsed locally.
- Latest user feedback: field and select text must be readable (15px), ordinary buttons 14px, captions at least 12px. Compound search has exactly one border/focus ring on its outer wrapper. Select chevron has a fixed 16px size.
