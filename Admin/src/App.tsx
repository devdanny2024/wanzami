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
import { PushNotifications } from './components/PushNotifications';
import { SupportTickets } from './components/SupportTickets';
import { ProcessManagement } from './components/ProcessManagement';
import { CreatorHub } from './components/CreatorHub';
import { CreatorSubmissions } from './components/CreatorSubmissions';
import { FilmmakerLeads } from './components/FilmmakerLeads';
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
  const [currentUser, setCurrentUser] = useState<{
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null>(null);
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
        // The session check already returns the account; keep it so the
        // sidebar can show who is actually signed in.
        try {
          const data = await res.json();
          if (data?.user) setCurrentUser(data.user);
        } catch {
          // A missing body shouldn't cost the user their session.
        }
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
    // Fresh sign-in skips the session check above, so pull the account here
    // too, otherwise the sidebar would sit blank until the next reload.
    void (async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      try {
        const res = await fetch('/api/admin/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.user) setCurrentUser(data.user);
      } catch {
        // Non-fatal: the sidebar falls back to a neutral label.
      }
    })();
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('deviceId');
    setIsLoggedIn(false);
    setCurrentUser(null);
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
      case 'notifications':
        return <PushNotifications />;
      case 'support':
        return <SupportTickets />;
      case 'processes':
        return <ProcessManagement />;
      case 'livestudio':
        return <LiveStudio />;
      case 'creatorhub':
        return <CreatorHub />;
      case 'creatorapplications':
        return <CreatorSubmissions />;
      case 'filmmakerleads':
        return <FilmmakerLeads />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--cs-paper)' }}>
      <Sidebar currentPage={currentPage} onNavigate={navigate} user={currentUser} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentPage={currentPage} onOpenSearch={() => setPaletteOpen(true)} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-8" style={{ background: 'var(--cs-paper)' }}>
          {renderPage()}
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
