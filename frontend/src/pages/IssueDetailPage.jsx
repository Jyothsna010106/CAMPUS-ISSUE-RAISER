import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';

export default function IssueDetailPage() {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    API.get(`/issues/${id}`)
      .then((res) => {
        setIssue(res.data.issue);
        setComments(res.data.comments);
      })
      .catch(console.error);
  }, [id]);

  const upvote = () => {
    API.post(`/issues/${id}/upvote`).then((res) => setIssue(res.data)).catch(console.error);
  };

  const addComment = (e) => {
    e.preventDefault();
    API.post('/comments', { issueId: id, text })
      .then((res) => {
        setComments((p) => [...p, res.data]);
        setText('');
      })
      .catch(console.error);
  };

  if (!issue) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      <header className="topbar">
        <h1>{issue.title}</h1>
        <Link className="btn" to="/issues">Back</Link>
      </header>
      <div className="card">
        <p>{issue.description}</p>
        <p>Category: {issue.category}</p>
        <p>Status: {issue.status}</p>
        <p>Posted by: {issue.anonymous ? 'Anonymous' : issue.createdBy?.name || 'Unknown'}</p>
        <p>Upvotes: {issue.upvotes}</p>
        <button className="btn" onClick={upvote}>Upvote</button>
      </div>

      <div className="card">
        <h3>Comments</h3>
        <ul className="list">
          {comments.map((c) => (
            <li key={c._id}><strong>{c.userId?.name || 'Unknown'}:</strong> {c.text}</li>
          ))}
        </ul>
        <form onSubmit={addComment}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment" required />
          <button type="submit" className="btn">Post</button>
        </form>
      </div>
    </div>
  );
}
