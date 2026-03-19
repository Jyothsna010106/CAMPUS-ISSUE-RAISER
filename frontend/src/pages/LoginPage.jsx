import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/auth';
import { useAuth } from '../context/useAuth';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login(form);
      setSession(res.data.token);
      if (res?.data?.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid credentials');
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card auth-card-rich">
        <div className="auth-side">
          <h1>Campus Issue System</h1>
          <p>Raise, track, and resolve campus issues with clarity and safety.</p>
          <ul>
            <li>Anonymous reporting for sensitive concerns</li>
            <li>Real progress tracking with accountability</li>
            <li>Tag authorities and get notified automatically</li>
          </ul>
        </div>
        <div className="auth-form-wrap">
          <h2>Welcome back</h2>
          <p className="hint">Sign in to continue improving your campus.</p>
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" placeholder="Enter your email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
          <label>Password</label>
          <input type="password" placeholder="Enter your password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
          {error && <small className="error">{error}</small>}
          <button className="btn" type="submit">Sign in</button>
        </form>
        <div className="form-footer">
          New user? <Link className="link-muted" to="/register">Create account</Link>
        </div>
        </div>
      </div>
    </div>
  );
}
