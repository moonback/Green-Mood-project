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
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: "Accueil", path: "/" },
    { name: "La Boutique", path: "/boutique" },
    { name: "Nos Produits", path: "/produits" },
    { name: "Qualité & Légalité", path: "/qualite" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 font-sans">
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
            <nav className="hidden md:flex gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-green-primary ${
                    location.pathname === link.path
                      ? "text-green-primary"
                      : "text-zinc-300"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-zinc-300 hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-zinc-900 border-b border-white/10 overflow-hidden"
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
                <a
                  href="#"
                  className="text-zinc-400 hover:text-green-primary transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-zinc-400 hover:text-green-primary transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-serif text-lg font-semibold mb-4">
                Navigation
              </h3>
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
              <h3 className="font-serif text-lg font-semibold mb-4">
                Horaires
              </h3>
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
              &copy; {new Date().getFullYear()} Green Moon CBD Shop. Tous droits
              réservés.
            </p>
            <div className="flex gap-4">
              <Link
                to="/mentions-legales"
                className="hover:text-white transition-colors"
              >
                Mentions Légales
              </Link>
              <Link
                to="/mentions-legales"
                className="hover:text-white transition-colors"
              >
                CGU
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
