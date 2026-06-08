export function fmtDate(d) {
  return d ? new Date(d).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

export function fmtDateShort(d) {
  return d ? new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

export function statusPill(status) {
  const cls = `status-pill status-${status}`;
  return cls;
}
