import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    regEmail: '',
    regPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = (userData) => {
   const position = (userData?.position || '').toLowerCase();
    
    
    if (position === 'admin') {
    
      return '/admin';
    }
  
    return '/dashboard';
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [id]: value
    }));
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { email, password } = formData;

    if (!email || !password) {
      setError('Please enter your email and password');
      setLoading(false);
      return;
    }

    try {
      const result = await login({ email, password });

      if (result.success) {
        const dashboardPath = getDashboardPath(result.user);
        
        navigate(dashboardPath);
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { regEmail, regPassword, confirmPassword } = formData;

    if (regPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    setError('Registration feature coming soon! Please contact administrator.');
    setLoading(false);
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="travel-login-container">
      {/* Left Side - Company Content */}
      <div className="company-content">
        <div className="company-text">
          <h1 className="company-title">WORK DESK</h1>
          <div className="company-quote">
            <p className="quote-text">Multi-Tenant Workforce Management</p>
          </div>
        </div>
      </div>

      {/* Right Side - Forms */}
      <div className="forms-container">
        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(220, 38, 38, 0.9)',
            color: 'white',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            textAlign: 'center',
            width: '100%',
            maxWidth: '28rem'
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <div className={`form-wrapper ${isLogin ? 'active' : 'hidden'}`}>
          <h2 className="form-title">Welcome Back</h2>
          <p className="form-subtitle">Sign in to your organization</p>

          <form className="form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                className="form-input glass-input"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <div className="password-header">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <a href="#" className="forgot-link" onClick={(e) => {
                  e.preventDefault();
                  navigate('/forgot-password');
                }}>
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                id="password"
                placeholder="********"
                className="form-input glass-input"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="submit-btn btn-travel"
              disabled={loading}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>
        </div>

        {/* Registration Form */}
        <div className={`form-wrapper ${!isLogin ? 'active' : 'hidden'}`}>
          <h2 className="form-title">Create Account</h2>
          <p className="form-subtitle">Join us to start your journey</p>

          <form className="form" onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label htmlFor="regEmail" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="regEmail"
                placeholder="Enter your email"
                className="form-input glass-input"
                value={formData.regEmail}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="regPassword" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="regPassword"
                placeholder="********"
                className="form-input glass-input"
                value={formData.regPassword}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="********"
                className="form-input glass-input"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="submit-btn btn-travel"
              disabled={loading}
            >
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="form-footer">
            <p className="footer-text">
              Already have an account?{' '}
              <button
                onClick={toggleForm}
                className="form-toggle-btn"
                disabled={loading}
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
