import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    tenant_slug: '',
    email: '',
    password: '',
    regEmail: '',
    regPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      redirectToDashboard(user.role);
    }
  }, [isAuthenticated, user, navigate]);

  const redirectToDashboard = (role) => {
    switch (role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'hr':
        navigate('/hr');
        break;
      case 'employee':
        navigate('/employee');
        break;
      case 'student':
        navigate('/student');
        break;
      default:
        navigate('/');
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [id]: value
    }));
    setError(''); // Clear error when user starts typing
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { tenant_slug, email, password } = formData;

    if (!tenant_slug || !email || !password) {
      setError('Please fill in all fields including Organization ID');
      setLoading(false);
      return;
    }

    try {
      // console.log('Attempting login with:', { tenant_slug, email });
      const result = await login({ email, password, tenant_slug });

      if (result.success) {
        // console.log('Login successful, redirecting...');
        // The useEffect will handle the redirect automatically
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
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

    // For now, we'll show a message since we don't have registration in backend
    // You can add registration API call later
    setError('Registration feature coming soon! Please contact administrator.');
    setLoading(false);

    // alert('Registration successful! Please check your email for verification.');
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError(''); // Clear error when switching forms
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
        <div
          className={`form-wrapper glass-form ${isLogin ? 'active' : 'hidden'}`}
        >
          <h2 className="form-title">Welcome Back</h2>
          <p className="form-subtitle">Sign in to your organization</p>

          <form className="form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="tenant_slug" className="form-label">
                Organization ID
              </label>
              <input
                type="text"
                id="tenant_slug"
                placeholder="e.g. arham-it"
                className="form-input glass-input"
                value={formData.tenant_slug}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

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
                <a href="#" className="forgot-link" onClick={() => navigate('/forgot-password')}>
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

          {/*<div className="form-footer">
            <p className="footer-text">
              Are you new?{' '}
              <button 
                onClick={toggleForm}
                className="form-toggle-btn"
                disabled={loading}
              >
                Create an Account
              </button>
            </p>
          </div>*/}
        </div>

        {/* Registration Form */}
        <div
          className={`form-wrapper glass-form ${!isLogin ? 'active' : 'hidden'}`}
        >
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