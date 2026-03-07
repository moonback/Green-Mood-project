import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { Star, Download, Share2 } from 'lucide-react';

interface LoyaltyCardProps {
    userId: string;
    fullName: string;
    points: number;
    referralCode?: string | null;
    /** Set to true for the compact version shown inside admin POS modal */
    compact?: boolean;
}

/**
 * Generates a short, stable loyalty card number from a UUID.
 * Format: GM-XXXXXXXX (last 8 chars of uuid, uppercased)
 */
function cardNumber(userId: string) {
    const raw = userId.replace(/-/g, '').toUpperCase();
    return `GM-${raw.slice(-8)}`;
}

/**
 * Tier logic based on points
 */
function getTier(points: number): { label: string; color: string; next: number | null; progress: number } {
    if (points >= 5000) return { label: 'Platine', color: '#e5e4e2', next: null, progress: 100 };
    if (points >= 2000) return { label: 'Or', color: '#FFD700', next: 5000, progress: ((points - 2000) / (5000 - 2000)) * 100 };
    if (points >= 500) return { label: 'Argent', color: '#C0C0C0', next: 2000, progress: ((points - 500) / (2000 - 500)) * 100 };
    return { label: 'Bronze', color: '#CD7F32', next: 500, progress: (points / 500) * 100 };
}

