import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function AdminPanel() {
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('requests');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'ACCOUNT_HOLDER' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPending();
    loadUsers();
    loadAllAccounts();
  }, []);

  async function loadAllAccounts() {
    try {
      const res = await api.get('/accounts/all');
      setAllAccounts(res.data);
    } catch { /* silent */ }
  }

  async function loadPending() {
    try {
      const res = await api.get('/accounts/pending');
      setPending(res.data);
    } catch {
      setError('Failed to load pending requests');
    }
  }

  async function loadUsers() {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch {
      setError('Failed to load users');
    }
  }

  async function approve(id) {
    if (!window.confirm('Approve this account request?')) return;
    try {
      await api.post(`/accounts/${id}/approve`);
      setSuccess('Account approved successfully');
      await loadPending();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve');
    }
  }

  async function reject(id) {
    if (!window.confirm('Reject this account request? This cannot be undone.')) return;
    try {
      await api.post(`/accounts/${id}/reject`);
      setSuccess('Account request rejected');
      await loadPending();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject');
    }
  }

  async function closeAccount(id, accountNumber) {
    if (!window.confirm(`Close account ${accountNumber}? This requires zero balance and cannot be undone.`)) return;
    try {
      await api.delete(`/accounts/${id}`);
      setSuccess(`Account ${accountNumber} closed`);
      await loadPending();
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to close account');
    }
  }

  async function createUser(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await api.post('/auth/users', form);
      setSuccess(`User "${res.data.username}" created with role ${res.data.role}`);
      setForm({ username: '', email: '', password: '', role: 'ACCOUNT_HOLDER' });
      setShowCreateUser(false);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  }

  const roleColor = { ADMIN: 'badge-red', ACCOUNT_HOLDER: 'badge-blue', AUDITOR: 'badge-amber' };
  const roleLabel = { ADMIN: 'Admin', ACCOUNT_HOLDER: 'Account Holder', AUDITOR: 'Auditor' };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Admin Panel</div>
        <div className="page-subtitle">Manage account requests, users, and system access</div>
      </div>

      {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
      {success && <div className="alert alert-success"><span>✓</span> {success}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Pending Requests</div>
          <div className="stat-value" style={{ color: pending.length > 0 ? '#d97706' : undefined }}>{pending.length}</div>
          <div className="stat-sub">awaiting review</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{users.length}</div>
          <div className="stat-sub">registered</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Account Holders</div>
          <div className="stat-value">{users.filter(u => u.role === 'ACCOUNT_HOLDER').length}</div>
          <div className="stat-sub">regular users</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Auditors</div>
          <div className="stat-value">{users.filter(u => u.role === 'AUDITOR').length}</div>
          <div className="stat-sub">read-only access</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['requests', 'users', 'accounts'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-outline'}`}>
            {tab === 'requests' ? `Account Requests (${pending.length})` : tab === 'users' ? 'User Management' : `All Accounts (${allAccounts.length})`}
          </button>
        ))}
        <Link to="/audit" className="btn btn-sm btn-outline" style={{ marginLeft: 'auto' }}>
          View Audit Log →
        </Link>
      </div>

      {activeTab === 'requests' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Pending Account Requests</span>
          </div>
          {pending.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">No pending requests. All caught up!</div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Request ID</th>
                    <th>Owner</th>
                    <th>Type</th>
                    <th>Requested</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(acc => (
                    <tr key={acc.id}>
                      <td style={{ color: 'var(--gray-400)', fontSize: '0.78rem' }}>{acc.id}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{acc.accountNumber}</td>
                      <td style={{ fontWeight: 500 }}>{acc.owner?.username}</td>
                      <td>
                        <span className="badge badge-blue">{acc.accountType}</span>
                      </td>
                      <td style={{ color: 'var(--gray-500)', fontSize: '0.82rem' }}>
                        {new Date(acc.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-primary" onClick={() => approve(acc.id)}>
                            ✓ Approve
                          </button>
                          <button className="btn btn-sm btn-outline"
                            style={{ color: '#dc2626', borderColor: '#dc2626' }}
                            onClick={() => reject(acc.id)}>
                            ✕ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">All Users</span>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowCreateUser(!showCreateUser); setError(''); setSuccess(''); }}>
              {showCreateUser ? '✕ Cancel' : '+ Create User'}
            </button>
          </div>

          {showCreateUser && (
            <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--gray-700)' }}>New User</div>
              <form onSubmit={createUser}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input className="form-input" placeholder="username" value={form.username}
                      onChange={e => setForm({ ...form, username: e.target.value })} required minLength={3} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" placeholder="user@example.com" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                      <option value="ACCOUNT_HOLDER">Account Holder</option>
                      <option value="AUDITOR">Auditor</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><span className="spinner"></span> Creating...</> : 'Create User'}
                </button>
              </form>
            </div>
          )}

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--gray-400)', fontSize: '0.78rem' }}>{u.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--blue), #6366f1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 700, color: 'white', flexShrink: 0
                        }}>
                          {u.username[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{u.username}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>{u.email}</td>
                    <td><span className={`badge ${roleColor[u.role]}`}>{roleLabel[u.role]}</span></td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.82rem' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'accounts' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">All Accounts</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Account No.</th><th>Owner</th><th>Type</th><th>Balance</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allAccounts.map(acc => (
                  <tr key={acc.id}>
                    <td style={{ color: 'var(--gray-400)', fontSize: '0.78rem' }}>{acc.id}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{acc.accountNumber}</td>
                    <td style={{ fontWeight: 500 }}>{acc.owner?.username}</td>
                    <td><span className="badge badge-blue">{acc.accountType}</span></td>
                    <td style={{ fontWeight: 600 }}>${parseFloat(acc.balance).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${
                        acc.status === 'ACTIVE' ? 'badge-green' :
                        acc.status === 'PENDING' ? 'badge-amber' :
                        acc.status === 'CLOSED' ? 'badge-gray' : 'badge-red'
                      }`}>{acc.status}</span>
                    </td>
                    <td>
                      {acc.status === 'ACTIVE' && (
                        <button className="btn btn-sm btn-outline"
                          style={{ color: '#dc2626', borderColor: '#dc2626', fontSize: '0.75rem' }}
                          onClick={() => closeAccount(acc.id, acc.accountNumber)}>
                          Close
                        </button>
                      )}
                      {acc.status !== 'ACTIVE' && <span style={{ color: 'var(--gray-400)', fontSize: '0.82rem' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
