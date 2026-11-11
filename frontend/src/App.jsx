import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transfer from './pages/Transfer';
import Statement from './pages/Statement';
import Audit from './pages/Audit';
import Users from './pages/Users';
import AdminPanel from './pages/AdminPanel';
import Navbar from './components/Navbar';
import './App.css';

function PrivateRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}

function AppLayout({ children, onLogout }) {
  return (
    <>
      <Navbar onLogout={onLogout} />
      <div className="page-container">{children}</div>
    </>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  const handleLogin = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setIsLoggedIn(false);
  }, []);

  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />
      <Route path="/register" element={isLoggedIn ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/" element={<PrivateRoute><AppLayout onLogout={handleLogout}><Dashboard /></AppLayout></PrivateRoute>} />
      <Route path="/transfer" element={<PrivateRoute><AppLayout onLogout={handleLogout}><Transfer /></AppLayout></PrivateRoute>} />
      <Route path="/statement/:accountId" element={<PrivateRoute><AppLayout onLogout={handleLogout}><Statement /></AppLayout></PrivateRoute>} />
      <Route path="/audit" element={<PrivateRoute><AppLayout onLogout={handleLogout}><Audit /></AppLayout></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute adminOnly><AppLayout onLogout={handleLogout}><Users /></AppLayout></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute adminOnly><AppLayout onLogout={handleLogout}><AdminPanel /></AppLayout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
