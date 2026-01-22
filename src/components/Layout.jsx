import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  FileText, 
  User, 
  HelpCircle, 
  LogOut, 
  Menu, 
  X,
  Bell
} from 'lucide-react';
import { logout } from '../features/auth/authSlice';
import LanguageSelector from './LanguageSelector';
import NotificationPanel from './NotificationPanel';
import './Layout.css';

const Layout = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { unreadCount } = useSelector(state => state.notifications);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('navigation.dashboard') },
    { path: '/documents', icon: FileText, label: t('navigation.documents') },
    { path: '/profile', icon: User, label: t('navigation.profile') },
    { path: '/support', icon: HelpCircle, label: t('navigation.support') },
  ];

  // Add admin link if user is Admin
  if (user?.role === 'Admin') {
    navItems.push({ path: '/admin', icon: User, label: 'Admin' });
  }

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>DocArchive</h2>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="user-details">
              <p className="user-name">{user?.firstName} {user?.lastName}</p>
              <p className="user-role">{user?.role}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            {t('auth.logout')}
          </button>
        </div>
      </aside>

      <div className="main-container">
        <header className="header">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          
          <div className="header-actions">
            <LanguageSelector />
            <button 
              className="notification-btn" 
              onClick={() => setNotificationOpen(!notificationOpen)}
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>

      {notificationOpen && (
        <>
          <NotificationPanel onClose={() => setNotificationOpen(false)} />
          <div 
            className="notification-overlay" 
            onClick={() => setNotificationOpen(false)}
          />
        </>
      )}

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default Layout;
