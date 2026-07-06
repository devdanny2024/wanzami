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
import { EmailService } from './components/EmailService';
import { SupportTickets } from './components/SupportTickets';
import { ProcessManagement } from './components/ProcessManagement';
import { CreatorHub } from './components/CreatorHub';
import { LiveStudio } from './components/LiveStudio';
import { CommandPalette } from './components/CommandPalette';
import { findNav } from './lib/nav';

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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { tasks, serverJobs, removeTask, clearTasks, retryTask, retryServerJob } = useUploadQueue();

  // Lightweight deep-linking: keep the active screen in the URL hash so screens
  // are shareable and the browser back/forward buttons move between them.
  useEffect(() => {
    const applyHash = () => {
      const id = window.location.hash.replace(/^#/, '');
      if (id && findNav(id)) setCurrentPage(id);
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const navigate = (page: string) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined' && window.location.hash !== `#${page}`) {
      window.location.hash = page;
    }
  };

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
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cs-paper)' }}>
        <p className="cs-slug">Rolling… checking session</p>
      </div>
    );
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
      case 'invoices':
        return <Payments invoicesOnly />;
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
      case 'email':
        return <EmailService />;
      case 'support':
        return <SupportTickets />;
      case 'processes':
        return <ProcessManagement />;
      case 'livestudio':
        return <LiveStudio />;
      case 'creatorhub':
        return <CreatorHub />;
      default:
        return <Dashboard />;
    }
  };

  // Pages already rebuilt in the Call Sheet system render straight on paper.
  // The rest keep their dark styling inside a "lights off" well until their batch.
  const convertedPages = new Set(['dashboard', 'analytics', 'ppv', 'payments', 'invoices', 'users']);
  const isConverted = convertedPages.has(currentPage);

  return (
    <div className="flex h-screen" style={{ background: 'var(--cs-paper)' }}>
      <Sidebar currentPage={currentPage} onNavigate={navigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentPage={currentPage} onOpenSearch={() => setPaletteOpen(true)} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-8" style={{ background: 'var(--cs-paper)' }}>
          {isConverted ? (
            renderPage()
          ) : (
            <div>
              <p className="cs-slug mb-2">Lights off · this room moves to the new system in the next batch</p>
              <div className="cs-border cs-shadow bg-neutral-950 p-6">{renderPage()}</div>
            </div>
          )}
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onNavigate={navigate} />
      <UploadDock
        tasks={tasks}
        serverJobs={serverJobs}
        onRemove={removeTask}
        onClear={clearTasks}
        onRetry={retryTask}
        onRetryJob={retryServerJob}
      />
    </div>
  );
}
