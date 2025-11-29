import { useEffect, useState } from 'react';
import { AdminLogin } from './components/AdminLogin';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { MoviesManagement } from './components/MoviesManagement';
import { SeriesManagement } from './components/SeriesManagement';
import { PPVManagement } from './components/PPVManagement';
import { BlogManagement } from './components/BlogManagement';
import { UserManagement } from './components/UserManagement';
import { Payments } from './components/Payments';
import { Moderation } from './components/Moderation';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { TeamManagement } from './components/TeamManagement';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const verify = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        setCheckingSession(false);
        return;
      }
      const res = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('deviceId');
        setIsLoggedIn(false);
      }
      setCheckingSession(false);
    };
    verify();
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('deviceId');
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
  };

  if (checkingSession) {
    return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">Checking session...</div>;
  }

  if (!isLoggedIn) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'movies':
        return <MoviesManagement />;
      case 'series':
        return <SeriesManagement />;
      case 'ppv':
        return <PPVManagement />;
      case 'blog':
        return <BlogManagement />;
      case 'users':
        return <UserManagement />;
      case 'payments':
        return <Payments />;
      case 'moderation':
        return <Moderation />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      case 'team':
        return <TeamManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
