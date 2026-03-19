import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/auth';
import { useAuth } from '../context/useAuth';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await register(form);
      setSession(res.data.token);
      navigate('/home');
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card auth-card-rich">
        <div className="auth-side">
          <h1>Create Account</h1>
          <p>Join a transparent and action-focused campus issue platform.</p>
          <ul>
            <li>Quick issue submission with image support</li>
            <li>Anonymous mode for personal safety</li>
            <li>Insights to see which departments improve faster</li>
          </ul>
        </div>
        <div className="auth-form-wrap">
          <h2>Get started</h2>
          <p className="hint">Takes less than a minute.</p>
        <form onSubmit={handleSubmit}>
          <label>Full name</label>
          <input type="text" placeholder="Full name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <label>Email</label>
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
          <label>Password</label>
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
          {error && <small className="error">{error}</small>}
          <button className="btn" type="submit">Create account</button>
        </form>
        <div className="form-footer">
          Already have an account? <Link className="link-muted" to="/login">Sign in</Link>
        </div>
        </div>
      </div>
    </div>
  );
}
