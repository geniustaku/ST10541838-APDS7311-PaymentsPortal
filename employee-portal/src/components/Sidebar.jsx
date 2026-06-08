import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../App.jsx';

const SECTIONS = [
  {
    title: 'Workspace',
    items: [
      { key: 'overview',  label: 'Overview',       icon: 'bi-grid-1x2' },
      { key: 'pending',   label: 'Pending review', icon: 'bi-hourglass-split' },
      { key: 'verified',  label: 'Verified',       icon: 'bi-shield-check' },
      { key: 'submitted', label: 'Submitted',      icon: 'bi-send-check' },
      { key: 'activity',  label: 'Activity log',   icon: 'bi-clock-history' }
    ]
  },
  {
    title: 'Operations',
    items: [
      { key: 'customers', label: 'Customers',      icon: 'bi-people' }
    ]
  },
  {
    title: 'Governance',
    items: [
      { key: 'staff',     label: 'Staff accounts', icon: 'bi-person-badge' },
      { key: 'security',  label: 'Security policy', icon: 'bi-shield-lock' }
    ]
  }
];

export default function Sidebar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const current = params.get('view') || 'overview';

  const [counts, setCounts] = useState({ pending: 0, verified: 0, submitted: 0, customers: 0 });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/api/transactions'),
      api.get('/api/transactions/customers')
    ]).then(([tx, c]) => {
      if (cancelled) return;
      const next = { pending: 0, verified: 0, submitted: 0, customers: 0 };
      for (const t of tx.data.transactions || []) {
        if (next[t.Status] !== undefined) next[t.Status] += 1;
      }
      next.customers = (c.data.customers || []).length;
      setCounts(next);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [params]);

  function pick(key) {
    const next = new URLSearchParams();
    next.set('view', key);
    setParams(next, { replace: true });
  }

  async function handleLogout() {
    try { await api.post('/api/auth/logout'); } catch { /* ignore */ }
    setUser(null);
    navigate('/login');
  }

  return (
    <aside className="staff-sidebar">
      {SECTIONS.map(section => (
        <div key={section.title}>
          <div className="sidebar-section">{section.title}</div>
          {section.items.map(item => (
            <button
              key={item.key}
              type="button"
              className={`sidebar-link ${current === item.key ? 'active' : ''}`}
              onClick={() => pick(item.key)}
            >
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
              {counts[item.key] !== undefined && counts[item.key] > 0 && (
                <span className="count">{counts[item.key]}</span>
              )}
            </button>
          ))}
        </div>
      ))}

      <div className="sidebar-footer">
        {user && (
          <>
            <div className="sidebar-user">
              <div className="fw-semibold">{user.fullName}</div>
              <div className="role">{user.username} &middot; Operator</div>
            </div>
            <button type="button" className="sidebar-link" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right" />
              <span>Sign out</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
