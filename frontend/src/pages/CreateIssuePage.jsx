import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

export default function CreateIssuePage() {
  const [form, setForm] = useState({ title: '', description: '', category: 'academics', collegeId: '', groupId: '', taggedAuthority: '', anonymous: false });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/issues', form);
      navigate('/issues');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create issue');
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <h1>Create Issue</h1>
        <Link className="btn" to="/issues">Back</Link>
      </header>

      <form className="card" onSubmit={submit}>
        <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" required />
        <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" required />
        <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
          <option value="academics">Academics</option>
          <option value="hostel">Hostel</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="transport">Transport</option>
          <option value="administration">Administration</option>
          <option value="other">Other</option>
        </select>
        <label>College Code</label>
        <input value={form.collegeId} onChange={(e) => setForm((p) => ({ ...p, collegeId: e.target.value }))} placeholder="College ID (unique code)" required />
        <label>Department</label>
        <input value={form.groupId} onChange={(e) => setForm((p) => ({ ...p, groupId: e.target.value }))} placeholder="Group ID (CSE/Medical/Allied etc)" required />
        <label>Tag authority</label>
        <input value={form.taggedAuthority} onChange={(e) => setForm((p) => ({ ...p, taggedAuthority: e.target.value }))} placeholder="Tagged Authority ID (optional)" />
        <div style={{margin:'10px 0'}}>
          <input type="checkbox" checked={form.anonymous} onChange={(e) => setForm((p) => ({ ...p, anonymous: e.target.checked }))} id="anon" />
          <label htmlFor="anon" style={{marginLeft:'8px'}}>Post anonymously</label>
        </div>
        {error && <small className="error">{error}</small>}
        <button className="btn" type="submit">Submit</button>
      </form>
    </div>
  );
}
