import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, Mail, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { markAsRead, markAllAsRead, deleteNotification, setNotifications } from '../features/notifications/notificationsSlice';
import './NotificationPanel.css';

const NotificationPanel = ({ onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, user } = useSelector(state => state.auth);
  const { notifications, unreadCount } = useSelector(state => state.notifications);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/notifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 50 }
        }
      );
      
      const formattedNotifications = response.data.data.notifications.map(notif => ({
        id: notif._id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: notif.isRead,
        timestamp: notif.createdAt,
        relatedMessage: notif.relatedMessage,
        relatedDocument: notif.relatedDocument,
        relatedUser: notif.relatedUser
      }));
      
      dispatch(setNotifications(formattedNotifications));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayNotifications = notifications.length > 0 ? notifications : [];

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(markAsRead(notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(markAllAsRead());
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(deleteNotification(notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Close panel if onClose function is provided
    if (onClose) {
      onClose();
    }

    // Navigate based on notification type
    if (notification.type === 'support_response') {
      // Navigate to support page to view messages, set tab to my-messages
      navigate('/support', { state: { activeTab: 'my-messages' } });
    } else if (notification.type === 'message_received' && user?.role === 'Admin') {
      // Navigate to admin messages tab
      navigate('/admin', { state: { activeTab: 'messages' } });
    } else if (notification.relatedDocument) {
      // Navigate to document if available
      navigate('/documents');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'support_response':
      case 'message_received':
        return <MessageCircle size={18} className="notification-icon-support" />;
      case 'document_shared':
      case 'document_uploaded':
        return <Bell size={18} className="notification-icon-document" />;
      default:
        return <Bell size={18} className="notification-icon-default" />;
    }
  };

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <div className="notification-title">
          <Bell size={20} />
          <h3>Notifications</h3>
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </div>
        {unreadCount > 0 && (
          <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
            <Check size={16} />
            Mark all read
          </button>
        )}
      </div>

      <div className="notification-list">
        {loading ? (
          <div className="notification-loading">Loading...</div>
        ) : displayNotifications.length === 0 ? (
          <div className="no-notifications">
            <Bell size={48} />
            <p>No notifications yet</p>
          </div>
        ) : (
          displayNotifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              onClick={() => handleNotificationClick(notification)}
              style={{ cursor: 'pointer' }}
            >
              <div className="notification-icon-wrapper">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                {notification.title && (
                  <p className="notification-title-text">{notification.title}</p>
                )}
                <p className="notification-message">{notification.message}</p>
                <span className="notification-time">{getTimeAgo(notification.timestamp)}</span>
              </div>
              <div className="notification-actions">
                {!notification.read && (
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotification(notification.id);
                  }}
                  title="Delete"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
