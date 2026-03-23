import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loginStart, loginSuccess, loginFailure, requireTwoFactor } from '../features/auth/authSlice';
import LanguageSelector from '../components/LanguageSelector';
import './Auth.css';

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, twoFactorRequired } = useSelector(state => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      // Build request body - only include twoFactorCode if it has a value
      const requestBody = { email, password };
      if (twoFactorCode) {
        requestBody.twoFactorCode = twoFactorCode;
      }

      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        dispatch(loginFailure(data.message || 'Login failed'));
        return;
      }

      if (data.requiresTwoFactor && !twoFactorCode) {
        dispatch(requireTwoFactor());
      } else if (data.status === 'success') {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        dispatch(loginSuccess({
          user: data.data.user,
          token: data.token,
          refreshToken: data.refreshToken,
        }));
        navigate('/dashboard');
      } else {
        dispatch(loginFailure(data.message || 'Login failed'));
      }
    } catch (err) {
      console.error('Login error:', err);
      dispatch(loginFailure('Network error. Please try again.'));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-header-top">
            <h1>GravySyncro</h1>
            <LanguageSelector />
          </div>
          <p>{t('auth.loginTitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>{t('auth.signIn')}</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              disabled={twoFactorRequired}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              disabled={twoFactorRequired}
            />
          </div>

          {twoFactorRequired && (
            <div className="form-group">
              <label htmlFor="twoFactorCode">Two-Factor Authentication Code</label>
              <input
                type="text"
                id="twoFactorCode"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                required
                placeholder="Enter 6-digit code"
                maxLength="6"
              />
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? t('auth.signingIn') : t('auth.signIn')}
          </button>

          <div className="auth-links">
            <a href="/forgot-password">{t('auth.forgotPassword')}</a>
            <span>•</span>
            <a href="/register">{t('auth.createAccount')}</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
