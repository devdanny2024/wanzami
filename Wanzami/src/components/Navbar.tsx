import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, User, Menu, X, LogIn, Power } from 'lucide-react';
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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', page: 'home', href: '/' },
    { label: 'Movies', page: 'movies', href: '/movies' },
    { label: 'Series', page: 'series', href: '/series' },
    { label: 'My Movies', page: 'mymovies', href: '/mymovies' },
    { label: 'My List', page: 'mylist', href: '/mylist' },
  ];

  return (
    <>
      {/* Floating Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'py-2'
            : 'py-4'
        }`}
      >
        <div className="max-w-[95%] mx-auto">
          <div className={`relative flex items-center justify-between px-4 md:px-8 py-4 transition-all duration-500 ${
            isScrolled
              ? 'bg-[#0b0b0c]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50'
              : 'bg-white/5 backdrop-blur-md border border-white/5'
          } rounded-2xl`}>
            {/* Logo */}
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 group"
            >
              <Image
                src={wanzamiLogo}
                alt="Wanzami"
                className="transition-transform duration-300 group-hover:scale-105"
                width={120}
                height={32}
                priority
              />
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = currentPage === item.page;
                
                return (
                  <Link
                    key={item.page}
                    href={item.href}
                    onClick={() => onNavigate(item.page)}
                    className={`relative px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="relative z-10">{item.label}</span>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-white/10 border border-[#fd7e14]/50 rounded-lg"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    
                    {/* Orange underline on hover */}
                    {!isActive && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#fd7e14] group-hover:w-1/2 transition-all duration-300" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Login CTA */}
              {!isAuthenticated && (
                <a
                  href="/login"
                  className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm font-semibold transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </a>
              )}

              {/* Logout */}
              {isAuthenticated && onLogout && (
                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-[#fd7e14] text-white text-sm font-semibold border border-[#fd7e14]/70 hover:bg-[#ff9f4d] transition-all"
                >
                  Sign Out
                </button>
              )}

              {/* Search */}
              <div className="relative">
                <button
                  onClick={() => onNavigate('search')}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#fd7e14]/50 rounded-xl transition-all duration-300 group"
                >
                  <Search className="w-5 h-5 text-gray-400 group-hover:text-[#fd7e14] transition-colors" />
                </button>
                {/* slight offset down */}
                <div className="absolute left-1/2 -translate-x-1/2 mt-3 h-1" />
              </div>

              {/* Profile (unchanged behavior) */}
              <button
                onClick={() => onNavigate('settings')}
                className="hidden md:flex w-10 h-10 items-center justify-center bg-gradient-to-br from-[#fd7e14] to-[#ff9f4d] hover:shadow-lg hover:shadow-[#fd7e14]/30 rounded-xl transition-all duration-300 group"
              >
                <User className="w-5 h-5 text-white" />
              </button>

              {/* Settings link */}
              <a
                href="/settings"
                className="hidden md:inline-flex items-center px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm font-semibold transition-all"
              >
                Settings
              </a>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile navigation pills */}
          <div className="mt-3 mb-1 flex lg:hidden items-center gap-2 overflow-x-auto scrollbar-hide px-1">
            {navItems.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.page}
                  type="button"
                  onClick={() => onNavigate(item.page)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#fd7e14] text-white"
                      : "bg-white/5 text-gray-300 border border-white/10"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-[88px] left-4 right-4 z-[60] lg:hidden"
          >
            <div className="bg-[#0b0b0c]/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = currentPage === item.page;
                  
                  return (
                    <Link
                      key={item.page}
                      href={item.href}
                      onClick={() => {
                        onNavigate(item.page);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-[#fd7e14]/20 border border-[#fd7e14] text-white'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                
                <hr className="border-white/10 my-2" />
                
                <a
                  href="/settings"
                  className="block w-full text-left px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Settings
                </a>
                {!isAuthenticated && (
                  <a
                    href="/login"
                    className="w-full text-left px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all inline-flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </a>
                )}
                
                {isAuthenticated && onLogout && (
                  <button
                    onClick={() => {
                      onLogout?.();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all inline-flex items-center gap-2"
                  >
                    <Power className="w-4 h-4" />
                    Sign Out
                  </button>
                )}
                <a
                  href="/settings"
                  className="block w-full text-left px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Settings
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
