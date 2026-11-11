import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
      });
      setSuccess('Account created! Redirecting to sign in...');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
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
            Start moving<br />
            money <span>safely</span>.
          </h1>
          <p className="auth-desc">
            Create your account and get access to a full-featured financial ledger with real-time balances, transaction history and audit logs.
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">💳</div>
              <span>Create multiple accounts instantly</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">↔️</div>
              <span>Transfer, deposit and withdraw securely</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">📊</div>
              <span>Full transaction statement per account</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">✅</div>
              <span>Balance always conserved — guaranteed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-header">
          <h2 className="auth-form-title">Create your account</h2>
          <p className="auth-form-sub">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>

        {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
        {success && <div className="alert alert-success"><span>✓</span> {success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              placeholder="Choose a username (3–50 chars)"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
              minLength={3}
              maxLength={50}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || !!success}>
            {loading ? <><span className="spinner"></span> Creating account...</> : 'Create Account'}
          </button>
        </form>

        <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', textAlign: 'center', marginTop: '1rem' }}>
          By registering you agree to our terms. New accounts are created as Account Holders.
        </p>
      </div>
    </div>
  );
}
