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
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const location = useLocation();

  const itemCount = useCartStore((s) => s.itemCount());
  const openSidebar = useCartStore((s) => s.openSidebar);
  const { user, profile, signOut } = useAuthStore();

  // Close menus on route change and scroll to top
  useEffect(() => {
    setIsMenuOpen(false);
    setIsAccountMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const navLinks = [
    { name: "Accueil", path: "/" },
    { name: "La Boutique", path: "/boutique" },
    { name: "Catalogue", path: "/catalogue" },
    { name: "Nos Produits", path: "/produits" },
    { name: "Qualité & Légalité", path: "/qualite" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 font-sans">
      {/* Age Verification Popup */}
      <AgeGate />

      {/* Cart Sidebar */}
      <CartSidebar />

      {/* Promotional Banner */}
      <AnimatePresence>
        {isBannerVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-green-primary text-white relative flex items-center justify-center overflow-hidden"
          >
            <div className="px-4 py-2.5 text-sm font-medium text-center w-full max-w-7xl mx-auto pr-10">
              🌿 Offre de bienvenue : -10% sur votre première visite en boutique avec le code{" "}
              <span className="font-bold">GREENMOON</span> !
            </div>
            <button
              onClick={() => setIsBannerVisible(false)}
              className="absolute right-4 p-1.5 hover:bg-black/20 rounded-full transition-colors"
              aria-label="Fermer la bannière"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <Leaf className="h-8 w-8 text-green-primary group-hover:text-green-neon transition-colors" />
              <span className="font-serif text-2xl font-bold tracking-tight">
                Green{" "}
                <span className="text-green-primary group-hover:text-green-neon transition-colors">
                  Moon
                </span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-green-primary ${
                    location.pathname === link.path ||
                    (link.path !== "/" && location.pathname.startsWith(link.path))
                      ? "text-green-primary"
                      : "text-zinc-300"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Cart button */}
              <button
                onClick={openSidebar}
                className="relative p-2 text-zinc-300 hover:text-white transition-colors"
                aria-label="Ouvrir le panier"
              >
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-green-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>

              {/* Account */}
              {user ? (
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className="flex items-center gap-2 p-2 text-zinc-300 hover:text-white transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span className="text-sm">{profile?.full_name?.split(" ")[0] ?? "Mon compte"}</span>
                  </button>

                  <AnimatePresence>
                    {isAccountMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        <Link
                          to="/compte"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                        >
                          <User className="h-4 w-4" />
                          Mon compte
                        </Link>
                        <Link
                          to="/compte/commandes"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                        >
                          <Clock className="h-4 w-4" />
                          Mes commandes
                        </Link>
                        {profile?.is_admin && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-3 px-4 py-3 text-sm text-green-primary hover:bg-zinc-800 transition-colors"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Administration
                          </Link>
                        )}
                        <button
                          onClick={signOut}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-zinc-800 transition-colors border-t border-zinc-700"
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
                  className="hidden md:flex items-center gap-2 text-sm text-zinc-300 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <User className="h-5 w-5" />
                  Connexion
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 text-zinc-300 hover:text-white"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-zinc-900 border-b border-white/10 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4 flex flex-col">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-lg font-medium transition-colors ${
                      location.pathname === link.path
                        ? "text-green-primary"
                        : "text-zinc-300"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="border-t border-zinc-700 pt-4 space-y-3">
                  {user ? (
                    <>
                      <Link to="/compte" className="flex items-center gap-2 text-zinc-300">
                        <User className="h-4 w-4" /> Mon compte
                      </Link>
                      <Link to="/compte/commandes" className="flex items-center gap-2 text-zinc-300">
                        <Clock className="h-4 w-4" /> Mes commandes
                      </Link>
                      {profile?.is_admin && (
                        <Link to="/admin" className="flex items-center gap-2 text-green-primary">
                          <ShieldCheck className="h-4 w-4" /> Administration
                        </Link>
                      )}
                      <button onClick={signOut} className="flex items-center gap-2 text-red-400">
                        <LogOut className="h-4 w-4" /> Déconnexion
                      </button>
                    </>
                  ) : (
                    <Link to="/connexion" className="flex items-center gap-2 text-zinc-300">
                      <User className="h-4 w-4" /> Connexion / Inscription
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

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
              <Link to="/" className="flex items-center gap-2">
                <Leaf className="h-6 w-6 text-green-primary" />
                <span className="font-serif text-xl font-bold">Green Moon</span>
              </Link>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Votre CBD Shop premium. Produits naturels, traçabilité garantie
                et conseils d'experts pour votre bien-être.
              </p>
              <div className="flex gap-4 pt-2">
                <a href="#" className="text-zinc-400 hover:text-green-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-zinc-400 hover:text-green-primary transition-colors">
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
                      className="text-zinc-400 hover:text-green-primary transition-colors text-sm"
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
                  <MapPin className="h-5 w-5 text-green-primary shrink-0" />
                  <span>
                    123 Rue de la Nature
                    <br />
                    75000 Paris
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-green-primary shrink-0" />
                  <span>01 23 45 67 89</span>
                </li>
              </ul>
            </div>

            {/* Hours */}
            <div>
              <h3 className="font-serif text-lg font-semibold mb-4">Horaires</h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex justify-between">
                  <span>Lundi - Samedi</span>
                  <span>10h00 - 19h30</span>
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
              &copy; {new Date().getFullYear()} Green Moon CBD Shop. Tous droits réservés.
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
