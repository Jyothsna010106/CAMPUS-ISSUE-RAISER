import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import API from '../services/api';
import { useAuth } from '../context/useAuth';

const statuses = ['Open', 'Seen', 'In Progress', 'Resolved', 'Escalated'];

export default function IssueDetailPage() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const [issue, setIssue] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [directoryUsers, setDirectoryUsers] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [evidenceText, setEvidenceText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [nextStatus, setNextStatus] = useState('Seen');
  const [error, setError] = useState('');
  const isAdmin = me?.role === 'admin';

  const refresh = useCallback(() => {
    Promise.all([
      API.get(`/issues/${id}`),
      API.get(`/interactions/${id}`),
      API.get(`/evidence/${id}`),
      API.get('/users/directory'),
    ])
      .then(([issueRes, interactionsRes, evidenceRes, directoryRes]) => {
        setIssue(issueRes.data);
        setInteractions(interactionsRes.data);
        setEvidence(evidenceRes.data);
        setDirectoryUsers(directoryRes.data);
      })
      .catch(() => setError('Unable to load issue detail'));
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const comments = useMemo(() => interactions.filter((item) => item.type === 'comment'), [interactions]);
  const directoryNameMap = useMemo(
    () => directoryUsers.reduce((acc, user) => ({ ...acc, [user._id]: user.name }), {}),
    [directoryUsers]
  );

  const supportIssue = async () => {
    setError('');
    try {
      await API.post('/interactions/support', { issueId: id });
      refresh();
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to support issue');
    }
  };

  const addComment = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await API.post('/interactions/comment', { issueId: id, content: commentText });
      setCommentText('');
      refresh();
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to add comment');
    }
  };

  const addEvidence = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await API.post('/evidence', { issueId: id, text: evidenceText, fileUrl });
      setEvidenceText('');
      setFileUrl('');
      refresh();
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to add evidence');
    }
  };

  const escalateIssue = async () => {
    setError('');
    try {
      const result = await API.put(`/issues/${id}/escalate`);
      setIssue(result.data);
      refresh();
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to escalate');
    }
  };

  const updateStatus = async () => {
    setError('');
    try {
      const result = await API.put(`/issues/${id}/status`, { status: nextStatus });
      setIssue(result.data);
      refresh();
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to update status');
    }
  };

  if (!issue) {
    return <AppLayout title="Issue Detail"><div className="panel">Loading issue...</div></AppLayout>;
  }

  return (
    <AppLayout title="Issue Detail">
      <div className="panel">
        <h3>{issue.title}</h3>
        <p className="hint">
          By {issue.isAnonymous && issue.createdBy !== me?._id && me?.role !== 'admin'
            ? 'Anonymous Reporter'
            : (directoryNameMap[issue.createdBy] || 'Unknown Reporter')}
        </p>
        <p>{issue.description}</p>
        {issue.imageUrl && <img src={issue.imageUrl} alt={issue.title} className="issue-image" />}
        <div className="meta-row"><span>Status: {issue.status}</span><span>Support: {issue.supportCount}</span></div>
        <div className="meta-row"><span>Escalation Level: {issue.escalationLevel}</span><span>Assigned Authority: {issue.assignedTo || 'Unassigned'}</span></div>
        <p>Tags: {issue.tags?.length ? issue.tags.join(', ') : 'None'}</p>
        <p>Tagged Authorities: {issue.taggedAuthorityIds?.length ? issue.taggedAuthorityIds.join(', ') : 'None'}</p>
        <div className="actions-row">
          <button className="btn" onClick={supportIssue}>Support Issue</button>
          <button className="btn btn-light" onClick={escalateIssue}>Escalate</button>
          <Link className="btn btn-light" to="/home">Back</Link>
        </div>
      </div>

      <div className="panel">
        <h3>Admin Status Control</h3>
        {isAdmin ? (
          <>
            <p>Only admin can update issue status.</p>
            <div className="actions-row">
              <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <button className="btn" onClick={updateStatus}>Update Status</button>
            </div>
          </>
        ) : (
          <p className="hint">Read-only status view. Admin updates only.</p>
        )}
        {me && <p className="hint">Logged in as: {me.name} ({me.role})</p>}
      </div>

      <div className="grid two">
        <form className="panel" onSubmit={addComment}>
          <h3>Add Comment</h3>
          <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} required />
          <button className="btn" type="submit">Post Comment</button>
        </form>

        <form className="panel" onSubmit={addEvidence}>
          <h3>Add Evidence</h3>
          <textarea value={evidenceText} onChange={(event) => setEvidenceText(event.target.value)} placeholder="Evidence description" />
          <input value={fileUrl} onChange={(event) => setFileUrl(event.target.value)} placeholder="File URL (optional)" />
          <button className="btn" type="submit">Submit Evidence</button>
        </form>
      </div>

      <div className="grid two">
        <div className="panel">
          <h3>Comments</h3>
          {comments.map((item) => (
            <div key={item._id} className="list-row"><strong>{directoryNameMap[item.userId] || item.userId}</strong><p>{item.content}</p></div>
          ))}
          {!comments.length && <p>No comments yet.</p>}
        </div>

        <div className="panel">
          <h3>Evidence</h3>
          {evidence.map((item) => (
            <div key={item._id} className="list-row">
              <strong>{directoryNameMap[item.userId] || item.userId}</strong>
              {item.text && <p>{item.text}</p>}
              {item.fileUrl && <a href={item.fileUrl} target="_blank" rel="noreferrer">Open File</a>}
            </div>
          ))}
          {!evidence.length && <p>No evidence submitted.</p>}
        </div>
      </div>

      {error && <div className="panel error-block">{error}</div>}
    </AppLayout>
  );
}
