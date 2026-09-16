import React, { useState } from 'react';
import axios from 'axios';
import './log.css';

const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setError(''); // Clear error when user starts typing
  };

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validation
      if (!formData.email.trim() || !formData.password.trim()) {
        setError('Email and password are required');
        setLoading(false);
        return;
      }

      if (!validateEmail(formData.email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }

      // For demo purposes, accept any valid email/password combination
      // In production, this would call your backend API
      if (process.env.NODE_ENV !== 'production') {
        // Demo mode - accept login
        setSuccess('Login successful! Redirecting...');
        setFormData({ email: '', password: '' });
        
        // Store token if remember me is checked
        if (rememberMe) {
          localStorage.setItem('authToken', 'demo-token-' + Date.now());
          localStorage.setItem('userEmail', formData.email);
        } else {
          sessionStorage.setItem('authToken', 'demo-token-' + Date.now());
        }

        // Call onLogin callback
        setTimeout(() => {
          if (onLogin) onLogin();
        }, 1500);
        return;
      }

      // Make API call to backend
      const response = await axios.post(
        'http://localhost:5000/api/auth/login', // Update with your backend URL
        {
          email: formData.email,
          password: formData.password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Store token if remember me is checked
      if (rememberMe) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userEmail', formData.email);
      } else {
        sessionStorage.setItem('authToken', response.data.token);
      }

      setSuccess('Login successful! Redirecting...');
      setFormData({ email: '', password: '' });

      // Call onLogin callback or redirect
      setTimeout(() => {
        if (onLogin) {
          onLogin();
        } else {
          window.location.href = '/dashboard';
        }
      }, 1500);
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || 'Login failed. Please try again.');
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSuccess('Password reset link sent to your email!');
    // Implement password reset API call here
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>HerbVisionAI</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Email Input */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="forgot-password-btn"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              Forgot password?
            </button>
          </div>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Success Message */}
          {success && <div className="success-message">{success}</div>}

          {/* Submit Button */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="signup-link">
          <p>Don't have an account? <a href="/signup">Sign up here</a></p>
        </div>

        {/* Divider */}
        <div className="divider">
          <span>Or continue with</span>
        </div>

        {/* Social Login */}
        <div className="social-login">
          <button type="button" className="social-button google" disabled={loading}>
            <span>🔵</span> Google
          </button>
          <button type="button" className="social-button github" disabled={loading}>
            <span>⚫</span> GitHub
          </button>
        </div>
      </div>

      {/* Background decoration */}
      <div className="background-decoration"></div>
    </div>
  );
};

export default LoginPage;
