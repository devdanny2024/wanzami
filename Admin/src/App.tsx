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
import { UploadDock } from './components/UploadDock';
import { UploadQueueProvider, useUploadQueue } from './context/UploadQueueProvider';
import { Logs } from './components/Logs';

export default function App() {
  return (
    <UploadQueueProvider>
      <AppContent />
    </UploadQueueProvider>
  );
}

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { tasks, removeTask, clearTasks } = useUploadQueue();

  useEffect(() => {
    const verify = async () => {
      if (typeof window === 'undefined') {
        setCheckingSession(false);
        return;
      }

      const token = localStorage.getItem('accessToken');

      // If there are active uploads in the queue, avoid forcing a logout
      // when the access token has expired. This keeps the admin shell and
      // upload dock visible so in-flight uploads can finish.
      let hasActiveUploads = false;
      try {
        const raw = window.localStorage.getItem('wanzami-upload-queue');
        if (raw) {
          const saved = JSON.parse(raw) as Array<{ status?: string }>;
          hasActiveUploads = saved.some(
            (t) =>
              t.status === 'pending' ||
              t.status === 'uploading' ||
              t.status === 'processing',
          );
        }
      } catch {
        // ignore queue parsing errors
      }

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
        if (!hasActiveUploads) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('deviceId');
          setIsLoggedIn(false);
        } else {
          // Keep the shell active; uploads may still be running.
          setIsLoggedIn(true);
        }
      }
      setCheckingSession(false);
    };
    void verify();
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
      case 'logs':
        return <Logs />;
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
      <UploadDock tasks={tasks} onRemove={removeTask} onClear={clearTasks} />
    </div>
  );
}
