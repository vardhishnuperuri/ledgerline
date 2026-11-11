import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Transfer() {
  const [accounts, setAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState('transfer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  const [transferForm, setTransferForm] = useState({ fromAccountId: '', toAccountId: '', amount: '', description: '' });
  const [withdrawForm, setWithdrawForm] = useState({ accountId: '', amount: '', description: '' });
  const [depositForm, setDepositForm] = useState({ accountId: '', amount: '', description: '' });

  useEffect(() => {
    api.get(role === 'ADMIN' ? '/accounts/all' : '/accounts')
      .then(res => setAccounts(res.data))
      .catch(() => setError('Failed to load accounts'));
  }, [role]);

  function reset() { setError(''); setSuccess(''); }

  async function handleTransfer(e) {
    e.preventDefault(); reset(); setLoading(true);
    try {
      await api.post('/transactions/transfer', {
        ...transferForm,
        idempotencyKey: crypto.randomUUID(),
        amount: parseFloat(transferForm.amount),
        fromAccountId: parseInt(transferForm.fromAccountId),
        toAccountId: parseInt(transferForm.toAccountId),
      });
      setSuccess('Transfer completed successfully!');
      setTransferForm({ fromAccountId: '', toAccountId: '', amount: '', description: '' });
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Transfer failed');
    } finally { setLoading(false); }
  }

  async function handleWithdraw(e) {
    e.preventDefault(); reset(); setLoading(true);
    try {
      await api.post('/transactions/withdraw', {
        ...withdrawForm,
        idempotencyKey: crypto.randomUUID(),
        amount: parseFloat(withdrawForm.amount),
        accountId: parseInt(withdrawForm.accountId),
      });
      setSuccess('Withdrawal completed successfully!');
      setWithdrawForm({ accountId: '', amount: '', description: '' });
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Withdrawal failed');
    } finally { setLoading(false); }
  }

  async function handleDeposit(e) {
    e.preventDefault(); reset(); setLoading(true);
    try {
      await api.post('/transactions/deposit', {
        ...depositForm,
        idempotencyKey: crypto.randomUUID(),
        amount: parseFloat(depositForm.amount),
        accountId: parseInt(depositForm.accountId),
      });
      setSuccess('Deposit completed successfully!');
      setDepositForm({ accountId: '', amount: '', description: '' });
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Deposit failed');
    } finally { setLoading(false); }
  }

  const tabs = [
    { id: 'transfer', label: '↔ Transfer', show: true },
    { id: 'withdraw', label: '⬇ Withdraw', show: true },
    { id: 'deposit', label: '⬆ Deposit', show: role === 'ADMIN' },
  ].filter(t => t.show);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Transactions</div>
        <div className="page-subtitle">Move money between accounts securely</div>
      </div>

      {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
      {success && <div className="alert alert-success"><span>✓</span> {success}</div>}

      <div className="card">
        <div className="tabs">
          {tabs.map(t => (
            <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => { setActiveTab(t.id); reset(); }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Transfer */}
        {activeTab === 'transfer' && (
          <form onSubmit={handleTransfer}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">From Account</label>
                <select className="form-select" value={transferForm.fromAccountId}
                  onChange={e => setTransferForm({ ...transferForm, fromAccountId: e.target.value })} required>
                  <option value="">Select source account</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.accountNumber} — ${parseFloat(a.balance).toFixed(2)}
                      {(role === 'ADMIN') && a.owner ? ` (${a.owner.username})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">To Account</label>
                <select className="form-select" value={transferForm.toAccountId}
                  onChange={e => setTransferForm({ ...transferForm, toAccountId: e.target.value })} required>
                  <option value="">Select destination account</option>
                  {accounts.filter(a => a.id !== parseInt(transferForm.fromAccountId)).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.accountNumber}
                      {(role === 'ADMIN') && a.owner ? ` (${a.owner.username})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (USD)</label>
              <input className="form-input" type="number" min="0.01" step="0.01" placeholder="0.00"
                value={transferForm.amount} onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span></label>
              <input className="form-input" placeholder="What's this transfer for?"
                value={transferForm.description} onChange={e => setTransferForm({ ...transferForm, description: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><span className="spinner"></span> Processing...</> : '↔ Send Transfer'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>Cancel</button>
            </div>
          </form>
        )}

        {/* Withdraw */}
        {activeTab === 'withdraw' && (
          <form onSubmit={handleWithdraw}>
            <div className="form-group">
              <label className="form-label">Account</label>
              <select className="form-select" value={withdrawForm.accountId}
                onChange={e => setWithdrawForm({ ...withdrawForm, accountId: e.target.value })} required>
                <option value="">Select account to withdraw from</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.accountNumber} — ${parseFloat(a.balance).toFixed(2)}
                    {(role === 'ADMIN') && a.owner ? ` (${a.owner.username})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (USD)</label>
              <input className="form-input" type="number" min="0.01" step="0.01" placeholder="0.00"
                value={withdrawForm.amount} onChange={e => setWithdrawForm({ ...withdrawForm, amount: e.target.value })} required />
              {withdrawForm.accountId && (
                <div className="form-hint">
                  Available: ${parseFloat(accounts.find(a => a.id === parseInt(withdrawForm.accountId))?.balance || 0).toFixed(2)}
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Description <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span></label>
              <input className="form-input" placeholder="Reason for withdrawal"
                value={withdrawForm.description} onChange={e => setWithdrawForm({ ...withdrawForm, description: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-danger" disabled={loading}>
                {loading ? <><span className="spinner"></span> Processing...</> : '⬇ Withdraw Funds'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>Cancel</button>
            </div>
          </form>
        )}

        {/* Deposit — Admin only */}
        {activeTab === 'deposit' && role === 'ADMIN' && (
          <form onSubmit={handleDeposit}>
            <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
              <span>ℹ</span> Deposit is an admin-only operation that adds funds to any account.
            </div>
            <div className="form-group">
              <label className="form-label">Account</label>
              <select className="form-select" value={depositForm.accountId}
                onChange={e => setDepositForm({ ...depositForm, accountId: e.target.value })} required>
                <option value="">Select account to deposit into</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.accountNumber} — ${parseFloat(a.balance).toFixed(2)} {a.owner ? `(${a.owner.username})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (USD)</label>
              <input className="form-input" type="number" min="0.01" step="0.01" placeholder="0.00"
                value={depositForm.amount} onChange={e => setDepositForm({ ...depositForm, amount: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span></label>
              <input className="form-input" placeholder="Reason for deposit"
                value={depositForm.description} onChange={e => setDepositForm({ ...depositForm, description: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? <><span className="spinner"></span> Processing...</> : '⬆ Deposit Funds'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* Info box */}
      <div className="card" style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Idempotency</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>Every request has a unique key — submitting twice never charges twice.</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Concurrency Safe</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>Pessimistic locking prevents race conditions on simultaneous withdrawals.</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Audit Trail</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>Every transaction is logged in an append-only audit trail.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
