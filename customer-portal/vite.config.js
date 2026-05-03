import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

// Only enable HTTPS for the dev server when the local self-signed cert exists.
// In CI / production builds the cert is intentionally not in the repo, so we skip it.
const keyPath = '../backend/ssl/server.key';
const certPath = '../backend/ssl/server.cert';
const httpsConfig =
  fs.existsSync(keyPath) && fs.existsSync(certPath)
    ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
    : false;

// SECURITY: Vite dev server runs over HTTPS using the same self-signed cert as the backend
// when those files are present locally. This makes Secure cookies flow during E2E testing.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https: httpsConfig
  }
});
