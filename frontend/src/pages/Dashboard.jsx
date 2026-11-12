import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const STATUS_BADGE = {
  ACTIVE: { label: 'Active', color: '#16a34a', bg: '#dcfce7' },
  PENDING: { label: 'Pending Review', color: '#d97706', bg: '#fef3c7' },
  REJECTED: { label: 'Rejected', color: '#dc2626', bg: '#fee2e2' },
};

function DashboardSkeleton() {
  return (
    <div>
      <div className="skeleton-card" style={{ marginBottom: '1.5rem', background: 'var(--navy)', border: 'none', borderRadius: '24px', padding: '2rem 2.5rem' }}>
        <div className="skeleton" style={{ height: 28, width: '30%', marginBottom: 8, opacity: 0.3 }} />
        <div className="skeleton" style={{ height: 16, width: '20%', opacity: 0.2 }} />
      </div>
      <div className="stats-grid">
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton-card">
            <div className="skeleton skeleton-text" style={{ width: '50%' }} />
            <div className="skeleton" style={{ height: 36, width: '60%', marginBottom: 8 }} />
            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
          </div>
        ))}
      </div>
      <div className="skeleton-card">
        <div className="skeleton skeleton-title" />
        <div className="accounts-grid">
          {[1,2].map(i => (
            <div key={i} style={{ background: 'var(--gray-100)', borderRadius: '16px', padding: '1.5rem', height: 160 }}>
              <div className="skeleton" style={{ height: 26, width: 36, marginBottom: 20 }} />
              <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 32, width: '50%' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [accountType, setAccountType] = useState('PERSONAL');
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');

  useEffect(() => { loadAccounts(); }, [role]);

  async function loadAccounts() {
    try {
      const endpoint = role === 'ADMIN' || role === 'AUDITOR' ? '/accounts/all' : '/accounts';
      const res = await api.get(endpoint);
      setAccounts(res.data);
    } catch {
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }

  async function requestAccount(e) {
    e.preventDefault();
    setRequesting(true);
    setError('');
    try {
      await api.post('/accounts/request', { accountType });
      setShowRequestForm(false);
      await loadAccounts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setRequesting(false);
    }
  }

  const activeAccounts = accounts.filter(a => a.status === 'ACTIVE');
  const totalBalance = activeAccounts.reduce((sum, a) => sum + parseFloat(a.balance), 0);
  const pendingCount = accounts.filter(a => a.status === 'PENDING').length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div>
      <div className="welcome-banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="welcome-title">{greeting()}, {username} 👋</div>
          <div className="welcome-sub">
            {role === 'ADMIN' && 'Administrator — full system access'}
            {role === 'AUDITOR' && 'Auditor — read-only access to all accounts and logs'}
            {role === 'ACCOUNT_HOLDER' && `${activeAccounts.length} active account${activeAccounts.length !== 1 ? 's' : ''}`}
          </div>
          <div className="welcome-actions">
            {(role === 'ACCOUNT_HOLDER' || role === 'ADMIN') && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowRequestForm(!showRequestForm)}>
                {showRequestForm ? '✕ Cancel' : '+ Request Account'}
              </button>
            )}
            {role === 'ADMIN' && (
              <Link to="/admin" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}>
                Admin Panel →
              </Link>
            )}
            <Link to="/transfer" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}>
              Make a Transfer →
            </Link>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

      {showRequestForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header"><span className="card-title">Request a New Account</span></div>
          <form onSubmit={requestAccount} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 200 }}>
              <label className="form-label">Account Type</label>
              <select className="form-select" value={accountType} onChange={e => setAccountType(e.target.value)}>
                <option value="PERSONAL">Personal</option>
                <option value="BUSINESS">Business</option>
                <option value="SAVINGS">Savings</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={requesting}>
              {requesting ? <><span className="spinner"></span> Submitting...</> : 'Submit Request'}
            </button>
          </form>
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
            Your request will be reviewed by an administrator.
          </p>
        </div>
      )}

      {role !== 'AUDITOR' && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Balance</div>
            <div className="stat-value">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="stat-sub">across {activeAccounts.length} active account{activeAccounts.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Accounts</div>
            <div className="stat-value">{activeAccounts.length}</div>
            <div className="stat-sub">{role === 'ADMIN' ? 'total in system' : 'approved accounts'}</div>
          </div>
          {pendingCount > 0 && (
            <div className="stat-card">
              <div className="stat-label">Pending</div>
              <div className="stat-value" style={{ color: '#d97706' }}>{pendingCount}</div>
              <div className="stat-sub">awaiting approval</div>
            </div>
          )}
          <div className="stat-card">
            <div className="stat-label">Role</div>
            <div className="stat-value" style={{ fontSize: '1.1rem', textTransform: 'capitalize' }}>
              {role === 'ACCOUNT_HOLDER' ? 'Account Holder' : role}
            </div>
            <div className="stat-sub">access level</div>
          </div>
        </div>
      )}

      {(role === 'ACCOUNT_HOLDER' || role === 'ADMIN') && (
        <div className="quick-actions">
          <Link to="/transfer" className="quick-action">
            <div className="quick-action-icon" style={{ background: '#eff6ff' }}>↔️</div>
            <span className="quick-action-label">Transfer</span>
          </Link>
          <Link to="/transfer" className="quick-action">
            <div className="quick-action-icon" style={{ background: '#ecfdf5' }}>⬇️</div>
            <span className="quick-action-label">Withdraw</span>
          </Link>
          {role === 'ADMIN' && (
            <Link to="/audit" className="quick-action">
              <div className="quick-action-icon" style={{ background: '#fffbeb' }}>📋</div>
              <span className="quick-action-label">Audit Log</span>
            </Link>
          )}
          {role === 'ADMIN' && (
            <Link to="/admin" className="quick-action">
              <div className="quick-action-icon" style={{ background: '#fdf4ff' }}>⚙️</div>
              <span className="quick-action-label">Admin Panel</span>
            </Link>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {role === 'ADMIN' || role === 'AUDITOR' ? 'All Accounts' : 'My Accounts'}
          </span>
        </div>

        {accounts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💳</div>
            <div className="empty-state-text">No accounts yet. Request your first account to get started.</div>
            {role === 'ACCOUNT_HOLDER' && (
              <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}
                onClick={() => setShowRequestForm(true)}>
                Request Account
              </button>
            )}
          </div>
        ) : (
          <div className="accounts-grid">
            {accounts.map(acc => {
              const badge = STATUS_BADGE[acc.status] || STATUS_BADGE.ACTIVE;
              return (
                <div key={acc.id} className="account-card"
                  onClick={() => acc.status === 'ACTIVE' && navigate(`/statement/${acc.id}`)}
                  style={{ cursor: acc.status === 'ACTIVE' ? 'pointer' : 'default', opacity: acc.status === 'REJECTED' ? 0.6 : 1 }}>
                  <div className="account-card-chip"></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="account-card-number">{acc.accountNumber}</div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                      background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="account-card-balance">
                    ${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="account-card-footer">
                    <div>
                      <div className="account-card-label">Type</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{acc.accountType}</div>
                    </div>
                    <div>
                      <div className="account-card-label">Currency</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{acc.currency}</div>
                    </div>
                    {(role === 'ADMIN' || role === 'AUDITOR') && acc.owner && (
                      <div style={{ textAlign: 'right' }}>
                        <div className="account-card-label">Owner</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{acc.owner.username}</div>
                      </div>
                    )}
                    {acc.status === 'ACTIVE' && (
                      <div style={{ textAlign: 'right' }}>
                        <div className="account-card-label">View</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Statement →</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
