import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { loginStart, loginSuccess, loginFailure, requireTwoFactor, clearError } from '../features/auth/authSlice';
import LanguageSelector from '../components/LanguageSelector';
import api from '../config/api';
import './Auth.css';

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [capsLockOn, setCapsLockOn] = useState(false);

  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { isLoading, error, twoFactorRequired } = useSelector(state => state.auth);
  const loginReady = twoFactorRequired
    ? twoFactorCode.length === 6
    : email.trim().length > 3 && password.length > 0;

  const handlePasswordKeyState = (e) => {
    setCapsLockOn(e.getModifierState && e.getModifierState('CapsLock'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      const body = { email: email.trim(), password };
      if (twoFactorRequired && twoFactorCode) body.twoFactorCode = twoFactorCode;

      const response = await fetch(api.endpoints.auth.login(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        dispatch(loginFailure(data.message || 'Login failed. Please check your credentials.'));
        return;
      }

      if (data.requiresTwoFactor && !twoFactorCode) {
        dispatch(requireTwoFactor());
        return;
      }

      if (data.status === 'success') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        dispatch(loginSuccess({
          user: data.data.user,
          token: data.token,
          refreshToken: data.refreshToken,
        }));
        navigate('/dashboard');
      } else {
        dispatch(loginFailure(data.message || 'Login failed. Please try again.'));
      }
    } catch (err) {
      console.error('Login error:', err);
      dispatch(loginFailure('Network error. Please check your connection and try again.'));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* ── Header ── */}
        <div className="auth-header">
          <div className="auth-header-top">
            <div className="auth-brand">
              <img src="/gravysyncrologo.png" alt="GravySyncro" className="auth-logo" />
              <h1>GravySyncro</h1>
            </div>
            <LanguageSelector />
          </div>
          <p className="auth-tagline">Collaborative document management</p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <h2>{twoFactorRequired ? 'Two-Factor Authentication' : t('auth.signIn')}</h2>
          <p className="form-subtitle">
            {twoFactorRequired
              ? 'Enter the 6-digit code from your authenticator app.'
              : t('auth.loginTitle')}
          </p>

          {/* Error banner */}
          {error && (
            <div className="alert alert-error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button
                type="button"
                className="alert-dismiss"
                onClick={() => dispatch(clearError())}
                aria-label="Dismiss"
              >×</button>
            </div>
          )}

          {!twoFactorRequired && (
            <>
              {/* Email */}
              <div className="form-group">
                <label htmlFor="email">{t('auth.email')}</label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="password">{t('auth.password')}</label>
                  <Link to="/forgot-password" className="label-link" tabIndex={-1}>
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <div className="input-wrapper has-action">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={handlePasswordKeyState}
                    onKeyDown={handlePasswordKeyState}
                    onBlur={() => setCapsLockOn(false)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="input-action"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {capsLockOn && (
                  <small className="text-warning">Caps Lock is on.</small>
                )}
              </div>
            </>
          )}

          {/* 2FA code */}
          {twoFactorRequired && (
            <div className="form-group">
              <label htmlFor="twoFactorCode">Authenticator Code</label>
              <div className="input-wrapper">
                <ShieldCheck size={16} className="input-icon" />
                <input
                  type="text"
                  id="twoFactorCode"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
              <small>Can't access your authenticator? <Link to="/forgot-password" className="link-inline">Reset via email</Link></small>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={isLoading || !loginReady}>
            {isLoading
              ? <><Loader2 size={16} className="spin" /> {t('auth.signingIn')}</>
              : twoFactorRequired ? 'Verify Code' : t('auth.signIn')
            }
          </button>

          <div className="auth-links">
            <span>Don't have an account?</span>
            <Link to="/register">{t('auth.createAccount')}</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
