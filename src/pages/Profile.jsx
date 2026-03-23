import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { User, Mail, Briefcase, Lock, Save, Shield, CheckCircle, XCircle, Copy } from 'lucide-react';
import { updateProfile } from '../features/auth/authSlice';
import axios from 'axios';
import './Profile.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const Profile = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user, token } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    organization: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [activeTab, setActiveTab] = useState('profile');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Load user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        organization: user.organization || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleCopyTenantId = async () => {
    if (!user?.tenantId) return;

    try {
      await navigator.clipboard.writeText(user.tenantId);
      showMessage('success', t('profile.organizationCodeCopied'));
    } catch (error) {
      showMessage('error', t('profile.organizationCodeCopyError'));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await axios.patch(
        `${API_URL}/users/profile`,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          organization: formData.organization,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update Redux state
      dispatch(updateProfile(response.data.data.user));
      showMessage('success', t('profile.profileUpdated'));
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      showMessage('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (formData.newPassword !== formData.confirmPassword) {
      showMessage('error', t('profile.passwordMismatch'));
      return;
    }

    if (formData.newPassword.length < 8) {
      showMessage('error', t('profile.passwordTooShort'));
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      showMessage('error', t('profile.passwordWeak'));
      return;
    }

    setIsLoading(true);

    try {
      await axios.patch(
        `${API_URL}/auth/change-password`,
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showMessage('success', t('profile.passwordUpdated'));
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      console.error('Password update error:', error);
      const errorMessage = error.response?.data?.message || t('profile.passwordUpdated');
      showMessage('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>{t('profile.title')}</h1>
        <p className="subtitle">{t('profile.subtitle')}</p>
      </div>

      <div className="profile-container">
        <div className="profile-sidebar">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} />
            {t('profile.profileTab')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={18} />
            {t('profile.securityTab')}
          </button>
        </div>

        <div className="profile-content">
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {message.text}
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="profile-form">
              <h2>{t('profile.profileTab')}</h2>

              <div className="profile-avatar">
                <div className="avatar-circle">
                  {formData.firstName?.charAt(0)?.toUpperCase() || 'U'}{formData.lastName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="avatar-info">
                  <h3>{formData.firstName} {formData.lastName}</h3>
                  <p>{user?.email}</p>
                  <span className="role-badge">{user?.role}</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <User size={16} />
                    {t('profile.firstName')}
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <User size={16} />
                    {t('profile.lastName')}
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <Mail size={16} />
                  {t('profile.email')}
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="disabled-input"
                />
                <small>Email cannot be changed</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <Mail size={16} />
                    {t('profile.phone')}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 234 567 8900"
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Briefcase size={16} />
                    {t('profile.organization')}
                  </label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    placeholder="Company or Institution"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="user-info-box">
                <div className="info-item">
                  <span className="info-label">Role:</span>
                  <span className="info-value">{user?.role}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Account Status:</span>
                  <span className="info-value">
                    {user?.isVerified ? (
                      <span className="status-verified"><CheckCircle size={14} /> Verified</span>
                    ) : (
                      <span className="status-unverified"><XCircle size={14} /> Unverified</span>
                    )}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Member Since:</span>
                  <span className="info-value">{new Date(user?.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t('profile.organizationCode')}:</span>
                  <span className="info-value info-value-code">
                    <span>{user?.tenantId || '-'}</span>
                    {!!user?.tenantId && (
                      <button type="button" className="copy-org-btn" onClick={handleCopyTenantId}>
                        <Copy size={14} />
                        {t('profile.copyOrganizationCode')}
                      </button>
                    )}
                  </span>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={isLoading}>
                <Save size={20} />
                {isLoading ? t('profile.updating') : t('profile.updateProfile')}
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordUpdate} className="profile-form">
              <h2>{t('profile.changePassword')}</h2>
              <p className="form-description">{t('profile.passwordRequirements')}</p>

              <div className="form-group">
                <label>
                  <Lock size={16} />
                  {t('profile.currentPassword')}
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="Enter your current password"
                />
              </div>

              <div className="form-group">
                <label>
                  <Lock size={16} />
                  {t('profile.newPassword')}
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  minLength="8"
                  disabled={isLoading}
                  placeholder="Enter new password"
                />
                <small>Must be at least 8 characters with uppercase, lowercase, and numbers</small>
              </div>

              <div className="form-group">
                <label>
                  <Lock size={16} />
                  {t('profile.confirmNewPassword')}
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="Confirm new password"
                />
              </div>

              <button type="submit" className="btn-primary" disabled={isLoading}>
                <Save size={20} />
                {isLoading ? t('profile.updating') : t('profile.changePassword')}
              </button>

              <div className="security-info">
                <div className="security-header">
                  <Shield size={24} />
                  <div>
                    <h3>Two-Factor Authentication</h3>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                </div>
                <div className="security-status">
                  {user?.twoFactorEnabled ? (
                    <span className="status-enabled"><CheckCircle size={16} /> Enabled</span>
                  ) : (
                    <span className="status-disabled"><XCircle size={16} /> Disabled</span>
                  )}
                </div>
                <button type="button" className="btn-secondary" disabled>
                  {user?.twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
                  <span style={{ marginLeft: '8px', fontSize: '12px' }}>(Coming Soon)</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
