# Contributing to FerreOn ERP

## Development Setup
1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env.local` and populate the variables
4. Run `npm run dev` to start the development server

<!-- AUTO-GENERATED -->
## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | next dev |
| `npm run build` | next build |
| `npm run start` | next start |
| `npm run lint` | next lint |
| `npm run typecheck` | tsc --noEmit |
| `npm run test` | vitest run |
| `npm run test:watch` | vitest |
| `npm run test:coverage` | vitest run --coverage |
| `npm run test:e2e` | playwright test |
| `npm run supabase:gen-types` | supabase gen types typescript --local > src/infrastructure/persistence/supabase/database.types.ts |
<!-- /AUTO-GENERATED -->
