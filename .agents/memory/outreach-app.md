---
name: Outreach app architecture
description: Non-obvious decisions for the DevDonna Outreach full-stack app
---

## File upload excluded from OpenAPI spec

Multipart file upload (`/contacts/import`) is implemented as a raw multer route and NOT in the OpenAPI spec. Including it caused two issues: `zod.instanceof(File)` in Node.js context fails (no `File` global), and Orval generates an `ImportContactsBody` type that collides with the auto-derived Zod schema name.

**Why:** Node.js doesn't have `File`/`Blob` globals (browser-only). Orval generates `zod.instanceof(File)` for `format: binary` fields in multipart schemas.

**How to apply:** Any future multipart upload endpoints should be implemented as raw multer routes, not OpenAPI operations.

## replit-auth-web needs vite as devDep

`lib/replit-auth-web` uses `import.meta.env.BASE_URL` in its `use-auth.ts`. Without `vite` as a devDependency and `"types": ["vite/client"]` in its tsconfig, `tsc --build` fails with "Property 'env' does not exist on type 'ImportMeta'".

**How to apply:** Always add `vite` as a devDep to any lib that uses `import.meta.env`.

## CSS @import ordering

Google Fonts `@import url(...)` must come BEFORE `@import "tailwindcss"` in the app's `index.css`. Placing it after causes a PostCSS warning: "@import must precede all other statements".

## Body schema naming (OpenAPI)

Body schema component names must NOT match `<OperationIdPascal>Body` (e.g., don't name a schema `CreateNoteBody` when the operationId is `createNote`). Use entity-shaped names (`NoteInput`, `ContactInput`). Collision causes TS2308 during `pnpm run typecheck:libs` even though Orval itself succeeds.
