import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, User, Menu, X, LogIn, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import wanzamiLogo from '../assets/logo.png';

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'py-2' : 'py-4'}`}
    >
      <div className="container-page">
        <div
          className={`relative flex items-center justify-between gap-3 rounded-2xl px-4 md:px-6 py-3 transition-all duration-500 ${
            isScrolled
              ? 'bg-ink/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50'
              : 'bg-white/5 backdrop-blur-md border border-white/10'
          }`}
        >
          {/* Logo */}
          <button onClick={() => onNavigate('home')} className="flex items-center group shrink-0" aria-label="Wanzami home">
            <Image
              src={wanzamiLogo}
              alt="Wanzami"
              className="h-7 w-auto transition-transform duration-300 group-hover:scale-105"
              width={120}
              height={32}
              priority
            />
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
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
                    isActive ? 'text-paper' : 'text-ash hover:text-paper'
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-white/10 border border-brand/50 rounded-lg"
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
              className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand/50 rounded-xl transition-all duration-300 group"
            >
              <Search className="w-5 h-5 text-ash group-hover:text-brand transition-colors" />
            </button>

            {!isAuthenticated ? (
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-3 md:px-4 h-10 rounded-xl bg-brand hover:bg-brand-dark text-ink text-sm font-semibold transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </a>
            ) : (
              <a
                href="/settings"
                aria-label="Profile & settings"
                className="hidden md:flex w-10 h-10 items-center justify-center bg-gradient-to-br from-brand to-brand-light hover:shadow-lg hover:shadow-brand/30 rounded-xl transition-all duration-300"
              >
                <User className="w-5 h-5 text-ink" />
              </a>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              className="lg:hidden w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-paper" /> : <Menu className="w-5 h-5 text-paper" />}
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
              className="lg:hidden mt-2 rounded-2xl bg-ink/98 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
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
                      className={`w-full text-left font-heading text-2xl tracking-wide px-4 py-3 rounded-xl transition-colors ${
                        isActive ? 'text-brand bg-white/5' : 'text-paper hover:bg-white/5'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-3 border-t border-white/10 flex items-center gap-2">
                <a
                  href="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-paper text-sm font-semibold transition-all"
                >
                  <Settings className="w-4 h-4" /> Settings
                </a>
                {isAuthenticated && onLogout ? (
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); onLogout(); }}
                    className="flex-1 inline-flex items-center justify-center h-11 rounded-xl bg-brand hover:bg-brand-dark text-ink text-sm font-semibold transition-all"
                  >
                    Sign Out
                  </button>
                ) : (
                  <a
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-brand hover:bg-brand-dark text-ink text-sm font-semibold transition-all"
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
