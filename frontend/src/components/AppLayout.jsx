import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import API from '../services/api';

export default function AppLayout({ title, children, rightContent }) {
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationState, setNotificationState] = useState({ unreadCount: 0, notifications: [] });
  const { user: me, clearSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const currentSection = new URLSearchParams(location.search).get('section') || 'Home';

  const loadNotifications = useCallback(async () => {
    if (!me?._id) return;

    try {
      const response = await API.get('/users/notifications');
      setNotificationState(response.data || { unreadCount: 0, notifications: [] });
    } catch {
      setNotificationState({ unreadCount: 0, notifications: [] });
    }
  }, [me?._id]);

  useEffect(() => {
    const kickoff = setTimeout(() => {
      loadNotifications();
    }, 0);

    const timer = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => {
      clearTimeout(kickoff);
      clearInterval(timer);
    };
  }, [loadNotifications]);

  const logout = () => {
    clearSession();
    navigate('/login');
  };

  const markNotificationRead = async (notificationId, link) => {
    try {
      await API.patch(`/users/notifications/${notificationId}/read`);
      await loadNotifications();
    } catch {
      await loadNotifications();
    }

    setNotificationsOpen(false);
    if (link) navigate(link);
  };

  const markAllRead = async () => {
    try {
      await API.post('/users/notifications/read-all');
      await loadNotifications();
    } catch {
      await loadNotifications();
    }
  };

  return (
    <div className="layout">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand brand-card">
          <h2>Campus Issue Feed</h2>
          <p>Report clearly. Resolve faster.</p>
        </div>
        <nav>
          <p className="nav-group-title">Feed</p>
          <NavLink to="/home" onClick={() => setOpen(false)} className={({ isActive }) => `nav-item ${(isActive && currentSection === 'Home') ? 'active' : ''}`}>
            <span>🏠</span>
            <span>Home</span>
          </NavLink>
          <Link to="/home?section=Academics" onClick={() => setOpen(false)} className={`nav-item ${location.pathname === '/home' && currentSection === 'Academics' ? 'active' : ''}`}>
            <span>📚</span>
            <span>Academics</span>
          </Link>
          <Link to="/home?section=Hostel" onClick={() => setOpen(false)} className={`nav-item ${location.pathname === '/home' && currentSection === 'Hostel' ? 'active' : ''}`}>
            <span>🛏️</span>
            <span>Hostel</span>
          </Link>
          <Link to="/home?section=Transport" onClick={() => setOpen(false)} className={`nav-item ${location.pathname === '/home' && currentSection === 'Transport' ? 'active' : ''}`}>
            <span>🚌</span>
            <span>Transport</span>
          </Link>
          <Link to="/home?section=General" onClick={() => setOpen(false)} className={`nav-item ${location.pathname === '/home' && currentSection === 'General' ? 'active' : ''}`}>
            <span>🏛️</span>
            <span>General</span>
          </Link>

          <p className="nav-group-title">Workspace</p>
          <NavLink to="/insights" onClick={() => setOpen(false)} className="nav-item">
            <span>📈</span>
            <span>Insights</span>
          </NavLink>
          <NavLink to="/profile" onClick={() => setOpen(false)} className="nav-item">
            <span>👤</span>
            <span>Profile</span>
          </NavLink>
          {me?.role === 'admin' && <NavLink to="/admin" onClick={() => setOpen(false)} className="nav-item"><span>🛡️</span><span>Admin Panel</span></NavLink>}
          <NavLink to="/issues/new" onClick={() => setOpen(false)} className="nav-item nav-item-primary">
            <span>➕</span>
            <span>Create Issue</span>
          </NavLink>
        </nav>
        <button className="btn btn-light sidebar-logout" onClick={logout}>Logout</button>
      </aside>

      <div className="main-wrap">
        <header className="main-header">
          <button className="btn btn-light mobile-menu" onClick={() => setOpen((p) => !p)}>
            Menu
          </button>
          <div className="header-title-block">
            <h1>{title}</h1>
            <p className="hint">Every report improves campus life.</p>
          </div>
          <div className="header-actions">
            <div className="user-chip" title={`${me?.name || 'User'} (${me?.role || 'member'})`}>
              <span className="user-chip-avatar">{(me?.name || 'U').charAt(0).toUpperCase()}</span>
              <span>{me?.name?.split(' ')[0] || 'Member'}</span>
            </div>
            <button className="header-icon-btn" onClick={() => setNotificationsOpen((v) => !v)} title="Notifications">
              <span role="img" aria-label="notifications">🔔</span>
              {notificationState.unreadCount > 0 && <span className="notif-badge">{notificationState.unreadCount}</span>}
            </button>
            <Link className="header-icon-btn" to="/profile" title="Profile">
              <span role="img" aria-label="profile">👤</span>
            </Link>
            <Link className="btn btn-light" to="/issues/new">Raise Issue</Link>
          </div>

          {notificationsOpen && (
            <div className="notif-panel panel">
              <div className="notif-panel-head">
                <strong>Notifications</strong>
                <button className="ghost-action" onClick={markAllRead}>Mark all read</button>
              </div>
              {!notificationState.notifications.length && <p className="hint">No notifications yet.</p>}
              {notificationState.notifications.slice(0, 8).map((item) => (
                <button
                  key={item._id}
                  className={`notif-item ${item.isRead ? 'read' : 'unread'}`}
                  onClick={() => markNotificationRead(item._id, item.link)}
                >
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </header>
        <main className="content with-right">
          <div className="main-content">{children}</div>
          <aside className="right-rail">{rightContent}</aside>
        </main>
      </div>
    </div>
  );
}
