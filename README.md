# Trace-to-Trust

Trace-to-Trust is a full-stack traceability platform for product authenticity.

It lets producers create product batches, attach supply-chain events, sign critical events, generate QR labels, and let consumers verify a label by scanning it.

## Project idea

Counterfeit and low-trust supply chains are hard to audit for end users. This project solves that by combining:

- A **producer dashboard** to register batches and event history.
- A **consumer verification page** that checks the label and event integrity.
- A **MongoDB-backed event chain** per batch.
- **Digital signatures** on event hashes to detect tampering.

Target product categories in this implementation include:

- Honey
- Frankincense
- Dates
- Fish

## High-level approach

The core approach is event-based traceability:

1. A producer creates a batch (`Products` collection).
2. The producer appends supply-chain events (`batch_events` collection).
3. Events can be cryptographically signed (Ed25519) using the server keypair.
4. Labels are generated (`labels` collection) and printed as QR codes.
5. A consumer scans a label and the app verifies:
   - Label exists
   - Batch exists
   - Signed event integrity
   - Revocation status
   - Suspicious scan frequency

Verification status returned by the backend is one of:

- `valid`
- `unsigned`
- `tampered`
- `revoked`

## Tech stack

- Frontend: React + Vite + Tailwind + Radix UI
- Backend: Node.js + Express
- Database: MongoDB Atlas
- Signing: Node `crypto` (Ed25519)
- QR generation: `qrcode`

## Repository structure

- `Client/` frontend app (public landing, scanner, verify page, producer dashboard)
- `Server/` Express API and MongoDB integration
- `api/index.js` Vercel function entrypoint that serves the Express API
- `vercel.json` Vercel build, output, and single-page-app routing configuration

## Data model

The backend uses database `tracetotrust` and these collections:

- `Products`
  - Batch metadata (name, type, origin, quantity, dates, revoked state)
- `batch_events`
  - Event log per batch (type, payload JSON, payload hash, signature, timestamps)
- `labels`
  - Label code per batch, scan counters, first/last scan timestamps

## API summary

Main backend routes:

- `GET /api/health`
- `POST /api/batches`
- `GET /api/batches`
- `GET /api/batches/:id`
- `POST /api/batches/:id/events`
- `POST /api/events/:id/sign`
- `POST /api/batches/:id/labels`
- `GET /api/labels/:code/qr`
- `GET /api/verify/:code`
- `POST /api/batches/:id/revoke`
- `GET /api/admin/stats`

## Run locally (full setup)

### Prerequisites

- Node.js 20+ recommended
- npm
- MongoDB Atlas cluster and credentials

### 1) Configure backend

Create `Server/.env`:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/
MONGO_DB_NAME=tracetotrust
PORT=3000
ADMIN_PASSWORD=<admin-password>
```

Notes:

- `MONGO_URI` should not include a database path at the end.
- `MONGO_DB_NAME` must be exactly `tracetotrust` if you want this project DB.
- Local signing keys are loaded from `Server/keys.json` when present. For Vercel, use stable signing-key environment variables instead of relying on a filesystem key file.

### 2) Install dependencies

From the repository root:

```powershell
cd "C:\Users\user\Desktop\Ongoing Projects\trace_to_trust\Trace-to-Trust"
npm install
```

You can still install a workspace directly when needed.

Backend only:

```powershell
cd "C:\Users\user\Desktop\Ongoing Projects\trace_to_trust\Trace-to-Trust\Server"
npm install
```

Frontend:

```powershell
cd "C:\Users\user\Desktop\Ongoing Projects\trace_to_trust\Trace-to-Trust\Client"
npm install
```

### 3) Start backend

```powershell
cd "C:\Users\user\Desktop\Ongoing Projects\trace_to_trust\Trace-to-Trust\Server"
npm run dev
```

Expected log:

- `Connected to MongoDB`
- `Trace-to-Trust backend running on http://localhost:3000`
- `MongoDB Database: tracetotrust`

### 4) Start frontend

```powershell
cd "C:\Users\user\Desktop\Ongoing Projects\trace_to_trust\Trace-to-Trust\Client"
npm run dev
```

