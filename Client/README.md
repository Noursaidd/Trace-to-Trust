
# Trace-to-Trust Client

This is the Vite React frontend for Trace-to-Trust. It includes the public landing page, QR verification flow, and producer/admin dashboard.

The original UI design source is available at https://www.figma.com/design/mOtF7zjqMeqU24k6NWcBOl/Trace-to-Trust-Web-App-UI.

## Running The Client

From the repository root:

```powershell
npm install
npm run dev:client
```

Or from `Client/`:

```powershell
npm install
npm run dev
```

The local Vite server runs on `http://localhost:8080` and proxies `/api/*` to `http://localhost:3000` by default.

## Deployment

Deploy from the repository root, not from this folder. Vercel uses the root `vercel.json`, builds this client into `Client/dist`, and routes `/api/*` to the Express API function.
