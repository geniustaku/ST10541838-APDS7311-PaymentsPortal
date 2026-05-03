import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

// SECURITY: Vite dev server runs over HTTPS using the same self-signed cert as the backend.
// Required so the browser sends the HttpOnly cookie (marked Secure in prod) over an HTTPS origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https: {
      key: fs.readFileSync('../backend/ssl/server.key'),
      cert: fs.readFileSync('../backend/ssl/server.cert')
    }
  }
});
