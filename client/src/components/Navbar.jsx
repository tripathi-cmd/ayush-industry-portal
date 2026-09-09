import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  GraduationCap, 
  ShieldCheck, 
  Briefcase, 
  Award, 
  FileText, 
  Bell, 
  LogOut, 
  Clock, 
  Sparkles 
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, quickLogin, notifications, unreadNotificationsCount, markNotificationRead } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  const handleQuickSwitch = async (role) => {
    setSwitchingRole(true);
    try {
      await quickLogin(role);
      if (role === 'student') navigate('/student');
      else if (role === 'industry') navigate('/industry');
      else if (role === 'admin') navigate('/admin');
    } catch (err) {
      console.error(err);
    } finally {
      setSwitchingRole(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="ayush-navbar-wrapper">
      {/* Top Ministry Banner */}
      <div className="gov-topbar">
        <div className="gov-topbar-content">
          <div className="gov-left">
            <span className="gov-flag">🇮🇳</span>
            <span>Government of India • Ministry of Ayush (आयुष मंत्रालय)</span>
          </div>
          <div className="gov-right">
            <span>National Ayush Mission (NAM)</span>
            <span className="divider">|</span>
            <span className="helpline">Toll-Free Helpline: 14443</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="ayush-nav">
        <div className="nav-container">
          {/* Logo & Portal Title */}
          <Link to="/" className="brand-logo">
            <div className="brand-emblem">
              <span className="ayush-leaf">🌿</span>
            </div>
            <div className="brand-text">
              <span className="brand-title">Ministry of Ayush</span>
              <span className="brand-subtitle">Industry Partnership & Skill Portal</span>
            </div>
          </Link>

          {/* Role Navigation Links */}
          <div className="nav-links">
            {user ? (
              <>
                {user.role === 'student' && (
                  <>
                    <Link to="/student" className={`nav-link ${isActive('/student') ? 'active' : ''}`}>
                      <GraduationCap size={18} />
                      <span>Dashboard</span>
                    </Link>
                    <Link to="/skills" className={`nav-link ${isActive('/skills') ? 'active' : ''}`}>
                      <Award size={18} />
                      <span>Skill Profile</span>
                    </Link>
                    <Link to="/assessment" className={`nav-link ${isActive('/assessment') ? 'active' : ''}`}>
                      <Sparkles size={18} />
                      <span>Assessments</span>
                    </Link>
                    <Link to="/opportunities" className={`nav-link ${isActive('/opportunities') ? 'active' : ''}`}>
                      <Briefcase size={18} />
                      <span>Opportunities</span>
                    </Link>
                    <Link to="/applications" className={`nav-link ${isActive('/applications') ? 'active' : ''}`}>
                      <FileText size={18} />
                      <span>Applications</span>
                    </Link>
                  </>
                )}

                {user.role === 'industry' && (
                  <>
                    <Link to="/industry" className={`nav-link ${isActive('/industry') ? 'active' : ''}`}>
                      <Building2 size={18} />
                      <span>Partner Portal</span>
                    </Link>
                    <Link to="/opportunities" className={`nav-link ${isActive('/opportunities') ? 'active' : ''}`}>
                      <Briefcase size={18} />
                      <span>Browse Internships</span>
                    </Link>
                  </>
                )}

                {user.role === 'admin' && (
                  <>
                    <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                      <ShieldCheck size={18} />
                      <span>Ministry Admin</span>
                    </Link>
                    <Link to="/opportunities" className={`nav-link ${isActive('/opportunities') ? 'active' : ''}`}>
                      <Briefcase size={18} />
                      <span>All Listings</span>
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link to="/opportunities" className="nav-link">
                  <Briefcase size={18} />
                  <span>Browse Internships</span>
                </Link>
              </>
            )}
          </div>

          {/* Right Action Area */}
          <div className="nav-actions">
            {/* Demo Quick Switcher */}
            <div className="demo-switcher">
              <span className="demo-label">Demo Role:</span>
              <button 
                onClick={() => handleQuickSwitch('student')} 
                className={`demo-btn ${user?.role === 'student' ? 'active' : ''}`}
                disabled={switchingRole}
                title="Switch to Dr. Ananya (Student)"
              >
                Student
              </button>
              <button 
                onClick={() => handleQuickSwitch('industry')} 
                className={`demo-btn ${user?.role === 'industry' ? 'active' : ''}`}
                disabled={switchingRole}
                title="Switch to Dabur R&D (Industry)"
              >
                Industry
              </button>
              <button 
                onClick={() => handleQuickSwitch('admin')} 
                className={`demo-btn ${user?.role === 'admin' ? 'active' : ''}`}
                disabled={switchingRole}
                title="Switch to Ministry Admin"
              >
                Admin
              </button>
            </div>

            {user ? (
              <div className="user-area">
                {/* Notification Bell */}
                <div className="notif-wrapper">
                  <button 
                    className="notif-bell-btn" 
                    onClick={() => setShowNotifs(!showNotifs)}
                    aria-label="Notifications"
                  >
                    <Bell size={19} />
                    {unreadNotificationsCount > 0 && (
                      <span className="notif-badge">{unreadNotificationsCount}</span>
                    )}
                  </button>

                  {/* Dropdown */}
                  {showNotifs && (
                    <div className="notif-dropdown">
                      <div className="notif-header">
                        <h4>Notifications & Alerts</h4>
                        <span className="notif-count">{notifications.length} alerts</span>
                      </div>
                      <div className="notif-list">
                        {notifications.length === 0 ? (
                          <div className="notif-empty">No new notifications</div>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              className={`notif-item ${n.read ? 'read' : 'unread'}`}
                              onClick={() => markNotificationRead(n.id)}
                            >
                              <div className="notif-title-row">
                                <span className="notif-title">{n.title}</span>
                                {!n.read && <span className="unread-dot"></span>}
                              </div>
                              <p className="notif-msg">{n.message}</p>
                              <span className="notif-time">
                                <Clock size={12} /> {new Date(n.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Info & Logout */}
                <div className="user-badge">
                  <div className="user-avatar">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="user-details">
                    <span className="user-name">{user.name || user.companyName}</span>
                    <span className="user-role-tag">{user.role.toUpperCase()}</span>
                  </div>
                </div>

                <button onClick={logout} className="logout-btn" title="Sign Out">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="auth-btns">
                <Link to="/login" className="btn btn-outline">Sign In</Link>
                <Link to="/register" className="btn btn-primary">Register</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
