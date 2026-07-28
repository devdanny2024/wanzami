'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, User, Menu, X, LogIn, Settings, LogOut, ChevronDown, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchCategories, type BlogCategory } from '@/lib/blogClient';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  isAuthenticated?: boolean;
}

type NavItem = {
  key: string;
  label: string;
  href: string;
  /** Only app routes round-trip through onNavigate; blog links are plain hrefs. */
  page?: string;
  active: boolean;
};

/** How many category chips fit in the desktop bar before they move under "More". */
const MAX_INLINE_CATEGORIES = 3;

const categoryItem = (c: BlogCategory, activeSlug: string): NavItem => ({
  key: `cat-${c.slug}`,
  label: c.name,
  href: `/blog/category/${c.slug}`,
  active: activeSlug === c.slug,
});

export function Navbar({
  currentPage,
  onNavigate,
  onLogout,
  isAuthenticated = false,
}: NavbarProps) {
  const pathname = usePathname();
  const path = pathname ?? '';
  const isBlogRoute = path.startsWith('/blog');

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  // The app shell passes isAuthenticated statically, but /blog and /contact are
  // public, so an anonymous reader can reach this navbar. Confirm against stored
  // credentials before showing anything that needs an account.
  const [hasSession, setHasSession] = useState<boolean>(() => {
    if (typeof window === 'undefined') return isAuthenticated;
    return Boolean(
      window.localStorage.getItem('accessToken') || window.localStorage.getItem('refreshToken')
    );
  });

  useEffect(() => {
    const read = () =>
      setHasSession(
        Boolean(localStorage.getItem('accessToken') || localStorage.getItem('refreshToken'))
      );
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, [path]);

  const isSignedIn = isAuthenticated && hasSession;

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

  // Close the overflow-categories dropdown on outside click
  useEffect(() => {
    if (!isMoreMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMoreMenuOpen]);

  // Categories only matter on the blog, so only pay for them there.
  useEffect(() => {
    if (!isBlogRoute) return;
    let cancelled = false;
    void fetchCategories().then((cats) => {
      if (cancelled) return;
      setCategories(cats.filter((c) => (c.postCount ?? 0) > 0));
    });
    return () => { cancelled = true; };
  }, [isBlogRoute]);

  const activeCategorySlug = path.startsWith('/blog/category/')
    ? decodeURIComponent(path.slice('/blog/category/'.length).split('/')[0] ?? '')
    : '';

  const storiesActive = path === '/blog' || path.startsWith('/blog/post');
  const blogSearchActive = path.startsWith('/blog/search');

  const appNavItems = useMemo<NavItem[]>(() => {
    // A signed-out visitor only ever sees this navbar on the public routes
    // (/blog, /contact) — every catalogue link would redirect them to /splash,
    // so offer only the destinations they can actually open.
    if (!isSignedIn) {
      return [
        { key: 'stories', label: 'Stories', href: '/blog', active: storiesActive },
        { key: 'contact', label: 'Help', page: 'contact', href: '/contact', active: currentPage === 'contact' },
      ];
    }
    const items: NavItem[] = [
      { key: 'home', label: 'Home', page: 'home', href: '/', active: currentPage === 'home' },
      { key: 'live', label: 'Live', page: 'live', href: '/live', active: currentPage === 'live' },
      { key: 'movies', label: 'Movies', page: 'movies', href: '/movies', active: currentPage === 'movies' },
      { key: 'series', label: 'Series', page: 'series', href: '/series', active: currentPage === 'series' },
    ];
    // Member-only shelves. Rendering these to a signed-out visitor sends them
    // straight into the auth gate, which is a dead end on any public route.
    items.push(
      { key: 'mymovies', label: 'My Movies', page: 'mymovies', href: '/mymovies', active: currentPage === 'mymovies' },
      { key: 'mylist', label: 'My List', page: 'mylist', href: '/mylist', active: currentPage === 'mylist' },
      { key: 'contact', label: 'Help', page: 'contact', href: '/contact', active: currentPage === 'contact' }
    );
    return items;
  }, [currentPage, isSignedIn, storiesActive]);

  // Keep the active category visible even when it sits past the inline cap.
  const inlineCategories = useMemo(() => {
    const head = categories.slice(0, MAX_INLINE_CATEGORIES);
    if (!activeCategorySlug || head.some((c) => c.slug === activeCategorySlug)) return head;
    const active = categories.find((c) => c.slug === activeCategorySlug);
    if (!active) return head;
    return [...head.slice(0, MAX_INLINE_CATEGORIES - 1), active];
  }, [categories, activeCategorySlug]);

  const overflowCategories = useMemo(
    () => categories.filter((c) => !inlineCategories.some((i) => i.slug === c.slug)),
    [categories, inlineCategories]
  );

  const blogNavItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [];
    // Signed-in readers still need a door back into the catalogue.
    if (isSignedIn) {
      items.push({ key: 'home', label: 'Watch', page: 'home', href: '/', active: false });
    }
    items.push({ key: 'stories', label: 'Stories', href: '/blog', active: storiesActive });
    items.push(...inlineCategories.map((c) => categoryItem(c, activeCategorySlug)));
    return items;
  }, [isSignedIn, storiesActive, inlineCategories, activeCategorySlug]);

  const blogTailItems = useMemo<NavItem[]>(
    () => [
      { key: 'blogsearch', label: 'Search', href: '/blog/search', active: blogSearchActive },
      { key: 'contact', label: 'Help', page: 'contact', href: '/contact', active: currentPage === 'contact' },
    ],
    [blogSearchActive, currentPage]
  );

  // Everything the mobile sheet lists, flattened (all categories, no overflow menu).
  const mobileItems: NavItem[] = isBlogRoute
    ? [
        ...(isSignedIn ? [{ key: 'home', label: 'Watch', page: 'home', href: '/', active: false }] : []),
        { key: 'stories', label: 'All stories', href: '/blog', active: storiesActive },
        ...categories.map((c) => categoryItem(c, activeCategorySlug)),
        { key: 'blogsearch', label: 'Search stories', href: '/blog/search', active: blogSearchActive },
        { key: 'contact', label: 'Help', page: 'contact', href: '/contact', active: currentPage === 'contact' },
      ]
    : appNavItems;

  const desktopItems = isBlogRoute ? blogNavItems : appNavItems;

  // Anonymous readers must never be handed a link that bounces to /splash.
  const wordmarkHref = isSignedIn ? '/' : '/blog';
  // Catalogue search is behind the auth gate, so signed-out visitors get story search.
  const searchesStories = isBlogRoute || !isSignedIn;
  const searchHref = searchesStories ? '/blog/search' : '/search';

  const linkClass = (active: boolean) =>
    `relative px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.09em] transition-colors ${
      active ? 'text-cs-ink' : 'text-cs-muted hover:text-cs-ink'
    }`;

  const renderDesktopLink = (item: NavItem) => (
    <Link
      key={item.key}
      href={item.href}
      onClick={() => { if (item.page) onNavigate(item.page); }}
      className={linkClass(item.active)}
    >
      <span className="relative z-10">{item.label}</span>
      {item.active && (
        <motion.div
          layoutId="activeNav"
          className="absolute left-3 right-3 bottom-1 h-[3px] bg-cs-rust"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
    </Link>
  );

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
          <Link
            href={wordmarkHref}
            className="flex flex-col items-start leading-none shrink-0"
            aria-label={wordmarkHref === '/blog' ? 'Wanzami stories' : 'Wanzami home'}
          >
            <span className="font-heading text-2xl md:text-3xl tracking-wide text-cs-ink">WANZAMI</span>
            <span className="hidden sm:block font-mono text-[9px] uppercase tracking-[0.2em] text-cs-muted -mt-0.5">
              {isBlogRoute ? 'The Story Desk' : 'Production Office'}
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {desktopItems.map(renderDesktopLink)}

            {isBlogRoute && overflowCategories.length > 0 && (
              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen((v) => !v)}
                  aria-expanded={isMoreMenuOpen}
                  aria-label="More story categories"
                  className={`${linkClass(false)} inline-flex items-center gap-1`}
                >
                  More
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isMoreMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-11 z-50 w-56 max-h-[60vh] overflow-y-auto bg-cs-paper cs-border cs-shadow"
                    >
                      {overflowCategories.map((c) => (
                        <Link
                          key={c.slug}
                          href={`/blog/category/${c.slug}`}
                          onClick={() => setIsMoreMenuOpen(false)}
                          className="flex items-center justify-between gap-3 min-h-[44px] px-4 font-mono text-xs font-bold uppercase tracking-[0.08em] text-cs-ink border-b-[1.5px] border-cs-line last:border-b-0 hover:bg-cs-panel transition-colors"
                        >
                          <span>{c.name}</span>
                          <span className="text-cs-muted">{c.postCount ?? 0}</span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {isBlogRoute && blogTailItems.map(renderDesktopLink)}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <Link
              href={searchHref}
              aria-label={searchesStories ? 'Search stories' : 'Search'}
              className="w-11 h-11 md:w-10 md:h-10 flex items-center justify-center bg-cs-paper cs-border-thin hover:bg-cs-panel transition-colors"
            >
              <Search className="w-5 h-5 text-cs-ink" />
            </Link>

            {!isSignedIn ? (
              <>
                <a
                  href="/login"
                  className="hidden md:inline-flex items-center h-10 px-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-cs-muted hover:text-cs-ink transition-colors"
                >
                  Log in
                </a>
                <a
                  href="/register"
                  className="inline-flex items-center gap-2 px-3 md:px-4 h-11 md:h-10 bg-cs-ink text-cs-paper font-mono text-xs font-bold uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5"
                >
                  <Ticket className="w-4 h-4" />
                  <span className="hidden sm:inline">Start free</span>
                  <span className="sm:hidden">Join</span>
                </a>
              </>
            ) : (
              <div className="relative hidden md:block" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((v) => !v)}
                  aria-label="Profile menu"
                  aria-expanded={isProfileMenuOpen}
                  className="w-11 h-11 md:w-10 md:h-10 flex items-center justify-center bg-brand cs-border-thin transition-transform hover:-translate-y-0.5"
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
              className="lg:hidden w-11 h-11 md:w-10 md:h-10 flex items-center justify-center bg-cs-paper cs-border-thin hover:bg-cs-panel transition-colors"
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
              {isBlogRoute && (
                <p className="px-4 pt-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cs-muted">
                  The Story Desk
                </p>
              )}

              <div className="p-2 max-h-[55vh] overflow-y-auto">
                {mobileItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => {
                      if (item.page) onNavigate(item.page);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left font-heading text-2xl tracking-wide px-4 py-3 min-h-[44px] transition-colors ${
                      item.active ? 'text-cs-rust bg-cs-panel' : 'text-cs-ink hover:bg-cs-panel'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="p-3 border-t-[1.5px] border-cs-ink flex items-center gap-2">
                {isSignedIn ? (
                  <>
                    <a
                      href="/settings"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 inline-flex items-center justify-center gap-2 h-11 bg-cs-paper cs-border-thin text-cs-ink font-mono text-xs font-bold uppercase tracking-[0.08em] transition-colors hover:bg-cs-panel"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </a>
                    {onLogout && (
                      <button
                        onClick={() => { setIsMobileMenuOpen(false); onLogout(); }}
                        className="flex-1 inline-flex items-center justify-center h-11 bg-cs-ink text-cs-paper font-mono text-xs font-bold uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5"
                      >
                        Sign Out
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <a
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 inline-flex items-center justify-center gap-2 h-11 bg-cs-paper cs-border-thin text-cs-ink font-mono text-xs font-bold uppercase tracking-[0.08em] transition-colors hover:bg-cs-panel"
                    >
                      <LogIn className="w-4 h-4" /> Log in
                    </a>
                    <a
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 inline-flex items-center justify-center gap-2 h-11 bg-cs-ink text-cs-paper font-mono text-xs font-bold uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5"
                    >
                      <Ticket className="w-4 h-4" /> Start free
                    </a>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
