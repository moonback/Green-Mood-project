/**
 * Layout.tsx
 *
 * Root layout shell for all public routes.
 * Composes the global header (with nav, search, account), footer, and overlay
 * components. Business logic for search is delegated to useSearch; UI sections
 * are composed from focused sub-components in components/layout/.
 */

import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AgeGate from './AgeGate';
import CartSidebar from './CartSidebar';
import BudTender from './BudTender';
import ToastContainer from './Toast';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useSearch } from '../hooks/useSearch';
import BannerTicker from './layout/BannerTicker';
import AccountMenu from './layout/AccountMenu';
import MobileMenu from './layout/MobileMenu';
import SearchOverlay from './layout/SearchOverlay';
import SiteFooter from './layout/SiteFooter';

const NAV_LINKS = [
  { name: 'Accueil', path: '/' },
  { name: 'La Boutique', path: '/boutique' },
  { name: 'Catalogue', path: '/catalogue' },
  { name: 'Nos Produits', path: '/produits' },
  { name: 'Qualité & Légalité', path: '/qualite' },
  { name: 'Contact', path: '/contact' },
];

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  const itemCount = useCartStore((s) => s.itemCount());
  const openSidebar = useCartStore((s) => s.openSidebar);
  const { user, profile, signOut } = useAuthStore();
  const settings = useSettingsStore((s) => s.settings);

  const { searchQuery, setSearchQuery, searchResults, isSearching } = useSearch();

  // Close all menus and scroll to top on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsAccountMenuOpen(false);
    setIsSearchOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans">
      {/* Global overlays */}
      <AgeGate />
      <CartSidebar />
      {((!settings) || (settings.budtender_chat_enabled !== false) || (settings.budtender_voice_enabled !== false)) && <BudTender />}
      <ToastContainer />

      {/* Promotional banner */}
      <AnimatePresence>
        {isBannerVisible && settings.banner_enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-green-neon text-black relative flex items-center justify-center overflow-hidden z-[60]"
          >
            <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-center w-full max-w-7xl mx-auto pr-10">
              <BannerTicker messages={[settings.banner_text, ...(settings.ticker_messages || [])].filter(Boolean)} />
            </div>
            <button
              onClick={() => setIsBannerVisible(false)}
              className="absolute right-4 p-1.5 hover:bg-black/10 rounded-full transition-colors group"
              aria-label="Fermer la bannière"
            >
              <X className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="sticky top-0 z-[999] w-full"
      >
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-3xl border-b border-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.5)]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col">
            {/* Top Row: Logo & Actions */}
            <div className="flex items-center justify-between h-20 md:h-24">
              {/* Desktop left spacer */}
              <div className="flex-1 lg:flex items-center hidden">
                <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold hidden xl:block">
                  Premium CBD Experience
                </span>
              </div>

              {/* Mobile menu toggle */}
              <div className="lg:hidden flex-1">
                <button
                  className="p-2.5 text-zinc-400 hover:text-white bg-white/[0.04] rounded-xl border border-white/[0.08] transition-all active:scale-95"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                >
                  {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>

              {/* Centered logo */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <Link to="/" className="flex items-center group relative z-[1000]" aria-label="Green Mood CBD Shop — Accueil">
                  <div className="absolute -inset-8 bg-green-neon/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <img
                    src="/logo.png"
                    alt="Green Mood CBD Shop"
                    className="h-38 md:h-40 w-auto object-contain transition-all duration-700 group-hover:scale-105 group-hover:glow-logo"
                  />
                </Link>
              </div>

              {/* Right actions: Search, Cart, Account */}
              <div className="flex-1 flex justify-end items-center gap-2 md:gap-4">
                {settings.search_enabled && (
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="p-3 text-zinc-400 hover:text-green-neon transition-all duration-300 hover:bg-white/[0.04] rounded-xl border border-transparent hover:border-white/[0.08]"
                    aria-label="Rechercher"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                )}

                <button
                  onClick={openSidebar}
                  className="group relative p-3 text-zinc-400 hover:text-green-neon transition-all duration-300 hover:bg-white/[0.04] rounded-xl border border-transparent hover:border-white/[0.08]"
                  aria-label="Ouvrir le panier"
                >
                  <ShoppingCart className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-neon text-black text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-[0_0_12px_rgba(57,255,20,0.5)]">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </button>

                <AccountMenu
                  user={user}
                  profile={profile}
                  isOpen={isAccountMenuOpen}
                  onToggle={() => setIsAccountMenuOpen((prev) => !prev)}
                  onSignOut={signOut}
                />
              </div>
            </div>

            {/* Desktop navigation */}
            <nav className="relative z-40 hidden lg:flex items-center justify-center gap-2 pb-5 pt-2 border-t border-white/[0.03]">
              {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.path ||
                  (link.path !== '/' && location.pathname.startsWith(link.path));
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 group ${isActive ? 'text-green-neon' : 'text-zinc-400 hover:text-white'}`}
                  >
                    <span className="relative z-10">{link.name}</span>
                    {isActive ? (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 bg-green-neon/[0.03] rounded-full border border-green-neon/10 -z-0"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    ) : (
                      <span className="absolute inset-0 bg-transparent rounded-full group-hover:bg-white/[0.03] transition-all duration-300 -z-0" />
                    )}
                    {isActive && (
                      <motion.span
                        layoutId="nav-dot"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-neon rounded-full shadow-[0_0_8px_rgba(57,255,20,0.8)]"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile menu */}
        <MobileMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          navLinks={NAV_LINKS}
          currentPath={location.pathname}
          user={user}
          profile={profile}
          onSignOut={signOut}
        />
      </motion.header>

      {/* Page content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <SiteFooter navLinks={NAV_LINKS} settings={settings} />

      {/* Search overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        onQueryChange={setSearchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
      />
    </div>
  );
}
