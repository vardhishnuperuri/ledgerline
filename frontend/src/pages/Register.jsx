import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

function getStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLOR = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const strength = getStrength(form.password);

  function validate() {
    if (form.password !== form.confirm) return 'Passwords do not match';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(form.password)) return 'Password must contain at least one uppercase letter';
    if (!/\d/.test(form.password)) return 'Password must contain at least one number';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const err = validate();
    if (err) { setError(err); return; }
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
            <div className="auth-feature"><div className="auth-feature-icon">💳</div><span>Create multiple accounts instantly</span></div>
            <div className="auth-feature"><div className="auth-feature-icon">↔️</div><span>Transfer, deposit and withdraw securely</span></div>
            <div className="auth-feature"><div className="auth-feature-icon">📊</div><span>Full transaction statement per account</span></div>
            <div className="auth-feature"><div className="auth-feature-icon">✅</div><span>Balance always conserved — guaranteed</span></div>
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
              required minLength={3} maxLength={50} autoFocus
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
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
            {form.password.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: i <= strength ? STRENGTH_COLOR[strength] : 'var(--gray-200)',
                      transition: 'background 0.2s'
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: '0.75rem', color: STRENGTH_COLOR[strength], fontWeight: 600 }}>
                  {STRENGTH_LABEL[strength]}
                  {strength < 3 && <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}> — add uppercase, numbers or symbols</span>}
                </div>
              </div>
            )}
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
              style={form.confirm.length > 0 ? {
                borderColor: form.confirm === form.password ? 'var(--green)' : 'var(--red)'
              } : {}}
            />
            {form.confirm.length > 0 && form.confirm !== form.password && (
              <div style={{ fontSize: '0.75rem', color: 'var(--red)', marginTop: '0.3rem' }}>Passwords do not match</div>
            )}
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
