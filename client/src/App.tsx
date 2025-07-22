import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import AuthPage from './pages/AuthPage';
import AuthCallback from './pages/AuthCallback';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import SharedFolderView from './components/SharedFolderView';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
        }}
      >
        Loading application...
      </div>
    );
  }

  return (
    <>
      <Toaster
        toastOptions={{
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0px', // Make it square
            fontFamily: 'Geist, sans-serif',
          },
          success: {
            iconTheme: {
              primary: 'var(--accent-color)',
              secondary: 'var(--bg-primary)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--error-color)',
              secondary: 'var(--bg-primary)',
            },
          },
        }}
        position="top-center"
      />
      <ThemeToggle />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={user ? <HomePage /> : <LandingPage />} />
        <Route path="/folder/:folderId" element={user ? <HomePage /> : <Navigate to="/" />} />
        <Route path="/folder/:folderId/study" element={user ? <HomePage /> : <Navigate to="/" />} />
        <Route path="/shared/:shareId" element={<SharedFolderView />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
