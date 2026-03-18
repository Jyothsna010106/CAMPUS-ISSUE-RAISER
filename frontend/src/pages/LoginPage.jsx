import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/auth';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login(form);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid credentials');
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p>Login to continue to Campus Issue & Transparency System</p>
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" placeholder="Enter your email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
          <label>Password</label>
          <input type="password" placeholder="Enter your password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
          {error && <small className="error">{error}</small>}
          <button className="btn" type="submit">Sign in</button>
        </form>
        <div className="form-footer">
          New to platform? <Link className="link-muted" to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
