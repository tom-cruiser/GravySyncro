import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Lock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap
} from 'lucide-react';
import { loginStart, loginSuccess, loginFailure, requireTwoFactor, clearError } from '../features/auth/authSlice';
import LanguageSelector from '../components/LanguageSelector';
import GoogleAuthButton from '../components/GoogleAuthButton';
import api from '../config/api';
import './Auth.css';

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [twoFactorFocused, setTwoFactorFocused] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, twoFactorRequired } = useSelector(state => state.auth);
  
  const loginReady = twoFactorRequired
    ? twoFactorCode.length === 6
    : email.trim().length > 3 && password.length > 0;

  // Check for saved email
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

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
        
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email.trim());
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
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
      <Link to="/" className="auth-back-link">
        <ArrowLeft size={16} />
        Back to home
      </Link>
      <div className="noise-overlay" aria-hidden="true" />
      <div className="gradient-orb gradient-orb-1" />
      <div className="gradient-orb gradient-orb-2" />
      
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-header-top">
            <div className="auth-brand">
              <div className="brand-logo-wrapper">
                <img src="/redesign-icon.png" alt="GravySyncro" className="auth-logo" />
                <Sparkles size={14} className="brand-sparkle" />
              </div>
              <span className="auth-brand-text">GravySyncro</span>
            </div>
            <LanguageSelector />
          </div>
          <p className="auth-tagline">Collaborative document management</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-header">
            <h2 className="auth-form-title">
              {twoFactorRequired ? 'Two-Factor Authentication' : 'Welcome Back'}
            </h2>
            <p className="form-subtitle">
              {twoFactorRequired
                ? 'Enter the 6-digit code from your authenticator app.'
                : 'Sign in to access your documents and collaborate with your team.'}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="alert" role="alert">
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
              {/* Email - Fixed icon positioning */}
              <div className="form-group">
                <label htmlFor="email">
                  {t('auth.email')}
                  <span className="label-required">*</span>
                </label>
                <div className={`input-wrapper ${emailFocused ? 'focused' : ''}`}>
                  <div className="input-icon-wrapper">
                    <Mail size={18} className="input-icon" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    required
                    placeholder="your@email.com"
                    autoComplete="email"
                    disabled={isLoading}
                    className="input-with-icon"
                  />
                </div>
              </div>

              {/* Password - Fixed icon positioning */}
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="password">
                    {t('auth.password')}
                    <span className="label-required">*</span>
                  </label>
                  <Link to="/forgot-password" className="label-link" tabIndex={-1}>
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <div className={`input-wrapper has-action ${passwordFocused ? 'focused' : ''}`}>
                  <div className="input-icon-wrapper">
                    <Lock size={18} className="input-icon" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => {
                      setPasswordFocused(false);
                      setCapsLockOn(false);
                    }}
                    onKeyUp={handlePasswordKeyState}
                    onKeyDown={handlePasswordKeyState}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="input-with-icon"
                  />
                  <button
                    type="button"
                    className="input-action"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {capsLockOn && (
                  <small className="text-warning">⚠️ Caps Lock is on.</small>
                )}
              </div>

              {/* Remember Me */}
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkmark">
                    <CheckCircle2 size={14} />
                  </span>
                  Remember me
                </label>
              </div>
            </>
          )}

          {/* 2FA code - Fixed icon positioning */}
          {twoFactorRequired && (
            <div className="form-group">
              <label htmlFor="twoFactorCode">
                Authenticator Code
                <span className="label-required">*</span>
              </label>
              <div className={`input-wrapper ${twoFactorFocused ? 'focused' : ''}`}>
                <div className="input-icon-wrapper">
                  <ShieldCheck size={18} className="input-icon" />
                </div>
                <input
                  type="text"
                  id="twoFactorCode"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onFocus={() => setTwoFactorFocused(true)}
                  onBlur={() => setTwoFactorFocused(false)}
                  required
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  className="input-with-icon"
                />
              </div>
              <small>
                Can't access your authenticator?{' '}
                <Link to="/forgot-password" className="link-inline">
                  Reset via email
                </Link>
              </small>
            </div>
          )}

          <button 
            type="submit" 
            className={`btn-primary ${loginReady ? 'btn-active' : ''}`} 
            disabled={isLoading || !loginReady}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>{t('auth.signingIn')}</span>
              </>
            ) : twoFactorRequired ? (
              <>
                <span>Verify Code</span>
                <ArrowRight size={18} className="btn-arrow" />
              </>
            ) : (
              <>
                <span>{t('auth.signIn')}</span>
                <ArrowRight size={18} className="btn-arrow" />
              </>
            )}
          </button>

          {!twoFactorRequired && (
            <>
              <div className="divider">
                <span>or continue with</span>
              </div>

              <GoogleAuthButton />
            </>
          )}

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