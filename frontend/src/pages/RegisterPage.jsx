import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/auth';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', collegeCode: '', groupId: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await register(form);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p>Register with your college code and start tracking issues in your community.</p>
        <form onSubmit={handleSubmit}>
          <label>Full name</label>
          <input type="text" placeholder="Full name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <label>Email</label>
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
          <label>Password</label>
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
          <label>College Code</label>
          <input type="text" placeholder="College code" value={form.collegeCode} onChange={(e) => setForm((p) => ({ ...p, collegeCode: e.target.value }))} required />
          <label>Group ID (optional)</label>
          <input type="text" placeholder="Group id (optional)" value={form.groupId} onChange={(e) => setForm((p) => ({ ...p, groupId: e.target.value }))} />
          {error && <small className="error">{error}</small>}
          <button className="btn" type="submit">Create account</button>
        </form>
        <div className="form-footer">
          Already have an account? <Link className="link-muted" to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
