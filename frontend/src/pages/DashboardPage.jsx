import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    API.get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => navigate('/login'));

    API.get('/issues?sortBy=createdAt')
      .then((res) => setIssues(res.data))
      .catch(console.error);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="page">
      <header className="topbar">
        <h1>Welcome{user ? `, ${user.name}` : ''}</h1>
        <div>
          <button className="btn" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="actions">
        <Link className="btn" to="/issues">View Issues</Link>
        <Link className="btn" to="/issues/new">Raise Issue</Link>
      </div>

      <section className="card">
        <h2>Quick Stats</h2>
        <p>College: <strong>{user?.collegeId ? user.collegeId.name : 'N/A'}</strong></p>
        <p>Dept/Group: <strong>{user?.groupId ? user.groupId.name : 'N/A'}</strong></p>
        <p>Open issues: <strong>{issues.filter((i) => i.status === 'Open').length}</strong></p>
        <p>In progress: <strong>{issues.filter((i) => i.status === 'In Progress').length}</strong></p>
        <p>Resolved: <strong>{issues.filter((i) => i.status === 'Resolved').length}</strong></p>
      </section>

      <section className="card">
        <h2>Recent Activity</h2>
        {issues.length === 0 ? (
          <p>No issues yet.</p>
        ) : (
          <ul className="list">
            {issues.slice(0, 5).map((issue) => (
              <li key={issue._id}>
                <strong>{issue.title}</strong> <br />
                <small>{issue.category} • {issue.status} • {issue.groupId?.name || 'N/A'}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
