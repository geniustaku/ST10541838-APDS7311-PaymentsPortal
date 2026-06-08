import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

// Served at /employee/* by the backend. The base path makes all asset URLs absolute.
const keyPath = '../backend/ssl/server.key';
const certPath = '../backend/ssl/server.cert';
const httpsConfig = fs.existsSync(keyPath) && fs.existsSync(certPath)
  ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
  : false;

export default defineConfig({
  plugins: [react()],
  base: '/employee/',
  server: {
    port: 5174,
    https: httpsConfig
  }
});
