import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import API from '../services/api';

const statusOptions = ['Open', 'Seen', 'In Progress', 'Escalated', 'Resolved'];

const daysSince = (value) => Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24)));

const pressureScore = (issue) => {
  const age = daysSince(issue.createdAt);
  return (issue.supportCount || 0) * 2 + (issue.escalationLevel || 1) * 3 + age;
};

export default function AdminPage() {
  const [issues, setIssues] = useState([]);
  const [sections, setSections] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [statusDraft, setStatusDraft] = useState({});
  const [sectionFilter, setSectionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [logQuery, setLogQuery] = useState('');
  const [throughputPerDay, setThroughputPerDay] = useState(4);
  const [highlightIssueId, setHighlightIssueId] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    const [issuesRes, sectionsRes, analyticsRes, logsRes] = await Promise.all([
      API.get('/issues'),
      API.get('/sections'),
      API.get('/analytics/weekly'),
      API.get('/users/logs'),
    ]);

    setIssues(issuesRes.data);
    setSections(sectionsRes.data);
    setAnalytics(analyticsRes.data);
    setLogs(logsRes.data);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await loadData();
      } catch {
        setError('Unable to load admin data');
      }
    };

    bootstrap();
  }, []);

  const sectionNameMap = useMemo(() => {
    return sections.reduce((acc, section) => {
      acc[section._id] = section.name;
      return acc;
    }, {});
  }, [sections]);

  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue) => {
        const sectionOk = sectionFilter === 'All' || sectionNameMap[issue.sectionId] === sectionFilter;
        const statusOk = statusFilter === 'All' || issue.status === statusFilter;
        return sectionOk && statusOk;
      })
      .sort((a, b) => pressureScore(b) - pressureScore(a));
  }, [issues, sectionFilter, statusFilter, sectionNameMap]);

  const priorityBoard = useMemo(() => {
    return [...issues]
      .map((issue) => ({
        ...issue,
        pressure: pressureScore(issue),
        neglectDays: daysSince(issue.createdAt),
      }))
      .sort((a, b) => b.pressure - a.pressure)
      .slice(0, 6);
  }, [issues]);

  const filteredLogs = useMemo(() => {
    const query = logQuery.trim().toLowerCase();
    if (!query) return logs.slice(0, 80);
    return logs
      .filter((log) =>
        `${log.service} ${log.action} ${log.userId || ''} ${log.issueId || ''}`.toLowerCase().includes(query)
      )
      .slice(0, 80);
  }, [logs, logQuery]);

  const recentTimeline = useMemo(() => {
    return logs.slice(0, 8).map((log) => ({
      ...log,
      label: `${log.action.replace(/_/g, ' ')} · ${log.service}`,
    }));
  }, [logs]);

  const sectionHealth = useMemo(() => {
    return sections.map((section) => {
      const sectionIssues = issues.filter((item) => item.sectionId === section._id);
      const open = sectionIssues.filter((item) => item.status !== 'Resolved').length;
      const escalated = sectionIssues.filter((item) => item.status === 'Escalated').length;
      const resolved = sectionIssues.filter((item) => item.status === 'Resolved').length;
      const pressureAvg = sectionIssues.length
        ? Math.round(sectionIssues.reduce((acc, item) => acc + pressureScore(item), 0) / sectionIssues.length)
        : 0;

      const healthIndex = Math.max(0, 100 - open * 8 - escalated * 12 - pressureAvg * 2 + resolved * 4);
      let state = 'Healthy';
      if (healthIndex < 70) state = 'Watch';
      if (healthIndex < 45) state = 'Critical';

      return {
        _id: section._id,
        name: section.name,
        open,
        escalated,
        resolved,
        pressureAvg,
        healthIndex,
        state,
      };
    });
  }, [sections, issues]);

  const kpis = useMemo(() => {
    const escalated = issues.filter((item) => item.status === 'Escalated').length;
    const critical = issues.filter((item) => pressureScore(item) >= 14).length;
    const neglected = issues.filter((item) => item.status !== 'Resolved' && daysSince(item.createdAt) >= 2).length;

    return {
      total: analytics?.totalIssues ?? issues.length,
      resolved: analytics?.resolved ?? 0,
      pending: analytics?.pending ?? 0,
      escalated,
      critical,
      neglected,
    };
  }, [analytics, issues]);

  const backlogForecast = useMemo(() => {
    const pending = kpis.pending;
    const days = throughputPerDay > 0 ? Math.ceil(pending / throughputPerDay) : 0;
    return { pending, throughputPerDay, days };
  }, [kpis.pending, throughputPerDay]);

  const updateStatus = async (issueId) => {
    try {
      setError('');
      const status = statusDraft[issueId] || 'Seen';
      await API.put(`/issues/${issueId}/status`, { status });
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to update status');
    }
  };

  const quickSetFilter = (mode) => {
    if (mode === 'critical') {
      setStatusFilter('Escalated');
      setSectionFilter('All');
      return;
    }
    if (mode === 'neglected') {
      setStatusFilter('All');
      setSectionFilter('All');
      return;
    }
    if (mode === 'resolved') {
      setStatusFilter('Resolved');
      setSectionFilter('All');
      return;
    }
  };

  const autoSelectTopIssue = () => {
    const top = [...issues].sort((a, b) => pressureScore(b) - pressureScore(a))[0];
    if (!top) return;
    setHighlightIssueId(top._id);
    setStatusDraft((prev) => ({ ...prev, [top._id]: 'In Progress' }));
  };

  return (
    <AppLayout
      title="Admin Command Center"
      rightContent={(
        <>
          <div className="panel admin-panel">
            <h3>Priority Radar</h3>
            {priorityBoard.map((item) => (
              <div key={item._id} className="admin-mini">
                <strong>{item.title}</strong>
                <span>Pressure {item.pressure} · L{item.escalationLevel}</span>
                <span>{sectionNameMap[item.sectionId] || 'Unknown'} · {item.status}</span>
              </div>
            ))}
          </div>

          <div className="panel admin-panel">
            <h3>Live Timeline</h3>
            <div className="admin-timeline">
              {recentTimeline.map((item) => (
                <div key={item._id} className="admin-time-item">
                  <span className="dot" />
                  <div>
                    <strong>{item.label}</strong>
                    <p>{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel admin-panel">
            <h3>Action Logs</h3>
            <input
              placeholder="Search logs"
              value={logQuery}
              onChange={(event) => setLogQuery(event.target.value)}
            />
            <div className="admin-log-wrap">
              {filteredLogs.map((log) => (
                <div key={log._id} className="admin-log-item">
                  <strong>{log.action}</strong>
                  <span>{log.service}</span>
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    >
      <div className="grid three admin-kpis">
        <div className="panel stat"><span>Total Issues</span><strong>{kpis.total}</strong></div>
        <div className="panel stat"><span>Resolved</span><strong>{kpis.resolved}</strong></div>
        <div className="panel stat"><span>Pending</span><strong>{kpis.pending}</strong></div>
        <div className="panel stat"><span>Escalated</span><strong>{kpis.escalated}</strong></div>
        <div className="panel stat"><span>Critical Pressure</span><strong>{kpis.critical}</strong></div>
        <div className="panel stat"><span>Neglected &gt; 2 Days</span><strong>{kpis.neglected}</strong></div>
      </div>

      <div className="panel admin-smart-grid">
        <div>
          <h3>Smart Actions</h3>
          <p className="hint">One-click presets for fast operations.</p>
          <div className="smart-actions">
            <button className="chip" onClick={() => quickSetFilter('critical')}>Focus Escalated</button>
            <button className="chip" onClick={() => quickSetFilter('resolved')}>Review Resolved</button>
            <button className="chip" onClick={() => quickSetFilter('neglected')}>Show All Pending Risk</button>
            <button className="chip" onClick={autoSelectTopIssue}>Auto-select Top Pressure</button>
          </div>
        </div>

        <div>
          <h3>Backlog Simulator</h3>
          <p className="hint">Estimate clear-time from current throughput.</p>
          <label>Issues resolved per day</label>
          <input
            type="range"
            min="1"
            max="20"
            value={throughputPerDay}
            onChange={(event) => setThroughputPerDay(Number(event.target.value))}
          />
          <p className="hint">Throughput: {backlogForecast.throughputPerDay}/day</p>
          <p className="admin-forecast">Estimated backlog clearance: {backlogForecast.days} days</p>
        </div>
      </div>

      <div className="panel">
        <h3>Section Heatmap</h3>
        <div className="admin-heatmap-grid">
          {sectionHealth.map((item) => (
            <div key={item._id} className={`heat-card ${item.state.toLowerCase()}`}>
              <div className="meta-row"><strong>{item.name}</strong><span>{item.state}</span></div>
              <p className="hint">Health Index: {item.healthIndex}</p>
              <div className="meta-row compact">
                <span>Open {item.open}</span>
                <span>Esc {item.escalated}</span>
                <span>Res {item.resolved}</span>
                <span>P {item.pressureAvg}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel admin-filter-row">
        <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
          <option value="All">All Sections</option>
          {sections.map((section) => (
            <option key={section._id} value={section.name}>{section.name}</option>
          ))}
        </select>

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="All">All Status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="panel">
        <h3>Moderation Queue</h3>
        <p className="hint">Admin-only control surface for status lifecycle.</p>
        <div className="admin-queue">
          {filteredIssues.map((issue) => (
            <div key={issue._id} className={`admin-queue-item ${highlightIssueId === issue._id ? 'highlight' : ''}`}>
              <div>
                <strong>{issue.title}</strong>
                <p className="hint">{sectionNameMap[issue.sectionId] || 'Unknown'} · Support {issue.supportCount} · Escalation L{issue.escalationLevel}</p>
              </div>

              <div className="admin-controls">
                <span className={`status-pill ${issue.status.toLowerCase().replace(/\s+/g, '-')}`}>{issue.status}</span>
                <select
                  value={statusDraft[issue._id] || issue.status}
                  onChange={(event) => setStatusDraft((prev) => ({ ...prev, [issue._id]: event.target.value }))}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <button className="btn" onClick={() => updateStatus(issue._id)}>Apply</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="panel error-block">{error}</div>}
    </AppLayout>
  );
}
