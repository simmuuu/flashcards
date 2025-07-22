import React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CachedImage from '../components/CachedImage';
import './AuthPage.css';

function AuthPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }

    // Check for error parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam === 'google_auth_failed') {
      setError('Google authentication failed. Please try again.');
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, navigate]);

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setError('');

    // Create Google OAuth URL with proper parameters for account selection
    const baseUrl = 'http://192.168.0.4:5000/api/auth/google';
    const params = new URLSearchParams({
      prompt: 'select_account', // Force account selection dialog
      access_type: 'offline',
    });

    // Simple redirect to Google OAuth
    window.location.href = `${baseUrl}?${params.toString()}`;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      if (!name.trim()) {
        setError('Name is required');
        return;
      }
      const success = await register(name, email, password);
      if (!success) {
        setError('Registration failed. Please check your information.');
      }
    } else {
      const success = await login(email, password);
      if (!success) {
        setError('Login failed. Please check your credentials.');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-layout">
        <div className="auth-image">
          <CachedImage src="/auth.jpg" alt="Auth background" />
        </div>
        <div className="auth-form-container">
          <div className="auth-card">
            <div className="auth-header">
              <h1 className="auth-title">{isRegistering ? 'Create Account' : 'Welcome back'}</h1>
              <p className="auth-subtitle">
                {isRegistering ? 'Sign up to start learning with flashcards' : 'Sign in to your account to continue'}
              </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className={`input-group ${!isRegistering ? 'hidden' : ''}`}>
                <label htmlFor="name" className="input-label">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="auth-input"
                  disabled={isGoogleLoading}
                  required={isRegistering}
                />
              </div>
              <div className="input-group">
                <label htmlFor="email" className="input-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="auth-input"
                  disabled={isGoogleLoading}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="password" className="input-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="auth-input"
                  disabled={isGoogleLoading}
                  required
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="auth-btn" disabled={isGoogleLoading}>
                {isRegistering ? 'Create Account' : 'Login'}
              </button>
            </form>

            <div className="auth-divider">
              <span>OR</span>
            </div>

            <button onClick={handleGoogleLogin} className="google-btn" disabled={isGoogleLoading}>
              {isGoogleLoading ? (
                <div className="spinner"></div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M19.805 10.23c0-.68-.062-1.36-.19-2.02H10v3.84h5.48c-.23 1.24-.93 2.29-1.98 2.98v2.48h3.2c1.87-1.72 2.94-4.26 2.94-7.28z"
                    fill="#4285F4"
                  />
                  <path
                    d="M10 20c2.7 0 4.97-.89 6.63-2.42l-3.2-2.48c-.89.6-2.03.96-3.43.96-2.64 0-4.88-1.78-5.68-4.18H1.01v2.62C2.74 17.98 6.13 20 10 20z"
                    fill="#34A853"
                  />
                  <path
                    d="M4.32 12.88c-.21-.6-.33-1.24-.33-1.88s.12-1.28.33-1.88V6.5H1.01A9.98 9.98 0 0 0 0 10c0 1.64.4 3.19 1.01 4.5l3.31-2.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M10 3.96c1.47 0 2.8.51 3.84 1.51l2.88-2.88C14.97 1.13 12.7 0 10 0 6.13 0 2.74 2.02 1.01 5.5l3.31 2.62C5.12 5.74 7.36 3.96 10 3.96z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              {isGoogleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
            </button>

            <div className="auth-footer">
              {isRegistering ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="auth-link"
                    disabled={isGoogleLoading}
                    onClick={() => {
                      setIsRegistering(false);
                      setError('');
                      setName('');
                    }}
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="auth-link"
                    disabled={isGoogleLoading}
                    onClick={() => {
                      setIsRegistering(true);
                      setError('');
                    }}
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
