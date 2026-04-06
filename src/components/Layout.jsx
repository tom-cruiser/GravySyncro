import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { io } from 'socket.io-client';
import api from '../config/api';
import { 
  LayoutDashboard, 
  FileText, 
  User, 
  HelpCircle, 
  LogOut, 
  Menu, 
  X,
  Bell,
  CreditCard,
  FolderKanban,
} from 'lucide-react';
import { logout } from '../features/auth/authSlice';
import { prependNotification, setUnreadCount } from '../features/notifications/notificationsSlice';
import LanguageSelector from './LanguageSelector';
import NotificationPanel from './NotificationPanel';
import './Layout.css';

const Layout = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useSelector(state => state.auth);
  const { unreadCount, inbox } = useSelector(state => state.notifications);
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [workspaceLabel, setWorkspaceLabel] = useState('Workspaces');
  const [tenantLogo, setTenantLogo] = useState('');

  useEffect(() => {
    if (!token) return undefined;

    const socketBaseUrl = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '').replace(/\/api\/v1\/?$/, '');
    const socket = io(socketBaseUrl || window.location.origin, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      socket.emit('authenticate', { token });
    });

    socket.on('notification:new', (notification) => {
      dispatch(prependNotification({
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: !!notification.read,
        timestamp: notification.createdAt,
        actionUrl: notification.actionUrl,
        relatedDocument: notification.relatedDocument,
        relatedWorkspace: notification.relatedWorkspace,
      }));
    });

    socket.on('authenticated', ({ ok }) => {
      if (!ok) {
        socket.disconnect();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch, token, user]);

  useEffect(() => {
    if (!user || !token) return;

    const fetchLayoutData = async () => {
      try {
        const notificationResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/notifications/unread-count`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        dispatch(setUnreadCount(notificationResponse.data?.data?.count || 0));
        setWorkspaceLabel('Workspaces');
        setTenantLogo('');
      } catch (error) {
        if (error?.response?.status === 401) {
          dispatch(logout());
          navigate('/login');
        }
      }
    };

    fetchLayoutData();
    const interval = setInterval(fetchLayoutData, 60000);
    return () => clearInterval(interval);
  }, [dispatch, token, user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('navigation.dashboard') },
    { path: '/documents', icon: FileText, label: t('navigation.documents') },
    { path: '/workspaces', icon: FolderKanban, label: workspaceLabel },
    { path: '/profile', icon: User, label: t('navigation.profile') },
    { path: '/support', icon: HelpCircle, label: t('navigation.support') },
    { path: '/billing', icon: CreditCard, label: 'Billing' },
  ];

  // Add admin link if user is Admin
  if (user?.role === 'Admin') {
    navItems.push({ path: '/admin', icon: User, label: 'Admin' });
  }

  const workspaceUnread = Boolean(
    currentWorkspace?._id && inbox.some((notification) => (
      !notification.read
      && String(notification.relatedWorkspace || '') === String(currentWorkspace._id)
    )),
  );

  const isWorkspaceContext = location.pathname.startsWith('/documents') || location.pathname.startsWith('/workspaces');

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            {tenantLogo ? (
              <img src={tenantLogo} alt="Tenant logo" className="tenant-logo" />
            ) : (
              <h2>GravySyncro</h2>
            )}
          </div>
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
              className={`notification-btn ${isWorkspaceContext && workspaceUnread ? 'workspace-active' : ''}`}
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
