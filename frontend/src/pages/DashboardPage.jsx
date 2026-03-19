import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import API from '../services/api';
import { useAuth } from '../context/useAuth';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    API.get('/analytics/weekly')
      .then((analyticsRes) => setSummary(analyticsRes.data))
      .catch(() => setSummary(null));
  }, []);

  return (
    <AppLayout title="Insights / Weekly Report">
      <div className="panel">
        <h3>Weekly Summary</h3>
        <p>{summary ? `Generated at ${new Date(summary.generatedAt).toLocaleString()}` : 'Loading summary...'}</p>
      </div>

      <div className="grid three">
        <div className="panel stat"><span>Total Issues</span><strong>{summary?.totalIssues ?? 0}</strong></div>
        <div className="panel stat"><span>Resolved</span><strong>{summary?.resolved ?? 0}</strong></div>
        <div className="panel stat"><span>Pending</span><strong>{summary?.pending ?? 0}</strong></div>
      </div>

      <div className="panel">
        <h3>Logged in User</h3>
        <p>{user ? `${user.name} (${user.role}) - ${user.department}` : 'Loading user...'}</p>
      </div>

      <div className="panel">
        <h3>Issues Per Section</h3>
        {!summary ? (
          <p>Loading...</p>
        ) : (
          <div className="section-stats">
            {Object.entries(summary.issuesPerSection || {}).map(([section, count]) => (
              <div key={section} className="section-row"><span>{section}</span><strong>{count}</strong></div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <h3>Department Progress</h3>
        {!summary?.departmentPerformance?.length ? (
          <p className="hint">No department data yet.</p>
        ) : (
          <div className="dept-chart">
            {summary.departmentPerformance.map((item) => (
              <div key={item.department} className="dept-chart-row">
                <div className="dept-label">
                  <strong>{item.department}</strong>
                  <span className="hint">{item.complaints} complaints · {item.resolved} resolved · {item.rating}</span>
                </div>
                <div className="dept-bar-wrap">
                  <div className="dept-bar" style={{ width: `${Math.max(6, item.resolutionRate)}%` }} />
                </div>
                <strong>{item.resolutionRate}%</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid two">
        <div className="panel">
          <h3>Doing Good</h3>
          {summary?.departmentPerformance
            ?.filter((item) => item.rating === 'Good')
            .map((item) => (
              <div key={item.department} className="section-row">
                <span>{item.department}</span>
                <strong>{item.resolutionRate}%</strong>
              </div>
            ))}
        </div>
        <div className="panel">
          <h3>Needs Attention</h3>
          {summary?.departmentPerformance
            ?.filter((item) => item.rating !== 'Good')
            .map((item) => (
              <div key={item.department} className="section-row">
                <span>{item.department}</span>
                <strong>{item.resolutionRate}%</strong>
              </div>
            ))}
        </div>
      </div>

      <div className="panel">
        <Link className="btn" to="/home">Back to Feed</Link>
      </div>
    </AppLayout>
  );
}
