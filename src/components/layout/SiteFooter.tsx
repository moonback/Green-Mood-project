/**
 * SiteFooter.tsx
 *
 * Global site footer with brand info, navigation links, contact details,
 * store hours, and legal links.
 */

import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Instagram, Facebook } from 'lucide-react';

interface NavLink {
    name: string;
    path: string;
}

interface StoreSettings {
    store_address: string;
    store_phone: string;
    store_hours: string;
    social_instagram: string;
    social_facebook: string;
}

interface SiteFooterProps {
    navLinks: NavLink[];
    settings: StoreSettings;
}

export default function SiteFooter({ navLinks, settings }: SiteFooterProps) {
    const [addressLine1, ...rest] = settings.store_address.split(',');
    const addressLine2 = rest.join(',').trim();
    const hoursValue = settings.store_hours.split(' ').slice(1).join(' ');

    return (
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
                            et conseils d&apos;experts pour votre bien-être.
                        </p>
                        <div className="flex gap-3 pt-1">
                            <a
                                href={settings.social_instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-zinc-500 hover:text-green-neon hover:bg-white/[0.04] rounded-lg transition-all"
                                aria-label="Instagram"
                            >
                                <Instagram className="h-4.5 w-4.5" />
                            </a>
                            <a
                                href={settings.social_facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-zinc-500 hover:text-green-neon hover:bg-white/[0.04] rounded-lg transition-all"
                                aria-label="Facebook"
                            >
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
                                    {addressLine1}
                                    <br />
                                    {addressLine2}
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
                                <span className="text-zinc-400">{hoursValue}</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Dimanche</span>
                                <span className="text-zinc-400">Fermé</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-600">
                    <p>&copy; {new Date().getFullYear()} Green Mood CBD Shop. Tous droits réservés.</p>
                    <div className="flex gap-6">
                        <Link to="/mentions-legales" className="hover:text-zinc-400 transition-colors">Mentions Légales</Link>
                        <Link to="/mentions-legales" className="hover:text-zinc-400 transition-colors">CGU</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
