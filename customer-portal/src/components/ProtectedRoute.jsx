import { Navigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';

// Guards the /payment route. If there's no verified user in context, redirect to /login.
// The real enforcement is on the backend (requireCustomer middleware) — this is a UX layer.
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
