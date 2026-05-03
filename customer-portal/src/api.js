import axios from 'axios';

// In production the React app is served by the same backend, so calls go to '' (same origin).
// In dev the React dev server is on :5173 and the API on :3000, so VITE_API_URL points at the API.
// SECURITY: withCredentials=true makes the browser send the HttpOnly JWT cookie. The cookie is
// not readable from JavaScript, which is the entire point.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
