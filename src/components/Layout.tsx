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

  const navLinks = profile?.is_admin
    ? [...baseNavLinks, { name: "Administration", path: "/admin" }]
    : baseNavLinks;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 font-sans">
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
            <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-center w-full max-w-7xl mx-auto pr-10">
              <span className="inline-block animate-pulse mr-2">✦</span>
              {settings.banner_text}
              <span className="inline-block animate-pulse ml-2">✦</span>
            </div>
            <button
              onClick={() => setIsBannerVisible(false)}
              className="absolute right-4 p-1.5 hover:bg-black/10 rounded-full transition-colors group"
              aria-label="Fermer la bannière"
            >
              <X className="h-3 w-3 transition-transform group-hover:rotate-90" />
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
        <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-2xl border-b border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" />

        <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center h-20 md:h-24">
            {/* Logo */}
            <Link to="/" className="flex items-center group relative" aria-label="Green Mood CBD Shop — Accueil">
              <div className="absolute -inset-4 bg-green-neon/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <img
                src="/logo.png"
                alt="Green Mood CBD Shop"
                className="h-20 w-auto object-contain transition-all duration-700 group-hover:scale-105 group-hover:[filter:drop-shadow(0_0_12px_rgba(57,255,20,0.8))]"
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path ||
                  (link.path !== "/" && location.pathname.startsWith(link.path));
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative px-4 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 group ${isActive ? "text-green-neon" : "text-zinc-400 hover:text-white"
                      }`}
                  >
                    <span className="relative z-10">{link.name}</span>
                    {isActive ? (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 bg-white/5 rounded-xl border border-white/10 -z-0"
                      />
                    ) : (
                      <span className="absolute inset-0 bg-white/0 rounded-xl group-hover:bg-white/5 transition-all duration-300 -z-0" />
                    )}
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-neon rounded-full shadow-[0_0_10px_rgba(57,255,20,1)]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {/* Cart button */}
              <button
                onClick={openSidebar}
                className="group relative p-3 text-zinc-400 hover:text-green-neon transition-all duration-300 bg-white/0 hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/10"
                aria-label="Ouvrir le panier"
              >
                <ShoppingCart className="h-5 w-5 transition-transform group-hover:scale-110" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-neon text-black text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.4)]">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>

              {/* Account */}
              {user ? (
                <div className="relative hidden md:block group/account">
                  <button
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className={`flex items-center gap-3 p-2 pr-4 rounded-2xl border transition-all duration-300 ${isAccountMenuOpen
                      ? "bg-green-neon border-green-neon text-black"
                      : "bg-white/5 border-white/10 text-zinc-300 hover:border-green-neon/50 hover:text-white"
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isAccountMenuOpen ? "bg-black/20" : "bg-white/10"
                      }`}>
                      <User className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {profile?.full_name?.split(" ")[0] ?? "Profil"}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isAccountMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-4 w-56 bg-zinc-900/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden z-50 p-2"
                      >
                        <Link
                          to="/compte"
                          className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-zinc-400 hover:bg-white/5 hover:text-white rounded-2xl transition-all uppercase tracking-widest"
                        >
                          <User className="h-4 w-4" />
                          Tableau de bord
                        </Link>
                        <Link
                          to="/compte/commandes"
                          className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-zinc-400 hover:bg-white/5 hover:text-white rounded-2xl transition-all uppercase tracking-widest"
                        >
                          <Clock className="h-4 w-4" />
                          Historique
                        </Link>
                        {profile?.is_admin && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-3 px-4 py-3 text-xs font-black text-green-neon hover:bg-green-neon/10 rounded-2xl transition-all uppercase tracking-widest"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Admin Space
                          </Link>
                        )}
                        <div className="h-px bg-white/5 my-2 mx-4" />
                        <button
                          onClick={signOut}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-400 hover:bg-red-400/10 rounded-2xl transition-all uppercase tracking-widest"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/connexion"
                  className="hidden md:flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-2xl transition-all group"
                >
                  <User className="h-4 w-4 text-zinc-500 group-hover:text-green-neon transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Accès Client</span>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-3 text-zinc-400 hover:text-white bg-white/5 rounded-2xl border border-white/10 transition-all"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
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
              className="fixed inset-0 z-50 lg:hidden bg-zinc-950/95 backdrop-blur-2xl p-8 flex flex-col pt-32"
            >
              <button
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-8 right-8 p-4 text-zinc-500 hover:text-white"
              >
                <X className="w-8 h-8" />
              </button>

              <div className="space-y-8">
                {navLinks.map((link) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Link
                      to={link.path}
                      className={`text-4xl font-serif font-black transition-all ${location.pathname === link.path
                        ? "text-green-neon italic"
                        : "text-zinc-600 hover:text-white"
                        }`}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="mt-auto pt-10 border-t border-white/5 space-y-6">
                {user ? (
                  <div className="grid grid-cols-2 gap-4">
                    <Link to="/compte" className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl text-sm font-bold uppercase tracking-widest">
                      <User className="h-5 w-5 text-green-neon" /> Profil
                    </Link>
                    <button onClick={signOut} className="flex items-center gap-3 p-4 bg-red-400/10 rounded-2xl text-sm font-bold uppercase tracking-widest text-red-400">
                      <LogOut className="h-5 w-5" /> Logout
                    </button>
                  </div>
                ) : (
                  <Link to="/connexion" className="flex items-center justify-center gap-4 p-6 bg-green-neon text-black rounded-3xl text-sm font-black uppercase tracking-[0.3em]">
                    <User className="h-5 w-5" /> Connexion
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
      <footer className="bg-black border-t border-white/10 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <Link to="/" className="flex items-center group" aria-label="Green Mood CBD Shop">
                <img
                  src="/logo.jpeg"
                  alt="Green Mood CBD Shop"
                  className="h-12 w-auto object-contain opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:[filter:drop-shadow(0_0_8px_rgba(57,255,20,0.5))_drop-shadow(0_0_18px_rgba(57,255,20,0.2))]"
                />
              </Link>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Votre CBD Shop premium. Produits naturels, traçabilité garantie
                et conseils d'experts pour votre bien-être.
              </p>
              <div className="flex gap-4 pt-2">
                <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-green-neon transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-green-neon transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-serif text-lg font-semibold mb-4">Navigation</h3>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-zinc-400 hover:text-green-neon transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-serif text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-4 text-sm text-zinc-400">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-green-neon shrink-0" />
                  <span>
                    {settings.store_address.split(',')[0]}
                    <br />
                    {settings.store_address.split(',').slice(1).join(',').trim()}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-green-neon shrink-0" />
                  <span>{settings.store_phone}</span>
                </li>
              </ul>
            </div>

            {/* Hours */}
            <div>
              <h3 className="font-serif text-lg font-semibold mb-4">Horaires</h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex justify-between">
                  <span>Lundi - Samedi</span>
                  <span>{settings.store_hours.split(' ').slice(1).join(' ')}</span>
                </li>
                <li className="flex justify-between">
                  <span>Dimanche</span>
                  <span>Fermé</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
            <p>
              &copy; {new Date().getFullYear()} Green Mood CBD Shop. Tous droits réservés.
            </p>
            <div className="flex gap-4">
              <Link to="/mentions-legales" className="hover:text-white transition-colors">
                Mentions Légales
              </Link>
              <Link to="/mentions-legales" className="hover:text-white transition-colors">
                CGU
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
