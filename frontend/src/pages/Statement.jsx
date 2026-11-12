import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

function Sparkline({ transactions, account }) {
  if (!transactions.length) return null;
  const points = [];
  let running = 0;
  [...transactions].reverse().forEach(tx => {
    const amt = parseFloat(tx.amount);
    if (tx.type === 'DEPOSIT') running += amt;
    else if (tx.type === 'WITHDRAWAL') running -= amt;
    else if (tx.type === 'TRANSFER') {
      running += tx.toAccountNumber === account?.accountNumber ? amt : -amt;
    }
    points.push(running);
  });
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const W = 300, H = 60, pad = 4;
  const xs = points.map((_, i) => pad + (i / Math.max(points.length - 1, 1)) * (W - pad * 2));
  const ys = points.map(v => H - pad - ((v - min) / range) * (H - pad * 2));
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const fill = `${d} L${xs[xs.length-1].toFixed(1)},${H} L${xs[0].toFixed(1)},${H} Z`;
  return (
    <div className="stat-card" style={{ gridColumn: 'span 2' }}>
      <div className="stat-label">Balance History</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 60, display: 'block', marginTop: 4 }}>
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fill} fill="url(#sg)" />
        <path d={d} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <div className="stat-sub" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>${min.toFixed(2)}</span><span>${max.toFixed(2)}</span>
      </div>
    </div>
  );
}

function StatementSkeleton() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="skeleton" style={{ height: 34, width: 80, borderRadius: 8 }} />
        <div>
          <div className="skeleton" style={{ height: 24, width: 200, marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 14, width: 140 }} />
        </div>
      </div>
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton-card">
            <div className="skeleton skeleton-text" style={{ width: '50%' }} />
            <div className="skeleton" style={{ height: 36, width: '60%', marginBottom: 8 }} />
            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
          </div>
        ))}
      </div>
      <div className="card">
        <div className="skeleton skeleton-title" />
        {[1,2,3,4,5].map(i => (
          <div key={i} className="skeleton-row">
            <div className="skeleton" style={{ height: 14, width: '15%' }} />
            <div className="skeleton" style={{ height: 14, width: '10%' }} />
            <div className="skeleton" style={{ height: 14, width: '12%' }} />
            <div className="skeleton" style={{ height: 14, flex: 1 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function exportCSV(transactions, accountNumber) {
  const headers = ['Date', 'Type', 'Amount', 'From', 'To', 'Description', 'Status'];
  const rows = transactions.map(tx => [
    new Date(tx.createdAt).toLocaleString(),
    tx.type,
    tx.amount,
    tx.fromAccountNumber || '',
    tx.toAccountNumber || '',
    tx.description || '',
    tx.status,
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `statement-${accountNumber}-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Statement() {
  const { accountId } = useParams();
  const [transactions, setTransactions] = useState([]);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get(`/accounts/${accountId}`),
      api.get(`/transactions/statement/${accountId}`)
    ]).then(([accRes, txRes]) => {
      setAccount(accRes.data);
      setTransactions(txRes.data);
    }).catch(() => setError('Failed to load statement'))
      .finally(() => setLoading(false));
  }, [accountId]);

  if (loading) return <StatementSkeleton />;

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
    if (tx.type === 'TRANSFER')
      return tx.toAccountNumber === account?.accountNumber ? 'amount-positive' : 'amount-negative';
    return 'amount-neutral';
  }

  function amountSign(tx) {
    if (tx.type === 'DEPOSIT') return '+';
    if (tx.type === 'WITHDRAWAL') return '-';
    if (tx.type === 'TRANSFER')
      return tx.toAccountNumber === account?.accountNumber ? '+' : '-';
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
          {transactions.length > 1 && <Sparkline transactions={transactions} account={account} />}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Transaction History</span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['ALL', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER'].map(f => (
              <button key={f} className={`btn btn-sm ${filter === f ? 'btn-dark' : 'btn-outline'}`}
                onClick={() => setFilter(f)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}>
                {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
            {transactions.length > 0 && (
              <button
                className="btn btn-sm btn-outline"
                onClick={() => exportCSV(transactions, account?.accountNumber || accountId)}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', marginLeft: '0.5rem' }}
              >
                ⬇ Export CSV
              </button>
            )}
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
