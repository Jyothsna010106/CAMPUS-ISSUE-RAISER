import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

export default function IssuesPage() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    API.get('/issues?sortBy=mostUpvoted')
      .then((res) => setIssues(res.data))
      .catch(console.error);
  }, []);

  return (
    <div className="page">
      <header className="topbar">
        <h1>Issues</h1>
        <div>
          <Link className="btn btn-outline" to="/dashboard">Dashboard</Link>
          <Link className="btn" to="/issues/new" style={{marginLeft:'8px'}}>New Issue</Link>
        </div>
      </header>
      <div className="issue-grid">
        {issues.map((issue) => (
          <div key={issue._id} className="issue-card">
            <h3><Link to={`/issues/${issue._id}`}>{issue.title}</Link></h3>
            <p>{issue.description.slice(0, 100)}...</p>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span className={`badge ${issue.status==='Open' ? 'badge-open' : issue.status==='In Progress' ? 'badge-inprogress':'badge-resolved'}`}>{issue.status}</span>
              <span style={{fontSize:'13px', color:'#334155'}}>⬆ {issue.upvotes}</span>
            </div>
            <small>Dept: {issue.groupId?.name || 'N/A'} | College: {issue.collegeId?.name || 'N/A'}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