Open:

- `http://localhost:8080`

Proxy behavior:

- Frontend proxies `/api/*` to backend target.
- Default backend target is `http://localhost:3000`.
- Optional override in client env: `VITE_API_TARGET`.

### 5) Seed sample data

The seed script creates four sample batches, signed journey events, and stable QR label codes without duplicating records on reruns:

```powershell
cd "C:\Users\user\Desktop\Ongoing Projects\trace_to_trust\Trace-to-Trust"
npm run seed
```

Primary verification path:

- `/verify/OM-HNY-SIDR-2026-001`

Other seeded labels:

- `/verify/OM-FRK-DHOFAR-2026-001`
- `/verify/OM-DAT-NIZWA-2026-001`
- `/verify/OM-FSH-SUR-2026-001`

## Deploy to Vercel

The deploy root is the repository root. Vercel builds the Vite client from `Client/` and serves the Express API through `api/index.js`.

Required Vercel environment variables:

```env
MONGO_URI=<MongoDB Atlas connection string>
MONGO_DB_NAME=tracetotrust
ADMIN_PASSWORD=<admin-password>
SIGNING_PUBLIC_KEY_PEM_B64=<base64 PEM public key>
SIGNING_PRIVATE_KEY_PEM_B64=<base64 PEM private key>
SIGNING_KEY_CREATED_AT=<optional ISO timestamp>
```

Recommended production deploy:

```powershell
cd "C:\Users\user\Desktop\Ongoing Projects\trace_to_trust\Trace-to-Trust"
npm run build
vercel --prod
```

The deployed app should use same-origin API calls like `/api/health`, `/api/batches`, and `/api/verify/:code`.

## How to use the app

### Producer flow

The admin dashboard is not linked from the public landing page. Open the private admin path directly and enter the configured admin password:

- Local: `http://localhost:8080/trust-ops`
- Production: `https://trace-to-trust.vercel.app/trust-ops`

After login:

1. Create a batch.
2. Add one or more events to the batch.
3. Sign events (for integrity verification).
4. Generate labels.
5. Open label PNG links to get QR images for printing.

### Consumer flow

1. Scan QR from homepage scanner or open `/verify/:code`.
2. Review verification badge, product details, event timeline, and scan count.

## QR labels and verification

This project currently supports **QR codes** for labels, not linear barcodes.

QR image endpoint:

- `GET /api/labels/:code/qr`

Verification endpoint:

- `GET /api/verify/:code`

## Security and integrity notes

- Server creates/loads signing keys from `Server/keys.json`.
- Event payload is canonicalized and hashed (`sha256`).
- Signature validation uses the stored public key.
- A high scan count is flagged as suspicious.
- Admin API routes require the configured `ADMIN_PASSWORD` through an HTTP-only session cookie or the `x-admin-password` header for smoke tests.

## Troubleshooting

### Batch not visible in MongoDB

Check all of the following:

1. Backend is started from `Server/` directory.
2. `Server/.env` has `MONGO_DB_NAME=tracetotrust`.
3. Atlas Data Explorer is opened on database `tracetotrust` and collection `Products` (capital P).
4. Search by app field `id` if needed, not only `_id`.

### QR URL fails with port 8081

Use proxied URL from frontend domain:

- `http://localhost:8080/api/labels/<code>/qr`

Do not hardcode backend as `8081`.

### Frontend cannot reach backend

- Ensure backend is running on port `3000`.
- Restart Vite after config/env changes.
- If using custom backend URL, set `VITE_API_TARGET` in client env.

## Smoke test

Run backend smoke test (requires backend running):

```powershell
cd "C:\Users\user\Desktop\Ongoing Projects\trace_to_trust\Trace-to-Trust\Server"
npm run test:smoke
```

## Future improvements

- Role-based admin accounts instead of a single shared admin password.
- Barcode (Code128) endpoint in addition to QR.
- Better indexing and query optimization for large-scale data.
- Tamper-evident audit trails for admin operations.
- Production-grade observability for API errors, verification events, and suspicious scan spikes.
