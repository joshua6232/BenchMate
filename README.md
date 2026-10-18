# Benchmate — interactive 3D PC workbench

A portfolio prototype that turns a real-time Three.js desk into navigation for PC troubleshooting, spending planning and guided assembly.

## Features
- Clickable desk objects, keyboard navigation, mobile drag controls and a non-WebGL fallback.
- Demand-driven rendering, paused motion by default, reduced-motion support and bounded drawing resolution.
- 100 searchable question phrasings across 20 saved, source-linked help guides. Search works without AI credentials.
- A spending planner that reserves extras before allocating hardware allowances, plus a ten-step assembly checklist and notes export.
- Authenticated workspace routes, D1 storage and optional server-side AI integration.

## Scope and honest limits
This is source for a prototype, not a verified public deployment. The help library and spending allocations are deterministic. Allocations are not retailer prices or compatibility checks. Live AI defaults off and has not been validated with paid requests. Hosted authentication, two-account isolation, real-device stability and public visitor access require deployment testing. Automated tests cannot establish those results.

The scene combines procedural 3D foreground geometry with generated image artwork. It is not a photorealistic reconstruction. See docs/ASSET-RIGHTS.md before public redistribution.

## Local setup
Use Node 22.13 or newer and npm. Node 24 is used in CI.

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_fearless_klaw.sql
npm run dev
```

Apply the migration once per local database. Open the URL printed by the development server. Local sign-in is simulated and is not production authentication. Some restricted Windows sandboxes cannot start the Workers runtime; use a normal local terminal. No API key is needed for saved help.

The exported `.openai/hosting.json` contains only local binding configuration. It deliberately has no Site identity. GitHub Pages cannot host these server routes and database. The original owner's checkout retains its existing Sites identity; production publishing must use the authorized Sites workflow and verified authentication, database bindings and sharing configuration. Do not enable simulated authentication on a public host.

## Checks
```sh
npx tsc --noEmit
node --experimental-strip-types --test tests/*.test.mjs
npm run build
```

CI runs these checks on pull requests and pushes. CI does not publish or invoke paid AI. A successful production build can still report a large 3D client bundle warning.

## Architecture
- `app/desk-scene.tsx` / `app/scene-engine.mjs`: accessible navigation and Three.js rendering.
- `app/workbench.tsx`: tools and workspace state.
- `lib/help-library.mjs` / `lib/help-details.mjs`: curated saved help.
- `app/api/`: server-side authenticated workspace and optional assistant routes.
- `db/` / `drizzle/`: D1 schema and migration.
- `lib/specialists.ts`: optional troubleshooting, parts and assembly prompt configurations.

## Optional AI
`.env.example` documents server-only configuration. Keep `AI_ENABLED=false` for the saved-guide release. Never commit credentials or place them in public environment variables. Request ceilings are not dollar budgets; enable provider spending controls and validate live responses before offering AI to visitors.

## License and attribution
No project-wide open-source license has been selected. Included third-party notices remain applicable; their licenses do not automatically license the whole project. Review docs/ASSET-RIGHTS.md and docs/GITHUB-RELEASE.md before publishing. Source availability is not a blanket grant of redistribution rights.
