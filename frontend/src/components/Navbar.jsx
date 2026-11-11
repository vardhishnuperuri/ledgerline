import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  function logout() {
    localStorage.clear();
    navigate('/login');
  }

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="navbar-logo">L</div>
        <span className="navbar-name">Ledger<span>Line</span></span>
      </Link>

      {username && (
        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>Dashboard</Link>
          {(role === 'ACCOUNT_HOLDER' || role === 'ADMIN') && (
            <Link to="/transfer" className={isActive('/transfer')}>Transactions</Link>
          )}
          {role === 'ADMIN' && (
            <Link to="/admin" className={isActive('/admin')}>Admin Panel</Link>
          )}
          {(role === 'ADMIN' || role === 'AUDITOR') && (
            <Link to="/audit" className={isActive('/audit')}>Audit Log</Link>
          )}
        </div>
      )}

      <div className="navbar-right">
        {username ? (
          <>
            <div className="navbar-user">
              <div className="navbar-avatar">{username[0].toUpperCase()}</div>
              <span className="navbar-username">{username}</span>
              <span className={`role-badge ${role}`}>
                {role === 'ACCOUNT_HOLDER' ? 'User' : role}
              </span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={logout} style={{ color: '#94a3b8' }}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm" style={{ color: '#94a3b8', textDecoration: 'none' }}>Sign in</Link>
            <Link to="/register" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>Get started</Link>
          </>
        )}
      </div>
    </nav>
  );
}
