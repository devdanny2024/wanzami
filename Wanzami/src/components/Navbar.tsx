import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, User, Menu, X, LogIn, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  isAuthenticated?: boolean;
}

export function Navbar({
  currentPage,
  onNavigate,
  onLogout,
  isAuthenticated = false,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Close the desktop profile dropdown on outside click
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isProfileMenuOpen]);

  const navItems = [
    { label: 'Home', page: 'home', href: '/' },
    { label: 'Live', page: 'live', href: '/live' },
    { label: 'Movies', page: 'movies', href: '/movies' },
    { label: 'Series', page: 'series', href: '/series' },
    { label: 'My Movies', page: 'mymovies', href: '/mymovies' },
    { label: 'My List', page: 'mylist', href: '/mylist' },
    { label: 'Help', page: 'contact', href: '/contact' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 bg-cs-paper border-b-[3px] border-cs-ink transition-shadow duration-300 ${
        isScrolled ? 'cs-shadow-sm' : ''
      }`}
    >
      <div className="container-page">
        <div className="relative flex items-center justify-between gap-3 py-3">
          {/* Wordmark — production office */}
          <button
            onClick={() => onNavigate('home')}
            className="flex flex-col items-start leading-none shrink-0"
            aria-label="Wanzami home"
          >
            <span className="font-heading text-2xl md:text-3xl tracking-wide text-cs-ink">WANZAMI</span>
            <span className="hidden sm:block font-mono text-[9px] uppercase tracking-[0.2em] text-cs-muted -mt-0.5">
              Production Office
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <Link
                  key={item.page}
                  href={item.href}
                  onClick={() => onNavigate(item.page)}
                  className={`relative px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.09em] transition-colors ${
                    isActive ? 'text-cs-ink' : 'text-cs-muted hover:text-cs-ink'
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-3 right-3 bottom-1 h-[3px] bg-cs-rust"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button
              onClick={() => onNavigate('search')}
              aria-label="Search"
              className="w-10 h-10 flex items-center justify-center bg-cs-paper cs-border-thin hover:bg-cs-panel transition-colors"
            >
              <Search className="w-5 h-5 text-cs-ink" />
            </button>

            {!isAuthenticated ? (
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-3 md:px-4 h-10 bg-cs-ink text-cs-paper font-mono text-xs font-bold uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </a>
            ) : (
              <div className="relative hidden md:block" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((v) => !v)}
                  aria-label="Profile menu"
                  aria-expanded={isProfileMenuOpen}
                  className="w-10 h-10 flex items-center justify-center bg-brand cs-border-thin transition-transform hover:-translate-y-0.5"
                >
                  <User className="w-5 h-5 text-cs-ink" />
                </button>

                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-48 bg-cs-paper cs-border cs-shadow overflow-hidden"
                    >
                      <a
                        href="/settings"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2 h-11 px-4 font-mono text-xs font-bold uppercase tracking-[0.08em] text-cs-ink hover:bg-cs-panel transition-colors"
                      >
                        <Settings className="w-4 h-4" /> Settings
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout?.();
                        }}
                        className="w-full flex items-center gap-2 h-11 px-4 font-mono text-xs font-bold uppercase tracking-[0.08em] text-cs-ink border-t-[1.5px] border-cs-ink hover:bg-cs-panel transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              className="lg:hidden w-10 h-10 flex items-center justify-center bg-cs-paper cs-border-thin hover:bg-cs-panel transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-cs-ink" /> : <Menu className="w-5 h-5 text-cs-ink" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown panel */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden mb-3 bg-cs-paper cs-border cs-shadow overflow-hidden"
            >
              <div className="p-2">
                {navItems.map((item) => {
                  const isActive = currentPage === item.page;
                  return (
                    <button
                      key={item.page}
                      type="button"
                      onClick={() => {
                        onNavigate(item.page);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left font-heading text-2xl tracking-wide px-4 py-3 transition-colors ${
                        isActive ? 'text-cs-rust bg-cs-panel' : 'text-cs-ink hover:bg-cs-panel'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-3 border-t-[1.5px] border-cs-ink flex items-center gap-2">
                <a
                  href="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-11 bg-cs-paper cs-border-thin text-cs-ink font-mono text-xs font-bold uppercase tracking-[0.08em] transition-colors hover:bg-cs-panel"
                >
                  <Settings className="w-4 h-4" /> Settings
                </a>
                {isAuthenticated && onLogout ? (
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); onLogout(); }}
                    className="flex-1 inline-flex items-center justify-center h-11 bg-cs-ink text-cs-paper font-mono text-xs font-bold uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5"
                  >
                    Sign Out
                  </button>
                ) : (
                  <a
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-11 bg-cs-ink text-cs-paper font-mono text-xs font-bold uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5"
                  >
                    <LogIn className="w-4 h-4" /> Login
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
