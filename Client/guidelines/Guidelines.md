# Trace-to-Trust Project Guidelines

## Product Scope

- Keep the project focused on product traceability for Omani goods: honey, frankincense, dates, and fish.
- Prioritize implemented behavior over aspirational copy. If a screen says a capability exists, connect it to the API or label it as future work.
- Use `/verify/:code` as the primary consumer experience and `/trust-ops` as the private producer/admin experience.

## Data And API Rules

- Use the backend API in `Server/index.js` for all product, event, label, verification, and stats data.
- Keep QR labels unique per item. Seed labels should use stable, readable public-style codes.
- Preserve event integrity fields: `payload_json`, `payload_hash`, `signature`, and `signed_at`.
- Do not commit secrets, Atlas credentials, or signing keys. Use `.env`, `.env.local`, or Vercel environment variables.

## UI Rules

- Keep the interface bilingual-ready and route-safe; avoid hardcoded navigation that bypasses React Router.
- Keep important actions visible on mobile: scan, create batch, add event, sign event, generate label, revoke.
- Verification status must be understandable without reading technical details.
- Use the existing Tailwind, Radix UI, shadcn-style components, and app tokens before adding new UI dependencies.

## Deployment Rules

- The Vercel deployment is rooted at the repository root, not inside `Client`.
- The Vite client builds to `Client/dist`; API requests stay same-origin under `/api/*`.
- The Express API is exported through `api/index.js` for Vercel and still runs locally with `npm run dev --workspace=Server`.
- Required Vercel environment variables: `MONGO_URI`, `MONGO_DB_NAME`, `ADMIN_PASSWORD`, and stable signing key variables.
- Do not link the admin console from the public landing page. The direct path is `/trust-ops`, and it must stay password-protected.

## Quality Bar

- Run `npm run build` from the root before deployment.
- Run the seed script only when sample data is needed: `npm run seed`.
- Verify the consumer flow with a real label code, especially `/verify/OM-HNY-SIDR-2026-001`.
- Keep sample data idempotent so rerunning the seed script does not create duplicate batches or labels.
