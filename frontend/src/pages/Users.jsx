import { useState, useEffect } from 'react';
import api from '../api';

const ROLES = ['ACCOUNT_HOLDER', 'AUDITOR', 'ADMIN'];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'ACCOUNT_HOLDER' });

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch {
      setError('Failed to load users');
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await api.post('/auth/users', form);
      setSuccess(`User "${res.data.username}" created with role ${res.data.role}`);
      setForm({ username: '', email: '', password: '', role: 'ACCOUNT_HOLDER' });
      setShowForm(false);
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
        <div className="page-title">User Management</div>
        <div className="page-subtitle">Create and manage system users</div>
      </div>

      {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
      {success && <div className="alert alert-success"><span>✓</span> {success}</div>}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{users.length}</div>
          <div className="stat-sub">registered accounts</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Admins</div>
          <div className="stat-value">{users.filter(u => u.role === 'ADMIN').length}</div>
          <div className="stat-sub">system administrators</div>
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

      {/* Create User */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">All Users</span>
          <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}>
            {showForm ? '✕ Cancel' : '+ Create User'}
          </button>
        </div>

        {showForm && (
          <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--gray-700)' }}>New User</div>
            <form onSubmit={handleCreate}>
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
                    {ROLES.map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><span className="spinner"></span> Creating...</> : 'Create User'}
              </button>
            </form>
          </div>
        )}

        {users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <div className="empty-state-text">No users found.</div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
