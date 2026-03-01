import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Leaf,
  MapPin,
  Phone,
  Clock,
  Instagram,
  Facebook,
  ShoppingCart,
  User,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import AgeGate from "./AgeGate";
import CartSidebar from "./CartSidebar";
import BudTender from "./BudTender";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { useSettingsStore } from "../store/settingsStore";

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const location = useLocation();

  const itemCount = useCartStore((s) => s.itemCount());
  const openSidebar = useCartStore((s) => s.openSidebar);
  const { user, profile, signOut } = useAuthStore();
  const { settings } = useSettingsStore();

  // Close menus on route change and scroll to top
  useEffect(() => {
    setIsMenuOpen(false);
    setIsAccountMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const baseNavLinks = [
    { name: "Accueil", path: "/" },
    { name: "La Boutique", path: "/boutique" },
    { name: "Catalogue", path: "/catalogue" },
    { name: "Nos Produits", path: "/produits" },
    { name: "Qualité & Légalité", path: "/qualite" },
    { name: "Contact", path: "/contact" },
  ];

  const navLinks = baseNavLinks;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans">
      {/* Age Verification Popup */}
      <AgeGate />

      {/* Cart Sidebar */}
      <CartSidebar />

      {/* BudTender IA Widget */}
      {settings.budtender_enabled && <BudTender />}

      {/* Promotional Banner */}
      <AnimatePresence>
        {isBannerVisible && settings.banner_enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-green-neon text-black relative flex items-center justify-center overflow-hidden z-[60]"
          >
            <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-center w-full max-w-7xl mx-auto pr-10">
              <span className="inline-block animate-pulse mr-2">✦</span>
              {settings.banner_text}
              <span className="inline-block animate-pulse ml-2">✦</span>
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
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="sticky top-0 z-50 w-full"
      >
        <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.4)]" />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 relative z-10">
          <div className="flex justify-between items-center h-18 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center group relative" aria-label="Green Mood CBD Shop — Accueil">
              <div className="absolute -inset-4 bg-green-neon/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <img
                src="/logo.png"
                alt="Green Mood CBD Shop"
                className="h-16 md:h-18 w-auto object-contain transition-all duration-500 group-hover:scale-105 group-hover:glow-logo"
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path ||
                  (link.path !== "/" && location.pathname.startsWith(link.path));
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300 group ${isActive ? "text-green-neon" : "text-zinc-400 hover:text-white"
                      }`}
                  >
                    <span className="relative z-10">{link.name}</span>
                    {isActive ? (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 bg-white/[0.04] rounded-xl border border-white/[0.08] -z-0"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    ) : (
                      <span className="absolute inset-0 bg-white/0 rounded-xl group-hover:bg-white/[0.04] transition-all duration-300 -z-0" />
                    )}
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-neon rounded-full shadow-[0_0_8px_rgba(57,255,20,0.8)]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2.5">
              {/* Cart button */}
              <button
                onClick={openSidebar}
                className="group relative p-2.5 text-zinc-400 hover:text-green-neon transition-all duration-300 hover:bg-white/[0.04] rounded-xl border border-transparent hover:border-white/[0.08]"
                aria-label="Ouvrir le panier"
              >
                <ShoppingCart className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-neon text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-[0_0_12px_rgba(57,255,20,0.4)]">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>

              {/* Account */}
              {user ? (
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className={`flex items-center gap-2.5 p-2 pr-3.5 rounded-xl border transition-all duration-300 ${isAccountMenuOpen
                      ? "bg-green-neon border-green-neon text-black"
                      : "bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:border-green-neon/40 hover:text-white"
                      }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isAccountMenuOpen ? "bg-black/20" : "bg-white/[0.08]"
                      }`}>
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {profile?.full_name?.split(" ")[0] ?? "Profil"}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isAccountMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-3 w-52 bg-zinc-900/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-50 p-1.5"
                      >
                        <Link
                          to="/compte"
                          className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-white rounded-xl transition-all"
                        >
                          <User className="h-4 w-4" />
                          Tableau de bord
                        </Link>
                        <Link
                          to="/compte/commandes"
                          className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-white rounded-xl transition-all"
                        >
                          <Clock className="h-4 w-4" />
                          Historique
                        </Link>
                        {profile?.is_admin && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-green-neon hover:bg-green-neon/10 rounded-xl transition-all"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Administration
                          </Link>
                        )}
                        <div className="h-px bg-white/[0.06] my-1.5 mx-3" />
                        <button
                          onClick={signOut}
                          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                        >
                          <LogOut className="h-4 w-4" />
                          Déconnexion
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/connexion"
                  className="hidden md:flex items-center gap-2.5 px-5 py-2.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] text-white rounded-xl transition-all duration-300 group"
                >
                  <User className="h-4 w-4 text-zinc-500 group-hover:text-green-neon transition-colors" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Accès Client</span>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2.5 text-zinc-400 hover:text-white bg-white/[0.04] rounded-xl border border-white/[0.08] transition-all"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-50 lg:hidden bg-zinc-950/98 backdrop-blur-2xl flex flex-col"
            >
              {/* Mobile header */}
              <div className="flex items-center justify-between px-5 h-18">
                <Link to="/" className="flex items-center" aria-label="Green Mood CBD Shop">
                  <img src="/logo.png" alt="Green Mood CBD Shop" className="h-12 w-auto object-contain" />
                </Link>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2.5 text-zinc-500 hover:text-white rounded-xl hover:bg-white/[0.04] transition-all"
                  aria-label="Fermer le menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation links */}
              <nav className="flex-1 overflow-y-auto px-5 pt-8 pb-6">
                <div className="space-y-1">
                  {navLinks.map((link, i) => (
                    <motion.div
                      key={link.path}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                    >
                      <Link
                        to={link.path}
                        className={`block px-4 py-3.5 rounded-2xl text-xl font-serif font-semibold transition-all ${location.pathname === link.path
                          ? "text-green-neon bg-green-neon/[0.06]"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                          }`}
                      >
                        {link.name}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </nav>

              {/* Mobile footer actions */}
              <div className="px-5 pb-8 pt-4 border-t border-white/[0.06] space-y-4">
                {user ? (
                  <div className={`${profile?.is_admin ? "grid-cols-1" : "grid-cols-2"} grid gap-3`}>
                    <Link to="/compte" className="flex items-center justify-center gap-2.5 p-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm font-semibold">
                      <User className="h-4 w-4 text-green-neon" /> Mon compte
                    </Link>
                    {profile?.is_admin && (
                      <Link to="/admin" className="flex items-center justify-center gap-2.5 p-3.5 bg-green-neon/10 border border-green-neon/20 rounded-xl text-sm font-semibold text-green-neon">
                        <ShieldCheck className="h-4 w-4" /> Administration
                      </Link>
                    )}
                    <button onClick={signOut} className="flex items-center justify-center gap-2.5 p-3.5 bg-red-400/10 border border-red-400/20 rounded-xl text-sm font-semibold text-red-400">
                      <LogOut className="h-4 w-4" /> Déconnexion
                    </button>
                  </div>
                ) : (
                  <Link to="/connexion" className="flex items-center justify-center gap-3 p-4 bg-green-neon text-black rounded-2xl text-sm font-bold uppercase tracking-wider">
                    <User className="h-4 w-4" /> Connexion
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-white/[0.06] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <Link to="/" className="flex items-center group" aria-label="Green Mood CBD Shop">
                <img
                  src="/logo.jpeg"
                  alt="Green Mood CBD Shop"
                  className="h-12 w-auto object-contain opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:glow-logo"
                />
              </Link>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Votre CBD Shop premium. Produits naturels, traçabilité garantie
                et conseils d'experts pour votre bien-être.
              </p>
              <div className="flex gap-3 pt-1">
                <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="p-2 text-zinc-500 hover:text-green-neon hover:bg-white/[0.04] rounded-lg transition-all" aria-label="Instagram">
                  <Instagram className="h-4.5 w-4.5" />
                </a>
                <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="p-2 text-zinc-500 hover:text-green-neon hover:bg-white/[0.04] rounded-lg transition-all" aria-label="Facebook">
                  <Facebook className="h-4.5 w-4.5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-serif text-base font-semibold mb-4 text-zinc-200">Navigation</h3>
              <ul className="space-y-2.5">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-zinc-500 hover:text-green-neon transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-serif text-base font-semibold mb-4 text-zinc-200">Contact</h3>
              <ul className="space-y-4 text-sm text-zinc-500">
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-green-neon shrink-0 mt-0.5" />
                  <span>
                    {settings.store_address.split(',')[0]}
                    <br />
                    {settings.store_address.split(',').slice(1).join(',').trim()}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-green-neon shrink-0" />
                  <span>{settings.store_phone}</span>
                </li>
              </ul>
            </div>

            {/* Hours */}
            <div>
              <h3 className="font-serif text-base font-semibold mb-4 text-zinc-200">Horaires</h3>
              <ul className="space-y-2.5 text-sm text-zinc-500">
                <li className="flex justify-between">
                  <span>Lundi - Samedi</span>
                  <span className="text-zinc-400">{settings.store_hours.split(' ').slice(1).join(' ')}</span>
                </li>
                <li className="flex justify-between">
                  <span>Dimanche</span>
                  <span className="text-zinc-400">Fermé</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-600">
            <p>
              &copy; {new Date().getFullYear()} Green Mood CBD Shop. Tous droits réservés.
            </p>
            <div className="flex gap-6">
              <Link to="/mentions-legales" className="hover:text-zinc-400 transition-colors">
                Mentions Légales
              </Link>
              <Link to="/mentions-legales" className="hover:text-zinc-400 transition-colors">
                CGU
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
