import { useEffect, useState } from 'react';
import api from '../api.js';
import { fmtDate } from './util.js';

export default function Activity() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get('/api/transactions/audit/recent')
      .then(res => { if (!cancelled) setEntries(res.data.entries || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = filter
    ? entries.filter(a =>
        (a.Actor && a.Actor.toLowerCase().includes(filter.toLowerCase())) ||
        (a.Action && a.Action.toLowerCase().includes(filter.toLowerCase())) ||
        (a.Notes && a.Notes.toLowerCase().includes(filter.toLowerCase())))
    : entries;

  return (
    <>
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h3 className="mb-1" style={{ color: 'var(--staff-ink)' }}>Activity log</h3>
          <p className="mb-0 small text-muted-strong">Audit trail of sensitive actions across both portals.</p>
        </div>
        <input
          type="search"
          className="form-control form-control-sm"
          style={{ maxWidth: 280 }}
          placeholder="Filter actor, action or note..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      <div className="staff-card">
        <div className="card-body p-3">
          {loading ? (
            <p className="small mb-0 text-muted-strong">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="small mb-0 text-muted-strong">No entries match.</p>
          ) : filtered.map(a => (
            <div key={a.AuditId} className="audit-row d-flex align-items-center">
              <div className="flex-grow-1">
                <span className="audit-actor me-2">{a.Actor}</span>
                <span className="audit-action">{a.Action}</span>
                {a.Notes && <span className="small ms-2 text-muted-strong">— {a.Notes}</span>}
                {a.IpAddress && <span className="small ms-2 text-muted-strong">&middot; {a.IpAddress}</span>}
              </div>
              <div className="audit-time">{fmtDate(a.CreatedAt)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
