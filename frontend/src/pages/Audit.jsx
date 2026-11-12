import { useState, useEffect } from 'react';
import api from '../api';

const ACTION_COLORS = {
  LOGIN: 'badge-blue',
  REGISTER: 'badge-green',
  CREATE_ACCOUNT: 'badge-green',
  DEPOSIT: 'badge-green',
  WITHDRAWAL: 'badge-red',
  TRANSFER: 'badge-blue',
};

function AuditSkeleton() {
  return (
    <div>
      <div className="page-header">
        <div className="skeleton" style={{ height: 28, width: '20%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: '35%' }} />
      </div>
      <div className="stats-grid">
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton-card">
            <div className="skeleton skeleton-text" style={{ width: '50%' }} />
            <div className="skeleton" style={{ height: 36, width: '40%', marginBottom: 8 }} />
            <div className="skeleton skeleton-text" style={{ width: '60%' }} />
          </div>
        ))}
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

const PAGE_SIZE = 20;

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/audit')
      .then(res => setLogs(res.data.reverse()))
      .catch(() => setError('Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AuditSkeleton />;

  const actions = ['ALL', ...new Set(logs.map(l => l.action))];

  const filtered = logs.filter(l => {
    const matchAction = filterAction === 'ALL' || l.action === filterAction;
    const matchSearch = !search ||
      l.actorUsername.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.detail || '').toLowerCase().includes(search.toLowerCase());
    return matchAction && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = {
    total: logs.length,
    logins: logs.filter(l => l.action === 'LOGIN').length,
    transactions: logs.filter(l => ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'].includes(l.action)).length,
    accounts: logs.filter(l => l.action === 'CREATE_ACCOUNT').length,
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Audit Log</div>
        <div className="page-subtitle">Append-only record of every action in the system</div>
      </div>

      {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Events</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-sub">all time</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Logins</div>
          <div className="stat-value">{stats.logins}</div>
          <div className="stat-sub">authentication events</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Transactions</div>
          <div className="stat-value">{stats.transactions}</div>
          <div className="stat-sub">money movements</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Accounts Created</div>
          <div className="stat-value">{stats.accounts}</div>
          <div className="stat-sub">new accounts</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Events ({filtered.length})</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <input
            className="form-input"
            placeholder="Search by actor, action or detail..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: '200px' }}
          />
          <select className="form-select" value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1); }}
            style={{ width: 'auto', minWidth: '150px' }}>
            {actions.map(a => <option key={a} value={a}>{a === 'ALL' ? 'All Actions' : a}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">No audit events found.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(log => (
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

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button className="btn btn-sm btn-outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) => p === '...' ? (
                  <span key={`e${i}`} style={{ padding: '0.3rem 0.5rem', color: 'var(--gray-400)' }}>…</span>
                ) : (
                  <button key={p} className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPage(p)}>{p}</button>
                ))}
              <button className="btn btn-sm btn-outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
