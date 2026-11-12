import { useState, useEffect, useCallback } from 'react';
import api from '../api';

const ACTION_COLORS = {
  LOGIN: 'badge-blue',
  REGISTER: 'badge-green',
  CREATE_ACCOUNT: 'badge-green',
  DEPOSIT: 'badge-green',
  WITHDRAWAL: 'badge-red',
  TRANSFER: 'badge-blue',
  ACCOUNT_APPROVED: 'badge-green',
  ACCOUNT_REJECTED: 'badge-red',
  ACCOUNT_CLOSED: 'badge-red',
};

const PAGE_SIZE = 20;

function AuditSkeleton() {
  return (
    <div>
      <div className="page-header">
        <div className="skeleton" style={{ height: 28, width: '20%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: '35%' }} />
      </div>
      <div className="card">
        <div className="skeleton skeleton-title" />
        {[1,2,3,4,5].map(i => (
          <div key={i} className="skeleton-row">
            <div className="skeleton" style={{ height: 14, width: '8%' }} />
            <div className="skeleton" style={{ height: 14, width: '15%' }} />
            <div className="skeleton" style={{ height: 14, width: '12%' }} />
            <div className="skeleton" style={{ height: 14, width: '10%' }} />
            <div className="skeleton" style={{ height: 14, flex: 1 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Audit() {
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0, page: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actor, setActor] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(0);

  const ACTIONS = ['ALL','LOGIN','REGISTER','ACCOUNT_REQUESTED','ACCOUNT_APPROVED','ACCOUNT_REJECTED',
                   'ACCOUNT_CLOSED','DEPOSIT','WITHDRAWAL','TRANSFER'];

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: PAGE_SIZE });
    if (actor) params.append('actor', actor);
    if (filterAction !== 'ALL') params.append('action', filterAction);
    if (fromDate) params.append('from', new Date(fromDate).toISOString());
    if (toDate) params.append('to', new Date(toDate + 'T23:59:59').toISOString());
    api.get(`/audit?${params}`)
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, [page, actor, filterAction, fromDate, toDate]);

  useEffect(() => { load(); }, [load]);

  function handleFilter() { setPage(0); load(); }

  if (loading && data.content.length === 0) return <AuditSkeleton />;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Audit Log</div>
        <div className="page-subtitle">Append-only record of every action — {data.totalElements} total events</div>
      </div>

      {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Events ({data.totalElements})</span>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <input className="form-input" placeholder="Filter by actor..." value={actor}
            onChange={e => setActor(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFilter()}
            style={{ flex: 1, minWidth: '160px' }} />
          <select className="form-select" value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(0); }}
            style={{ width: 'auto', minWidth: '160px' }}>
            {ACTIONS.map(a => <option key={a} value={a}>{a === 'ALL' ? 'All Actions' : a}</option>)}
          </select>
          <input className="form-input" type="date" value={fromDate}
            onChange={e => { setFromDate(e.target.value); setPage(0); }}
            style={{ width: 'auto' }} title="From date" />
          <input className="form-input" type="date" value={toDate}
            onChange={e => { setToDate(e.target.value); setPage(0); }}
            style={{ width: 'auto' }} title="To date" />
          {(actor || filterAction !== 'ALL' || fromDate || toDate) && (
            <button className="btn btn-sm btn-outline" onClick={() => {
              setActor(''); setFilterAction('ALL'); setFromDate(''); setToDate(''); setPage(0);
            }}>✕ Clear</button>
          )}
        </div>

        {data.content.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">No audit events found.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map(log => (
                  <tr key={log.id}>
                    <td style={{ color: 'var(--gray-400)', fontSize: '0.78rem' }}>{log.id}</td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--gray-500)', fontSize: '0.82rem' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--blue), #6366f1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.65rem', fontWeight: 700, color: 'white', flexShrink: 0
                        }}>
                          {log.actorUsername[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{log.actorUsername}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${ACTION_COLORS[log.action] || 'badge-gray'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                      {log.entityType ? `${log.entityType} #${log.entityId}` : '—'}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--gray-600)', maxWidth: '280px' }}>
                      {log.detail || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
              Page {page + 1} of {data.totalPages} · {data.totalElements} events
            </span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button className="btn btn-sm btn-outline" onClick={() => setPage(0)} disabled={page === 0}>«</button>
              <button className="btn btn-sm btn-outline" onClick={() => setPage(p => p - 1)} disabled={page === 0}>‹ Prev</button>
              {Array.from({ length: data.totalPages }, (_, i) => i)
                .filter(p => p === 0 || p === data.totalPages - 1 || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) => p === '...' ? (
                  <span key={`e${i}`} style={{ padding: '0.3rem 0.5rem', color: 'var(--gray-400)' }}>…</span>
                ) : (
                  <button key={p} className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setPage(p)}>{p + 1}</button>
                ))}
              <button className="btn btn-sm btn-outline" onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages - 1}>Next ›</button>
              <button className="btn btn-sm btn-outline" onClick={() => setPage(data.totalPages - 1)} disabled={page >= data.totalPages - 1}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
