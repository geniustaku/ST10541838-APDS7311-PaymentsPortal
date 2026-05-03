import { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import api from './api.js';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import Payment from './pages/Payment.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Auth context: single source of truth for who is logged in on the client.
// Note: the actual auth token is in an HttpOnly cookie — the browser sends it automatically.
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, ask the backend if there's a valid session cookie.
  useEffect(() => {
    api.get('/api/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Navbar />
      <div className="container py-4">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : (
          <Routes>
            <Route path="/" element={user ? <Navigate to="/payment" /> : <Navigate to="/login" />} />
            <Route path="/register" element={user ? <Navigate to="/payment" /> : <Register />} />
            <Route path="/login"    element={user ? <Navigate to="/payment" /> : <Login />} />
            <Route path="/payment"  element={<ProtectedRoute><Payment /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
      </div>
      <Footer />
    </AuthContext.Provider>
  );
}

function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await api.post('/api/auth/logout');
    } catch { /* ignore */ }
    setUser(null);
    navigate('/login');
  }

  return (
    <nav className="navbar navbar-expand navbar-dark bg-dark px-3 shadow-sm">
      <Link className="navbar-brand fw-bold" to="/">
        <i className="bi bi-shield-lock-fill me-2" />International Payments
      </Link>
      <div className="ms-auto">
        {user ? (
          <div className="d-flex align-items-center gap-3">
            <span className="text-white-50 small">
              <i className="bi bi-person-circle me-1" />{user.fullName}
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1" />Logout
            </button>
          </div>
        ) : (
          <div className="d-flex gap-2">
            <Link className="btn btn-outline-light btn-sm" to="/login">Login</Link>
            <Link className="btn btn-light btn-sm" to="/register">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-dark text-white-50 py-3 mt-5">
      <div className="container text-center small">
        ST10541838 &mdash; Genius Mhirizhonga &mdash; IIE Rosebank College &mdash; APDS7311 Task 2
      </div>
    </footer>
  );
}

export default App;
