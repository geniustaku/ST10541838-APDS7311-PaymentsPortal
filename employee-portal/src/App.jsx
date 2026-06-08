import { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import api from './api.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Sidebar from './components/Sidebar.jsx';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/auth/me')
      .then(res => {
        const u = res.data.user;
        if (u && u.role === 'employee') setUser(u);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <div className="staff-shell d-flex flex-column flex-grow-1">
        <Topbar />
        {loading ? (
          <main className="flex-grow-1 d-flex align-items-center justify-content-center">
            <div className="spinner-border text-primary" role="status" />
          </main>
        ) : (
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <LayoutWithSidebar><Dashboard /></LayoutWithSidebar>
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
        <Footer />
      </div>
    </AuthContext.Provider>
  );
}

function Topbar() {
  const { user } = useAuth();

  return (
    <header className="staff-topbar">
      <div className="container-fluid px-4 d-flex align-items-center" style={{ height: 64 }}>
        <Link to={user ? '/dashboard' : '/login'} className="staff-brand text-decoration-none">
          <i className="bi bi-shield-lock-fill me-2" style={{ color: 'var(--staff-accent)' }} />
          International Payments &mdash; Staff Portal
        </Link>
        <div className="ms-auto d-flex align-items-center gap-3">
          {user && (
            <span className="small" style={{ color: 'rgba(255,255,255,0.85)' }}>
              <i className="bi bi-person-badge me-1" />{user.fullName}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

function LayoutWithSidebar({ children }) {
  return (
    <div className="staff-layout">
      <Sidebar />
      <main className="staff-content">{children}</main>
    </div>
  );
}

function Footer() {
  return (
    <footer className="py-3 text-center small" style={{ background: '#ffffff', borderTop: '1px solid var(--staff-border)', color: 'var(--staff-muted)' }}>
      ST10541838 &mdash; Genius Mhirizhonga &mdash; IIE Rosebank College &mdash; APDS7311 Task 3
    </footer>
  );
}

export default App;
