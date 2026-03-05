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
```

Notes:

- `MONGO_URI` should not include a database path at the end.
- `MONGO_DB_NAME` must be exactly `tracetotrust` if you want this project DB.

### 2) Install dependencies

Backend:

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

## How to use the app

### Producer flow

1. Open `http://localhost:8080/admin`.
2. Create a batch.
3. Add one or more events to the batch.
4. Sign events (for integrity verification).
5. Generate labels.
6. Open label PNG links to get QR images for printing.

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

- Server-side auth enforcement for admin endpoints.
- Barcode (Code128) endpoint in addition to QR.
- Better indexing and query optimization for large-scale data.
- Role-based access and audit trails.
