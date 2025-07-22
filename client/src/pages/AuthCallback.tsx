import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './AuthCallback.css';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleGoogleAuth = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');

      if (token) {
        try {
          localStorage.setItem('token', token);
          localStorage.setItem('autoLogin', 'true'); // Enable auto-login for Google OAuth
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Fetch user info
          const userRes = await api.get('/auth/me');
          setUser(userRes.data);

          // Redirect to home
          navigate('/', { replace: true });
        } catch (error) {
          console.error('Error processing Google auth:', error);
          navigate('/auth', { replace: true });
        }
      } else {
        // No token found, redirect to auth page
        navigate('/auth', { replace: true });
      }
    };

    handleGoogleAuth();
  }, [location, navigate, setUser]);

  return (
    <div className="auth-callback-container">
      <h2 className="auth-callback-title">Authenticating...</h2>
      <p className="auth-callback-message">Please wait while we log you in.</p>
    </div>
  );
};

export default AuthCallback;
