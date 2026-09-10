import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Sparkles,
  Compass,
  CheckCircle
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, notifications, unreadNotificationsCount, markNotificationRead } = useAuth();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="ayush-navbar-wrapper">
      {/* Main Navigation Bar */}
      <nav className="ayush-nav">
        <div className="nav-container">
          {/* Logo & Portal Title */}
          <Link to="/" className="brand-logo">
            <div className="brand-emblem" style={{ background: '#eff6ff', borderColor: '#3b82f6' }}>
              <Compass size={22} color="#2563eb" />
            </div>
            <div className="brand-text">
              <span className="brand-title" style={{ color: '#1e3a8a' }}>Skill Connect</span>
              <span className="brand-subtitle">Academia–Industry Collaboration Portal</span>
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

                {user.role === 'recruiter' && (
                  <>
                    <Link to="/recruiter" className={`nav-link ${isActive('/recruiter') ? 'active' : ''}`}>
                      <Building2 size={18} />
                      <span>Recruiter Portal</span>
                    </Link>
                    <Link to="/opportunities" className={`nav-link ${isActive('/opportunities') ? 'active' : ''}`}>
                      <Briefcase size={18} />
                      <span>Opportunities</span>
                    </Link>
                    <Link to="/applications" className={`nav-link ${isActive('/applications') ? 'active' : ''}`}>
                      <FileText size={18} />
                      <span>Applicants</span>
                    </Link>
                  </>
                )}

                {user.role === 'mentor' && (
                  <>
                    <Link to="/mentor" className={`nav-link ${isActive('/mentor') ? 'active' : ''}`}>
                      <GraduationCap size={18} />
                      <span>Mentor Portal</span>
                    </Link>
                  </>
                )}

                {user.role === 'admin' && (
                  <>
                    <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                      <ShieldCheck size={18} />
                      <span>Admin Console</span>
                    </Link>
                    <Link to="/opportunities" className={`nav-link ${isActive('/opportunities') ? 'active' : ''}`}>
                      <Briefcase size={18} />
                      <span>All Listings</span>
                    </Link>
                    <Link to="/applications" className={`nav-link ${isActive('/applications') ? 'active' : ''}`}>
                      <FileText size={18} />
                      <span>Applications</span>
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link to="/opportunities" className="nav-link">
                  <Briefcase size={18} />
                  <span>Browse Opportunities</span>
                </Link>
              </>
            )}
          </div>

          {/* Right Action Area */}
          <div className="nav-actions">
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
                        <span className="notif-count">{notifications.length} total</span>
                      </div>
                      <div className="notif-list">
                        {notifications.length === 0 ? (
                          <div className="notif-empty">No notifications yet</div>
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
                                <Clock size={12} /> {new Date(n.created_at || n.timestamp).toLocaleDateString()}
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
                  <div className="user-avatar" style={{ background: '#2563eb' }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="user-details">
                    <span className="user-name">{user.name || user.profile?.companyName || user.email}</span>
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
