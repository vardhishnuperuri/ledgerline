import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Statement() {
  const { accountId } = useParams();
  const [transactions, setTransactions] = useState([]);
  const [account, setAccount] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  useEffect(() => {
    api.get(`/accounts/${accountId}`)
      .then(res => setAccount(res.data))
      .catch(() => {});
    api.get(`/transactions/statement/${accountId}`)
      .then(res => setTransactions(res.data))
      .catch(() => setError('Failed to load statement'));
  }, [accountId]);

  const filtered = filter === 'ALL' ? transactions : transactions.filter(t => t.type === filter);

  const totalIn = transactions
    .filter(t => t.type === 'DEPOSIT' || (t.type === 'TRANSFER' && t.toAccountNumber === account?.accountNumber))
    .reduce((s, t) => s + parseFloat(t.amount), 0);

  const totalOut = transactions
    .filter(t => t.type === 'WITHDRAWAL' || (t.type === 'TRANSFER' && t.fromAccountNumber === account?.accountNumber))
    .reduce((s, t) => s + parseFloat(t.amount), 0);

  function amountClass(tx) {
    if (tx.type === 'DEPOSIT') return 'amount-positive';
    if (tx.type === 'WITHDRAWAL') return 'amount-negative';
    if (tx.type === 'TRANSFER') {
      return tx.toAccountNumber === account?.accountNumber ? 'amount-positive' : 'amount-negative';
    }
    return 'amount-neutral';
  }

  function amountSign(tx) {
    if (tx.type === 'DEPOSIT') return '+';
    if (tx.type === 'WITHDRAWAL') return '-';
    if (tx.type === 'TRANSFER') {
      return tx.toAccountNumber === account?.accountNumber ? '+' : '-';
    }
    return '';
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/')}>← Back</button>
        <div>
          <div className="page-title">Account Statement</div>
          {account && <div className="page-subtitle">{account.accountNumber}</div>}
        </div>
      </div>

      {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

      {/* Account Summary */}
      {account && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-label">Current Balance</div>
            <div className="stat-value">${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="stat-sub">{account.currency}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total In</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>+${totalIn.toFixed(2)}</div>
            <div className="stat-sub">deposits & received</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Out</div>
            <div className="stat-value" style={{ color: 'var(--red)' }}>-${totalOut.toFixed(2)}</div>
            <div className="stat-sub">withdrawals & sent</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Transactions</div>
            <div className="stat-value">{transactions.length}</div>
            <div className="stat-sub">total records</div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Transaction History</span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['ALL', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER'].map(f => (
              <button key={f} className={`btn btn-sm ${filter === f ? 'btn-dark' : 'btn-outline'}`}
                onClick={() => setFilter(f)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}>
                {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-text">
              {transactions.length === 0 ? 'No transactions yet on this account.' : `No ${filter.toLowerCase()} transactions.`}
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--gray-500)', fontSize: '0.82rem' }}>
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${tx.type}`}>{tx.type}</span>
                    </td>
                    <td className={amountClass(tx)} style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {amountSign(tx)}${parseFloat(tx.amount).toFixed(2)}
                    </td>
                    <td style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--gray-500)' }}>
                      {tx.fromAccountNumber || '—'}
                    </td>
                    <td style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--gray-500)' }}>
                      {tx.toAccountNumber || '—'}
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>{tx.description || '—'}</td>
                    <td><span className="badge badge-green">{tx.status}</span></td>
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
