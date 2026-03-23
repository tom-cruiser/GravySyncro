import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { registerStart, registerSuccess, registerFailure } from '../features/auth/authSlice';
import './Auth.css';

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

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector(state => state.auth);

  const roles = ['Student', 'Notary', 'Teacher', 'Lawyer', 'Professional'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      dispatch(registerFailure('Passwords do not match'));
      return;
    }

    if (formData.password.length < 8) {
      dispatch(registerFailure('Password must be at least 8 characters'));
      return;
    }

    dispatch(registerStart());

    try {
      const response = await fetch('/api/v1/auth/register', {
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
        dispatch(registerFailure(data.message || 'Registration failed'));
        return;
      }

      if (data.status === 'success') {
        // Store tokens
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        dispatch(registerSuccess({
          user: data.data.user,
          token: data.token,
          refreshToken: data.refreshToken,
        }));
        navigate('/dashboard');
      } else {
        dispatch(registerFailure(data.message || 'Registration failed'));
      }
    } catch (err) {
      console.error('Registration error:', err);
      dispatch(registerFailure('Network error. Please try again.'));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>GravySyncro</h1>
          <p>Create Your Account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Sign Up</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="John"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tenantId">Organization Code (optional)</label>
            <input
              type="text"
              id="tenantId"
              name="tenantId"
              value={formData.tenantId}
              onChange={handleChange}
              placeholder="Example: tenant_abc123"
            />
            <small>Use the same code as your teammate to join the same organization.</small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              minLength="8"
            />
            <small>Minimum 8 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="auth-links">
            <span>Already have an account?</span>
            <a href="/login">Sign In</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
