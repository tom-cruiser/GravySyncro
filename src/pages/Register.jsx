import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, Hash, AlertCircle, Loader2 } from 'lucide-react';
import { registerStart, registerSuccess, registerFailure, clearError } from '../features/auth/authSlice';
import api from '../config/api';
import LanguageSelector from '../components/LanguageSelector';
import './Auth.css';

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    tenantId: '',
    password: '',
    confirmPassword: '',
    role: 'Student',
  });
  const [showPassword, setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [clientError, setClientError]          = useState('');
  const [capsLockPassword, setCapsLockPassword] = useState(false);
  const [capsLockConfirmPassword, setCapsLockConfirmPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector(state => state.auth);

  const roles = ['Student', 'Notary', 'Teacher', 'Lawyer', 'Professional'];

  const trackCapsLock = (setter) => (e) => {
    setter(e.getModifierState && e.getModifierState('CapsLock'));
  };

  const handleChange = (e) => {
    setClientError('');
    dispatch(clearError());
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClientError('');

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setClientError('Passwords do not match.');
      return;
    }
    if (!PASSWORD_RE.test(formData.password)) {
      setClientError('Password must be at least 8 characters and include uppercase, lowercase, and a number.');
      return;
    }

    dispatch(registerStart());

    try {
      const response = await fetch(api.endpoints.auth.register(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          tenantId: formData.tenantId?.trim() || undefined,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        dispatch(registerFailure(data.message || 'Registration failed. Please try again.'));
        return;
      }

      if (data.status === 'success') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        dispatch(registerSuccess({
          user: data.data.user,
          token: data.token,
          refreshToken: data.refreshToken,
        }));
        navigate('/dashboard');
      } else {
        dispatch(registerFailure(data.message || 'Registration failed. Please try again.'));
      }
    } catch (err) {
      console.error('Registration error:', err);
      dispatch(registerFailure('Network error. Please check your connection and try again.'));
    }
  };

  const displayError = clientError || error;
  const passwordStrength = () => {
    const p = formData.password;
    if (!p) return null;
    if (p.length < 6) return 'weak';
    if (p.length < 8 || !/[A-Z]/.test(p) || !/\d/.test(p)) return 'fair';
    if (PASSWORD_RE.test(p)) return 'strong';
    return 'fair';
  };
  const strength = passwordStrength();
  const registerReady =
    formData.firstName.trim().length > 0
    && formData.lastName.trim().length > 0
    && formData.email.trim().length > 5
    && formData.password.length > 0
    && formData.confirmPassword.length > 0
    && formData.password === formData.confirmPassword
    && PASSWORD_RE.test(formData.password);

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-wide">

        {/* ── Header ── */}
        <div className="auth-header">
          <div className="auth-header-top auth-header-center-stack">
            <div className="auth-brand auth-brand-center">
              <img src="/gravysyncrologo.png" alt="GravySyncro" className="auth-logo" />
              <h1>GravySyncro</h1>
            </div>
            <LanguageSelector />
          </div>
          <p className="auth-tagline">Create your free account</p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <h2>Sign Up</h2>
          <p className="form-subtitle">Join thousands of teams collaborating on documents.</p>

          {/* Error banner */}
          {displayError && (
            <div className="alert alert-error" role="alert">
              <AlertCircle size={16} />
              <span>{displayError}</span>
              <button
                type="button"
                className="alert-dismiss"
                onClick={() => { setClientError(''); dispatch(clearError()); }}
                aria-label="Dismiss"
              >×</button>
            </div>
          )}

          {/* Name row */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <div className="input-wrapper">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="John"
                  autoComplete="given-name"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <div className="input-wrapper">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Doe"
                  autoComplete="family-name"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Role */}
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <div className="input-wrapper">
              <Briefcase size={16} className="input-icon" />
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                disabled={isLoading}
              >
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Org code */}
          <div className="form-group">
            <label htmlFor="tenantId">Organization Code <span className="label-optional">(optional)</span></label>
            <div className="input-wrapper">
              <Hash size={16} className="input-icon" />
              <input
                type="text"
                id="tenantId"
                name="tenantId"
                value={formData.tenantId}
                onChange={handleChange}
                placeholder="e.g. tenant_abc123"
                disabled={isLoading}
              />
            </div>
            <small>Share the same code as your teammates to join their organization.</small>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper has-action">
              <Lock size={16} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onKeyUp={trackCapsLock(setCapsLockPassword)}
                onKeyDown={trackCapsLock(setCapsLockPassword)}
                onBlur={() => setCapsLockPassword(false)}
                required
                placeholder="••••••••"
                autoComplete="new-password"
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
            {capsLockPassword && (
              <small className="text-warning">Caps Lock is on.</small>
            )}
            {/* Strength indicator */}
            {strength && (
              <div className="password-strength">
                <div className={`strength-bar strength-${strength}`} />
                <span className={`strength-label strength-${strength}`}>
                  {strength === 'weak' ? 'Weak' : strength === 'fair' ? 'Fair' : 'Strong'}
                </span>
              </div>
            )}
            <small>Min. 8 characters with uppercase, lowercase, and a number.</small>
          </div>

          {/* Confirm password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper has-action">
              <Lock size={16} className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onKeyUp={trackCapsLock(setCapsLockConfirmPassword)}
                onKeyDown={trackCapsLock(setCapsLockConfirmPassword)}
                onBlur={() => setCapsLockConfirmPassword(false)}
                required
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="input-action"
                onClick={() => setShowConfirmPassword(v => !v)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {capsLockConfirmPassword && (
              <small className="text-warning">Caps Lock is on.</small>
            )}
            {/* Match indicator */}
            {formData.confirmPassword && (
              <small className={formData.password === formData.confirmPassword ? 'text-success' : 'text-error'}>
                {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </small>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading || !registerReady}>
            {isLoading
              ? <><Loader2 size={16} className="spin" /> Creating Account…</>
              : 'Create Account'
            }
          </button>

          <div className="auth-links">
            <span>Already have an account?</span>
            <Link to="/login">Sign In</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
