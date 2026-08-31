import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import worklyFullLogo from '../../assets/img/workly-full-logo.png';
import './Login.css';

const ResetPassword = () => {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!password || !confirmPassword) {
            setError('Please fill in both password fields.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (!token) {
            setError('Invalid or missing reset token. Please request a new reset link.');
            return;
        }

        try {
            setLoading(true);
            const res = await authAPI.resetPassword(token, { newPassword: password });
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setSuccess(res.data.message || 'Password reset successfully!');
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Token is invalid or has expired. Please request a new reset link.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="travel-login-container">
            <div className="company-content">
                <div className="company-text">
                    <img
                        src={worklyFullLogo}
                        alt="Workly Logo"
                        style={{
                            maxWidth: '480px',
                            width: '100%',
                            height: 'auto',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
                        }}
                    />
                </div>
            </div>

            <div className="forms-container">
                {error && (
                    <div style={{ background: 'rgba(220, 38, 38, 0.9)', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', width: '100%', maxWidth: '28rem' }}>
                        {error}
                    </div>
                )}
                {success && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.9)', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', width: '100%', maxWidth: '28rem' }}>
                        {success} Redirecting to login...
                    </div>
                )}

                <div className="form-wrapper glass-form active">
                    <h2 className="form-title">Reset Your Password</h2>
                    <p className="form-subtitle">Choose a new, strong password</p>

                    <form className="form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="newPassword" className="form-label">
                                New Password
                            </label>
                            <input
                                type="password"
                                id="newPassword"
                                placeholder="Min. 6 characters"
                                className="form-input glass-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading || !!success}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                placeholder="Re-enter password"
                                className="form-input glass-input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading || !!success}
                                autoComplete="new-password"
                            />
                        </div>

                        <button
                            type="submit"
                            className="submit-btn btn-travel"
                            disabled={loading || !!success}
                        >
                            {loading ? 'RESETTING...' : 'RESET PASSWORD'}
                        </button>
                    </form>

                    <div className="form-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
                        <Link to="/login" className="forgot-link">
                            &larr; Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