export default function LoyaltyCard({ userId, fullName, points, referralCode, compact = false }: LoyaltyCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const tier = getTier(points);
    const cardNum = cardNumber(userId);

    // The QR code encodes the card's unique identifier
    const qrValue = `greenmood://loyalty/${userId}`;

    if (compact) {
        return (
            <div className="flex flex-col items-center gap-4">
                {/* Compact card for POS modal */}
                <div
                    ref={cardRef}
                    className="w-full max-w-[360px] rounded-3xl p-5 relative overflow-hidden shadow-2xl"
                    style={{
                        background: 'linear-gradient(135deg, #0a1a0f 0%, #0d2310 40%, #132b14 100%)',
                        border: `1px solid ${tier.color}30`,
                        boxShadow: `0 0 40px ${tier.color}15, inset 0 1px 0 rgba(255,255,255,0.05)`,
                    }}
                >
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: tier.color }} />
                    <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full blur-2xl opacity-10 bg-green-400" />

                    <div className="flex items-start justify-between mb-4 relative z-10">
                        <div>
                            <p className="text-[9px] font-mono tracking-[0.3em] text-green-400/60 uppercase mb-1">Green Mood</p>
                            <p className="text-white font-black text-base leading-tight truncate max-w-[180px]">{fullName || 'Client'}</p>
                            <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{cardNum}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ color: tier.color, background: `${tier.color}15`, border: `1px solid ${tier.color}30` }}>
                                {tier.label}
                            </span>
                            <div className="flex items-center gap-1">
                                <Star className="w-3 h-3" style={{ color: tier.color, fill: tier.color }} />
                                <span className="font-black text-white text-sm">{points}</span>
                                <span className="text-[10px] text-zinc-500">pts</span>
                            </div>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center relative z-10">
                        <div className="bg-white rounded-2xl p-2.5 shadow-xl">
                            <QRCodeSVG
                                value={qrValue}
                                size={100}
                                bgColor="#ffffff"
                                fgColor="#0a1a0f"
                                level="H"
                                imageSettings={{
                                    src: '/logo-qr.png',
                                    width: 18,
                                    height: 18,
                                    excavate: true,
                                }}
                            />
                        </div>
                    </div>

                    <p className="text-center text-[9px] font-mono text-zinc-600 mt-3 relative z-10">Scannez pour identifier ce client au POS</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-6 w-full">
            {/* Premium loyalty card */}
            <motion.div
                ref={cardRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01, rotateX: 2 }}
                className="w-full max-w-sm rounded-[2rem] p-7 relative overflow-hidden shadow-2xl cursor-default"
                style={{
                    background: 'linear-gradient(135deg, #0a1a0f 0%, #0d2310 50%, #1a3a1c 100%)',
                    border: `1px solid ${tier.color}40`,
                    boxShadow: `0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px ${tier.color}18`,
                }}
            >
                {/* Background effects */}
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-15" style={{ background: tier.color }} />
                <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full blur-2xl opacity-10 bg-emerald-400" />
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 80% 20%, ${tier.color}08 0%, transparent 50%)`,
                }} />

                {/* Card chip-style emblem */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-8 h-6 rounded bg-gradient-to-br from-amber-300/30 to-amber-600/20 border border-amber-400/20 grid grid-cols-2 grid-rows-3 gap-0.5 p-0.5">
                    {Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-amber-400/20 rounded-[1px]" />
                    ))}
                </div>

                {/* Top section */}
                <div className="flex items-start justify-between mb-6 relative z-10 pt-2">
                    <div>
                        <p className="text-[8px] font-mono tracking-[0.4em] text-green-400/50 uppercase mb-2">Green Mood CBD</p>
                        <p className="text-white font-black text-xl leading-tight">{fullName || 'Client'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full" style={{
                            color: tier.color,
                            background: `${tier.color}15`,
                            border: `1px solid ${tier.color}30`,
                        }}>
                            ✦ {tier.label}
                        </span>
                    </div>
                </div>

                {/* QR Code center */}
                <div className="flex justify-center mb-6 relative z-10">
                    <div className="bg-white rounded-2xl p-3 shadow-2xl" style={{ boxShadow: `0 8px 30px ${tier.color}20` }}>
                        <QRCodeSVG
                            value={qrValue}
                            size={130}
                            bgColor="#ffffff"
                            fgColor="#0a1a0f"
                            level="H"
                        />
                    </div>
                </div>

                {/* Points + card number */}
                <div className="flex items-end justify-between relative z-10">
                    <div>
                        <p className="text-[8px] font-mono tracking-[0.3em] text-zinc-500 uppercase mb-1">Points accumulés</p>
                        <div className="flex items-center gap-2">
                            <Star className="w-4 h-4" style={{ color: tier.color, fill: tier.color }} />
                            <span className="text-2xl font-black text-white">{points}</span>
                            <span className="text-xs text-zinc-500 font-bold">PTS</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-mono tracking-[0.2em] text-zinc-600 uppercase mb-1">N° Carte</p>
                        <p className="text-sm font-mono font-bold tracking-widest" style={{ color: `${tier.color}cc` }}>{cardNum}</p>
                    </div>
                </div>

                {/* Progress bar to next tier */}
                {tier.next && (
                    <div className="mt-5 relative z-10">
                        <div className="flex justify-between mb-1.5">
                            <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">{tier.label}</p>
                            <p className="text-[8px] font-mono uppercase tracking-widest" style={{ color: `${tier.color}80` }}>
                                {tier.next - points} pts → {getTier(tier.next).label}
                            </p>
                        </div>
                        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${tier.progress}%` }}
                                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                                className="h-full rounded-full"
                                style={{ background: `linear-gradient(90deg, ${tier.color}80, ${tier.color})` }}
                            />
                        </div>
                    </div>
                )}

                {tier.next === null && (
                    <div className="mt-5 relative z-10 text-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: tier.color }}>
                            ✦ Membre Platine — Niveau Maximal ✦
                        </p>
                    </div>
                )}
            </motion.div>

            {/* Action buttons */}
            <div className="flex gap-3 text-xs">
                <button
                    onClick={() => {
                        if (navigator.share) {
                            navigator.share({
                                title: 'Ma Carte Fidélité Green Mood',
                                text: `Mon code: ${cardNum} — ${points} points`,
                            }).catch(() => { });
                        } else {
                            navigator.clipboard.writeText(`Carte Fidélité Green Mood\nN°: ${cardNum}\nPoints: ${points}`)
                                .then(() => { });
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-zinc-400 hover:text-white transition-all"
                >
                    <Share2 className="w-3.5 h-3.5" />
                    Partager
                </button>
                <button
                    onClick={() => {
                        // Print the card
                        window.print();
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-zinc-400 hover:text-white transition-all"
                >
                    <Download className="w-3.5 h-3.5" />
                    Imprimer
                </button>
            </div>

            {/* Usage hint */}
            <p className="text-center text-[10px] font-mono text-zinc-700 max-w-xs leading-relaxed">
                Présentez ce QR code en boutique pour identifier votre compte et utiliser vos points fidélité.
            </p>
        </div>
    );
}
