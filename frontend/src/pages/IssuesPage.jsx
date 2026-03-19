import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import API from '../services/api';
import { useAuth } from '../context/useAuth';

const tabs = ['Trending', 'Latest', 'Pending', 'Resolved'];
const unresolved = ['Open', 'Seen', 'In Progress', 'Escalated'];

const daysSince = (value) => Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24)));

const getPressure = (issue) => {
  const score = (issue.supportCount || 0) * 2 + (issue.escalationLevel || 1) * 3 + daysSince(issue.createdAt);
  if (score >= 14) return { label: 'Critical', score };
  if (score >= 10) return { label: 'High', score };
  if (score >= 6) return { label: 'Medium', score };
  return { label: 'Low', score };
};

export default function IssuesPage() {
  const { user: me } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [issues, setIssues] = useState([]);
  const [sections, setSections] = useState([]);
  const [taggableUsers, setTaggableUsers] = useState([]);
  const [directoryUsers, setDirectoryUsers] = useState([]);
  const [interactionsByIssue, setInteractionsByIssue] = useState({});
  const [evidenceByIssue, setEvidenceByIssue] = useState({});
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'Latest');
  const activeSectionName = searchParams.get('section') || 'Home';
  const [activeTag, setActiveTag] = useState(searchParams.get('tag') || '');
  const [openCommentFor, setOpenCommentFor] = useState('');
  const [openEvidenceFor, setOpenEvidenceFor] = useState('');
  const [openMenuFor, setOpenMenuFor] = useState('');
  const [commentInput, setCommentInput] = useState({});
  const [evidenceInput, setEvidenceInput] = useState({});
  const [error, setError] = useState('');

  const sectionNameMap = useMemo(() => sections.reduce((acc, section) => ({ ...acc, [section._id]: section.name }), {}), [sections]);
  const userNameMap = useMemo(
    () => taggableUsers.reduce((acc, user) => ({ ...acc, [user._id]: `${user.name} (${user.role})` }), {}),
    [taggableUsers]
  );
  const directoryNameMap = useMemo(
    () => directoryUsers.reduce((acc, user) => ({ ...acc, [user._id]: user.name }), {}),
    [directoryUsers]
  );

  const loadFeed = async () => {
    const [issuesRes, sectionsRes, taggableRes, directoryRes] = await Promise.all([
      API.get('/issues'),
      API.get('/sections'),
      API.get('/users/taggable'),
      API.get('/users/directory'),
    ]);

    const issueList = issuesRes.data;
    setIssues(issueList);
    setSections(sectionsRes.data);
    setTaggableUsers(taggableRes.data);
    setDirectoryUsers(directoryRes.data);

    const details = await Promise.all(issueList.map(async (issue) => {
      const [interactionsRes, evidenceRes] = await Promise.all([
        API.get(`/interactions/${issue._id}`),
        API.get(`/evidence/${issue._id}`),
      ]);

      return {
        issueId: issue._id,
        interactions: interactionsRes.data,
        evidence: evidenceRes.data,
      };
    }));

    const interactionMap = {};
    const evidenceMap = {};

    details.forEach((item) => {
      interactionMap[item.issueId] = item.interactions;
      evidenceMap[item.issueId] = item.evidence;
    });

    setInteractionsByIssue(interactionMap);
    setEvidenceByIssue(evidenceMap);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await loadFeed();
      } catch {
        setError('Unable to load feed');
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    const next = {};
    if (search.trim()) next.q = search.trim();
    if (activeTab !== 'Latest') next.tab = activeTab;
    if (activeSectionName !== 'Home') next.section = activeSectionName;
    if (activeTag.trim()) next.tag = activeTag.trim();
    setSearchParams(next);
  }, [search, activeTab, activeSectionName, activeTag, setSearchParams]);

  const trendingTags = useMemo(() => {
    const tagScores = {};
    issues.forEach((issue) => {
      issue.tags.forEach((tag) => {
        tagScores[tag] = (tagScores[tag] || 0) + (issue.supportCount || 0) + 1;
      });
    });

    return Object.entries(tagScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [issues]);

  const highPressureIssues = useMemo(() => {
    return [...issues]
      .map((issue) => ({ issue, pressure: getPressure(issue) }))
      .sort((a, b) => b.pressure.score - a.pressure.score)
      .slice(0, 5);
  }, [issues]);

  const storyCards = useMemo(() => {
    const cards = [];
    const used = new Set();

    const addCard = (issue, config) => {
      if (!issue || used.has(issue._id)) return;
      used.add(issue._id);
      cards.push({
        id: issue._id,
        issue,
        ...config,
      });
    };

    const byLatest = [...issues].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const bySupport = [...issues].sort((a, b) => (b.supportCount || 0) - (a.supportCount || 0));
    const unresolvedByAge = [...issues]
      .filter((issue) => unresolved.includes(issue.status))
      .sort((a, b) => daysSince(b.createdAt) - daysSince(a.createdAt));

    const critical = highPressureIssues.find(({ pressure }) => pressure.label === 'Critical')?.issue;
    const resolvedLatest = byLatest.find((issue) => issue.status === 'Resolved');
    const fresh = byLatest[0];
    const mostSupported = bySupport.find((issue) => (issue.supportCount || 0) > 0);
    const neglected = unresolvedByAge.find((issue) => daysSince(issue.createdAt) >= 3);

    addCard(critical, {
      variant: 'critical',
      icon: '🔥',
      kicker: 'Hot Right Now',
      metric: `L${critical?.escalationLevel || 1}`,
      tab: 'Pending',
    });

    addCard(mostSupported, {
      variant: 'support',
      icon: '❤️',
      kicker: 'Most Supported',
      metric: `${mostSupported?.supportCount || 0} supports`,
      tab: 'Trending',
    });

    addCard(fresh, {
      variant: 'fresh',
      icon: '✨',
      kicker: 'Fresh Report',
      metric: `${daysSince(fresh?.createdAt)}d old`,
      tab: 'Latest',
    });

    addCard(neglected, {
      variant: 'neglect',
      icon: '⏳',
      kicker: 'Needs Rescue',
      metric: `${daysSince(neglected?.createdAt)}d waiting`,
      tab: 'Pending',
    });

    addCard(resolvedLatest, {
      variant: 'win',
      icon: '🏆',
      kicker: 'Resolved Win',
      metric: 'Success story',
      tab: 'Resolved',
    });

    return cards.slice(0, 5);
  }, [issues, highPressureIssues]);

  const feedStats = useMemo(() => {
    const total = issues.length;
    const resolved = issues.filter((issue) => issue.status === 'Resolved').length;
    const pending = total - resolved;
    const highPressure = issues.filter((issue) => getPressure(issue).label === 'Critical').length;
    return { total, resolved, pending, highPressure };
  }, [issues]);

  const setSectionFilter = (sectionName) => {
    const next = {};
    if (search.trim()) next.q = search.trim();
    if (activeTab !== 'Latest') next.tab = activeTab;
    if (sectionName && sectionName !== 'Home') next.section = sectionName;
    if (activeTag.trim()) next.tag = activeTag.trim();
    setSearchParams(next);
  };

  const feed = useMemo(() => {
    let result = [...issues];

    if (activeSectionName !== 'Home') {
      const selectedSection = sections.find((section) => section.name.toLowerCase() === activeSectionName.toLowerCase());
      result = selectedSection ? result.filter((issue) => issue.sectionId === selectedSection._id) : result;
    }

    if (activeTag.trim()) {
      result = result.filter((issue) => issue.tags.some((tag) => tag.toLowerCase() === activeTag.toLowerCase()));
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter((issue) => {
        const inTitle = issue.title.toLowerCase().includes(query);
        const inDescription = issue.description.toLowerCase().includes(query);
        const inTags = issue.tags.some((tag) => tag.toLowerCase().includes(query));
        return inTitle || inDescription || inTags;
      });
    }

    if (activeTab === 'Trending') {
      result.sort((a, b) => b.supportCount - a.supportCount);
    } else if (activeTab === 'Latest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (activeTab === 'Pending') {
      result = result.filter((issue) => unresolved.includes(issue.status));
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (activeTab === 'Resolved') {
      result = result.filter((issue) => issue.status === 'Resolved');
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [issues, sections, activeSectionName, activeTag, search, activeTab]);

  const supportIssue = async (issueId) => {
    setError('');
    try {
      await API.post('/interactions/support', { issueId });
      await loadFeed();
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to support issue');
    }
  };

  const addComment = async (issueId) => {
    setError('');
    const content = commentInput[issueId]?.trim();
    if (!content) return;

    try {
      await API.post('/interactions/comment', { issueId, content });
      setCommentInput((prev) => ({ ...prev, [issueId]: '' }));
      await loadFeed();
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to add comment');
    }
  };

  const addEvidence = async (issueId) => {
    setError('');
    const draft = evidenceInput[issueId] || { text: '', fileUrl: '' };
    if (!draft.text?.trim() && !draft.fileUrl?.trim()) return;

    try {
      await API.post('/evidence', { issueId, text: draft.text || '', fileUrl: draft.fileUrl || '' });
      setEvidenceInput((prev) => ({ ...prev, [issueId]: { text: '', fileUrl: '' } }));
      await loadFeed();
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to add evidence');
    }
  };

  const escalate = async (issueId) => {
    setError('');
    try {
      await API.put(`/issues/${issueId}/escalate`);
      await loadFeed();
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to escalate issue');
    }
  };

  return (
    <AppLayout
      title="Home"
      rightContent={(
        <>
          <div className="panel right-panel">
            <h3>Trending Tags</h3>
            <div className="tags-wrap">
              {trendingTags.map((tag) => (
                <button key={tag} className="chip" onClick={() => setActiveTag(tag)}>#{tag}</button>
              ))}
              {!trendingTags.length && <p className="hint">No tags yet.</p>}
            </div>
          </div>
          <div className="panel right-panel">
            <h3>High Pressure</h3>
            {highPressureIssues.map(({ issue, pressure }) => (
              <div key={issue._id} className="mini-item">
                <strong>{issue.title}</strong>
                <span>{pressure.label}</span>
              </div>
            ))}
            {!highPressureIssues.length && <p className="hint">No issues yet.</p>}
          </div>
        </>
      )}
    >
      <div className="panel feed-hero">
        <div>
          <h3>Hi {me?.name?.split(' ')[0] || 'there'} 👋</h3>
          <p className="hint">Your voice matters. Keep reports clear, calm, and specific for faster action.</p>
          <div className="impact-ribbon">
            <strong>Campus Pulse Live</strong>
            <span>{feedStats.total} active stories · {feedStats.resolved} resolved wins</span>
          </div>
        </div>
        <div className="feed-hero-stats">
          <div><strong>{feedStats.pending}</strong><span>Pending</span></div>
          <div><strong>{feedStats.resolved}</strong><span>Resolved</span></div>
          <div><strong>{feedStats.highPressure}</strong><span>Critical</span></div>
        </div>
        <div className="section-chip-row">
          {['Home', 'Academics', 'Hostel', 'Transport', 'General'].map((item) => (
            <button
              key={item}
              className={`chip ${activeSectionName === item ? '' : 'subtle'}`}
              onClick={() => setSectionFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="feed-top">
        <div className="search-wrap">
          <input placeholder="Search issues, tags, sections" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="feed-top-kicker">
          <span>Impact Feed</span>
          <strong>{feed.length}</strong>
        </div>
        <Link className="btn" to="/issues/new">Create Issue</Link>
      </div>

      <div className="panel story-rail">
        <h3>Campus Stories</h3>
        <div className="story-list">
          {storyCards.map((card) => (
            <button
              key={card.id}
              className={`story-item variant-${card.variant}`}
              onClick={() => {
                setActiveTab(card.tab || 'Latest');
                setActiveTag(card.issue.tags?.[0] || '');
              }}
            >
              <span className="story-ring">{card.icon}</span>
              <p className="story-kicker">{card.kicker}</p>
              <strong>{card.issue.title.slice(0, 26)}{card.issue.title.length > 26 ? '…' : ''}</strong>
              <small>{card.metric}</small>
            </button>
          ))}
          {!storyCards.length && <p className="hint">No stories yet.</p>}
        </div>
      </div>

      <div className="tabs twitter-tabs">
        {tabs.map((item) => (
          <button key={item} className={`tab-btn ${activeTab === item ? 'active' : ''}`} onClick={() => setActiveTab(item)}>
            {item}
          </button>
        ))}
      </div>

      <div className="feed-meta">
        <span>Section: {activeSectionName}</span>
        {activeTag && <span>Tag: #{activeTag}</span>}
      </div>

      {feed.map((issue) => {
        const interactions = interactionsByIssue[issue._id] || [];
        const issueEvidence = evidenceByIssue[issue._id] || [];
        const comments = interactions.filter((item) => item.type === 'comment');
        const hasSupported = interactions.some((item) => item.type === 'support' && item.userId === me?._id);
        const pressure = getPressure(issue);
        const sectionName = sectionNameMap[issue.sectionId] || 'Unknown';
        const isAnonymousIssue = issue.isAnonymous && issue.createdBy !== me?._id && me?.role !== 'admin';
        const creatorLabel = isAnonymousIssue ? 'Anonymous Reporter' : (directoryNameMap[issue.createdBy] || 'Unknown Reporter');
        const age = daysSince(issue.createdAt);
        const neglect = unresolved.includes(issue.status) && age >= 2;
        const resolvedIn = issue.status === 'Resolved' ? `${age} day${age === 1 ? '' : 's'}` : null;
        const affected = (issue.supportCount || 0) + 1;

        return (
          <article key={issue._id} className="feed-card insta-post">
            <div className="feed-main">
              <div className="post-head">
                <div className="post-user">
                  <div className="post-user-avatar">{creatorLabel.charAt(0).toUpperCase()}</div>
                  <div>
                    <strong>{creatorLabel}</strong>
                    <p>{sectionName} · {new Date(issue.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`status-pill ${issue.status.toLowerCase().replace(/\s+/g, '-')}`}>{issue.status}</span>
              </div>

              <div className="feed-card-head">
                <h3>{issue.title}</h3>
              </div>

              <p className="feed-body">{issue.description}</p>

              {issue.imageUrl && (
                <div className="post-media-frame">
                  <img src={issue.imageUrl} alt={issue.title} className="issue-image" />
                </div>
              )}

              <div className="meta-row compact">
                <span>Support {issue.supportCount}</span>
                <span>{pressure.label} Pressure</span>
                <span>L{issue.escalationLevel}</span>
              </div>

              {pressure.label === 'Critical' && <p className="hint">⚠ High urgency: this issue needs quick authority response.</p>}

              {issue.taggedAuthorityIds?.length > 0 && (
                <p className="hint">Tagged: {issue.taggedAuthorityIds.map((id) => userNameMap[id] || id).join(', ')}</p>
              )}

              {neglect && <p className="neglect">No response for {age} days</p>}
              {resolvedIn && <p className="resolved-note">Resolved in {resolvedIn} · Affected {affected} students</p>}

              <div className="tags-wrap">
                {issue.tags.map((tag) => (
                  <button key={tag} className="chip subtle" onClick={() => setActiveTag(tag)}>#{tag}</button>
                ))}
              </div>

              <div className="post-action-row">
                <button
                  className={`post-action-btn ${hasSupported ? 'active' : ''}`}
                  onClick={() => supportIssue(issue._id)}
                  disabled={hasSupported}
                  aria-label={hasSupported ? 'Supported' : 'Support'}
                >
                  <span className="post-action-icon">{hasSupported ? '❤' : '♡'}</span>
                  <span className="post-action-label">Support</span>
                  <small>{issue.supportCount}</small>
                </button>
                <button
                  className={`post-action-btn ${openCommentFor === issue._id ? 'active' : ''}`}
                  onClick={() => setOpenCommentFor(openCommentFor === issue._id ? '' : issue._id)}
                  aria-label="Reply"
                >
                  <span className="post-action-icon">💬</span>
                  <span className="post-action-label">Reply</span>
                  <small>{comments.length}</small>
                </button>
                <button
                  className={`post-action-btn ${openMenuFor === issue._id ? 'active' : ''}`}
                  onClick={() => setOpenMenuFor(openMenuFor === issue._id ? '' : issue._id)}
                  aria-label="More actions"
                >
                  <span className="post-action-icon">⋯</span>
                  <span className="post-action-label">More</span>
                  <small>Tools</small>
                </button>
                <Link className="post-action-btn" to={`/issues/${issue._id}`} aria-label="Open issue detail">
                  <span className="post-action-icon">↗</span>
                  <span className="post-action-label">Open</span>
                  <small>Detail</small>
                </Link>
              </div>

              {openMenuFor === issue._id && (
                <div className="inline-menu">
                  <button className="menu-item" onClick={() => setOpenEvidenceFor(openEvidenceFor === issue._id ? '' : issue._id)}>Add Evidence</button>
                  <button className="menu-item" onClick={() => escalate(issue._id)}>Escalate Issue</button>
                </div>
              )}

              {openCommentFor === issue._id && (
                <div className="thread-box">
                  <div className="thread-head">
                    <h4>Discussion</h4>
                    <span>{comments.length} posts</span>
                  </div>
                  {comments.map((comment) => (
                    <article key={comment._id} className="comment-post-card">
                      <div className="comment-post-head">
                        <div className="comment-post-avatar">{(directoryNameMap[comment.userId] || comment.userId).charAt(0).toUpperCase()}</div>
                        <div>
                          <strong>{directoryNameMap[comment.userId] || comment.userId}</strong>
                          <p>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Just now'}</p>
                        </div>
                      </div>
                      <p className="comment-post-body">{comment.content}</p>
                    </article>
                  ))}
                  {!comments.length && <p className="hint">No comments yet.</p>}
                  <div className="compose-row">
                    <input
                      placeholder="Write a reply that moves this issue forward"
                      value={commentInput[issue._id] || ''}
                      onChange={(event) => setCommentInput((prev) => ({ ...prev, [issue._id]: event.target.value }))}
                    />
                    <button className="btn" onClick={() => addComment(issue._id)}>Post Update</button>
                  </div>
                </div>
              )}

              {openEvidenceFor === issue._id && (
                <div className="thread-box">
                  {issueEvidence.map((item) => (
                    <div key={item._id} className="mini-item">
                      <strong>{directoryNameMap[item.userId] || item.userId}</strong>
                      {item.text && <p>{item.text}</p>}
                      {item.fileUrl && <a href={item.fileUrl} target="_blank" rel="noreferrer">Open file</a>}
                    </div>
                  ))}
                  {!issueEvidence.length && <p className="hint">No evidence yet.</p>}
                  <textarea
                    placeholder="Evidence text"
                    value={evidenceInput[issue._id]?.text || ''}
                    onChange={(event) => setEvidenceInput((prev) => ({ ...prev, [issue._id]: { ...(prev[issue._id] || {}), text: event.target.value } }))}
                  />
                  <input
                    placeholder="Image/File URL (optional)"
                    value={evidenceInput[issue._id]?.fileUrl || ''}
                    onChange={(event) => setEvidenceInput((prev) => ({ ...prev, [issue._id]: { ...(prev[issue._id] || {}), fileUrl: event.target.value } }))}
                  />
                  <button className="btn" onClick={() => addEvidence(issue._id)}>Submit Evidence</button>
                </div>
              )}
            </div>
          </article>
        );
      })}

      {!feed.length && <div className="panel">No issues match current filters.</div>}
      {error && <div className="panel error-block">{error}</div>}
    </AppLayout>
  );
}
