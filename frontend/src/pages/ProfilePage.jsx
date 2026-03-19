import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import API from '../services/api';
import { useAuth } from '../context/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [interactionsByIssue, setInteractionsByIssue] = useState({});
  const [evidenceByIssue, setEvidenceByIssue] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const issuesRes = await API.get('/issues');
        const allIssues = issuesRes.data || [];
        setIssues(allIssues);

        const details = await Promise.all(
          allIssues.map(async (issue) => {
            const [interactionsRes, evidenceRes] = await Promise.all([
              API.get(`/interactions/${issue._id}`),
              API.get(`/evidence/${issue._id}`),
            ]);

            return {
              issueId: issue._id,
              interactions: interactionsRes.data || [],
              evidence: evidenceRes.data || [],
            };
          })
        );

        const nextInteractions = {};
        const nextEvidence = {};
        details.forEach((item) => {
          nextInteractions[item.issueId] = item.interactions;
          nextEvidence[item.issueId] = item.evidence;
        });

        setInteractionsByIssue(nextInteractions);
        setEvidenceByIssue(nextEvidence);
      } catch {
        setIssues([]);
      }
    };

    load();
  }, []);

  const defaultStats = {
    created: 0,
    createdResolved: 0,
    assignedToMe: 0,
    supports: 0,
    comments: 0,
    evidenceUploads: 0,
  };

  let stats = defaultStats;
  if (user?._id) {
    const created = issues.filter((item) => item.createdBy === user._id);
    const assignedToMe = issues.filter((item) => item.assignedTo === user._id).length;

    let supports = 0;
    let comments = 0;
    let evidenceUploads = 0;

    Object.values(interactionsByIssue).forEach((records) => {
      records.forEach((record) => {
        if (record.userId === user._id && record.type === 'support') supports += 1;
        if (record.userId === user._id && record.type === 'comment') comments += 1;
      });
    });

    Object.values(evidenceByIssue).forEach((records) => {
      records.forEach((record) => {
        if (record.userId === user._id) evidenceUploads += 1;
      });
    });

    stats = {
      created: created.length,
      createdResolved: created.filter((item) => item.status === 'Resolved').length,
      assignedToMe,
      supports,
      comments,
      evidenceUploads,
    };
  }

  const myRecentIssues = user?._id
    ? issues
      .filter((item) => item.createdBy === user._id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
    : [];

  return (
    <AppLayout title="Profile Dashboard">
      <div className="panel profile-card">
        <div className="profile-top">
          <div className="profile-avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</div>
          <div>
            <h3>{user?.name || 'User'}</h3>
            <p>{user?.email}</p>
            <p className="hint">{user?.role} · {user?.department}</p>
          </div>
        </div>
      </div>

      <div className="grid three">
        <div className="panel stat"><span>Issues Raised</span><strong>{stats.created}</strong></div>
        <div className="panel stat"><span>Resolved Raised</span><strong>{stats.createdResolved}</strong></div>
        <div className="panel stat"><span>Assigned To Me</span><strong>{stats.assignedToMe}</strong></div>
        <div className="panel stat"><span>Supports Given</span><strong>{stats.supports}</strong></div>
        <div className="panel stat"><span>Comments Posted</span><strong>{stats.comments}</strong></div>
        <div className="panel stat"><span>Evidence Uploaded</span><strong>{stats.evidenceUploads}</strong></div>
      </div>

      <div className="panel">
        <div className="actions-row">
          <h3>My Recent Issues</h3>
          <Link className="btn btn-light" to="/issues/new">Raise New Issue</Link>
        </div>
        {!myRecentIssues.length && <p className="hint">No issues raised yet.</p>}
        {myRecentIssues.map((issue) => (
          <div key={issue._id} className="section-row">
            <div>
              <strong>{issue.title}</strong>
              <p className="hint">{new Date(issue.createdAt).toLocaleDateString()}</p>
            </div>
            <span className={`status-pill ${issue.status.toLowerCase().replace(/\s+/g, '-')}`}>{issue.status}</span>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
