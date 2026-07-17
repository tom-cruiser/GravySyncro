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
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap
} from 'lucide-react';
import { loginStart, loginSuccess, loginFailure, requireTwoFactor, clearError } from '../features/auth/authSlice';
import LanguageSelector from '../components/LanguageSelector';
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
      <div className="noise-overlay" aria-hidden="true" />
      <div className="gradient-orb gradient-orb-1" />
      <div className="gradient-orb gradient-orb-2" />
      
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-header-top">
            <div className="auth-brand">
              <div className="brand-logo-wrapper">
                <img src="/gravysyncrologo.png" alt="GravySyncro" className="auth-logo" />
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

              <div className="social-buttons">
                <button type="button" className="btn-social" onClick={() => {}}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31027 0 3.25527 2.69 1.28027 6.60998L5.27027 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" />
                    <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" />
                    <path d="M5.26498 14.295C5.02498 13.565 4.88501 12.795 4.88501 12C4.88501 11.205 5.01998 10.435 5.26498 9.705L1.275 6.60999C0.46 8.23 0 10.06 0 12C0 13.94 0.46 15.77 1.28 17.39L5.26498 14.295Z" />
                    <path d="M5.27 17.39L1.28 20.485C3.255 24.405 7.31 27.09 12 27.09C15.235 27.09 17.94 26.045 19.945 24.255L16.08 21.255C15.005 21.985 13.615 22.4 12 22.4C8.87 22.4 6.215 20.29 5.27 17.39Z" />
                  </svg>
                  Google
                </button>
                <button type="button" className="btn-social" onClick={() => {}}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.001 2C6.477 2 2 6.477 2 12C2 16.991 5.657 21.128 10.438 21.879V14.89H7.902V12H10.438V9.797C10.438 7.291 11.93 5.907 14.215 5.907C15.309 5.907 16.453 6.102 16.453 6.102V8.562H15.193C13.95 8.562 13.564 9.333 13.564 10.124V12H16.336L15.893 14.89H13.564V21.879C18.343 21.129 22 16.99 22 12C22 6.477 17.523 2 12.001 2Z" />
                  </svg>
                  GitHub
                </button>
              </div>
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