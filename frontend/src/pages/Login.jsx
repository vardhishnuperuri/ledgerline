import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('username', res.data.username);
      onLogin();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">
            <div className="auth-brand-logo">L</div>
            <span className="auth-brand-name">LedgerLine</span>
          </div>
          <h1 className="auth-tagline">
            Money movement<br />
            you can <span>prove</span>.
          </h1>
          <p className="auth-desc">
            Every transaction is accurate, authorised, traceable and recorded in a reliable ledger. The books always balance.
          </p>
          <div className="auth-features">
            <div className="auth-feature"><div className="auth-feature-icon">🔒</div><span>Role-based access control for every action</span></div>
            <div className="auth-feature"><div className="auth-feature-icon">⚡</div><span>Idempotent transactions — no duplicate payments</span></div>
            <div className="auth-feature"><div className="auth-feature-icon">📋</div><span>Append-only audit trail for full traceability</span></div>
            <div className="auth-feature"><div className="auth-feature-icon">🛡️</div><span>Concurrency-safe with pessimistic locking</span></div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-header">
          <h2 className="auth-form-title">Welcome back</h2>
          <p className="auth-form-sub">
            Don't have an account? <Link to="/register">Create one free</Link>
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              placeholder="Enter your username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <><span className="spinner"></span> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">Quick access</div>
        <div className="demo-creds">
          <div className="demo-creds-title">Click to fill credentials</div>
          {[
            { user: 'admin', pwd: 'Admin@LedgerLine1', role: 'Admin' },
            { user: 'alice', pwd: 'test123', role: 'Account Holder' },
            { user: 'bob', pwd: 'test123', role: 'Account Holder' },
            { user: 'auditor', pwd: 'test123', role: 'Auditor' },
          ].map(({ user, pwd, role }) => (
            <div
              key={user}
              className="demo-cred-row"
              style={{ cursor: 'pointer', padding: '0.3rem 0.25rem', borderRadius: '4px', transition: 'background 0.1s' }}
              onClick={() => setForm({ username: user, password: pwd })}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span><code>{user}</code> — {role}</span>
              <code>{pwd}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
