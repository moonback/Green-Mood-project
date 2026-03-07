import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, X, CheckCircle2, AlertTriangle, RotateCcw, Camera } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Profile } from '../../../lib/types';

interface POSQRScannerProps {
    onCustomerFound: (customer: Profile) => void;
    onClose: () => void;
    isLightTheme?: boolean;
}

/**
 * Extracts the user ID from a loyalty QR code value.
 * Format: greenmood://loyalty/{userId}
 */
function parseQRCode(raw: string): string | null {
    const match = raw.match(/greenmood:\/\/loyalty\/([a-f0-9-]{36})/i);
    return match ? match[1] : null;
}

export default function POSQRScanner({ onCustomerFound, onClose, isLightTheme }: POSQRScannerProps) {
    const [manualInput, setManualInput] = useState('');
    const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [foundCustomer, setFoundCustomer] = useState<Profile | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus the input for barcode scanner
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const searchByQR = async (raw: string) => {
        const userId = parseQRCode(raw);
        if (!userId) {
            setStatus('error');
            setErrorMsg('QR code invalide. Format non reconnu.');
            return;
        }
        setStatus('searching');
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (error || !data) throw new Error('Client introuvable');
            setFoundCustomer(data as Profile);
            setStatus('found');
            setTimeout(() => {
                onCustomerFound(data as Profile);
            }, 1200);
        } catch (err) {
            setStatus('error');
            setErrorMsg('Client introuvable dans la base de données.');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setManualInput(val);
        setStatus('idle');
        setErrorMsg('');
        // Auto-trigger when a full QR payload is pasted/scanned
        if (val.startsWith('greenmood://loyalty/')) {
            searchByQR(val);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && manualInput.trim()) {
            searchByQR(manualInput.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={`w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border transition-all ${isLightTheme ? 'bg-white border-emerald-100' : 'bg-zinc-900 border-zinc-800'}`}
            >
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-5 border-b transition-all ${isLightTheme ? 'bg-emerald-50/70 border-emerald-100' : 'bg-zinc-800/50 border-zinc-800'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isLightTheme ? 'bg-emerald-100 text-emerald-600' : 'bg-green-500/10 text-green-400'}`}>
                            <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                            <p className={`font-black text-sm ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>Scanner Carte Fidélité</p>
                            <p className={`text-[10px] font-bold ${isLightTheme ? 'text-emerald-600/50' : 'text-zinc-500'}`}>QR Code ou saisie manuelle</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-xl transition-all ${isLightTheme ? 'hover:bg-emerald-100 text-emerald-400' : 'hover:bg-zinc-800 text-zinc-500 hover:text-white'}`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Visual scanner area */}
                    <div className={`relative h-48 rounded-2xl flex items-center justify-center overflow-hidden transition-all ${isLightTheme ? 'bg-emerald-50 border border-emerald-100' : 'bg-zinc-950 border border-zinc-800'}`}>
                        {/* Animated scanner frame */}
                        {status === 'idle' && (
                            <>
                                <div className="absolute inset-4 border-2 rounded-2xl border-dashed opacity-30 border-green-500" />
                                {/* Corner markers */}
                                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-green-500 rounded-tl-lg" />
                                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-green-500 rounded-tr-lg" />
                                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-green-500 rounded-bl-lg" />
                                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-green-500 rounded-br-lg" />
                                {/* Scanning line */}
                                <motion.div
                                    className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-70"
                                    animate={{ top: ['25%', '75%', '25%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                />
                                <div className="flex flex-col items-center gap-3 relative z-10">
                                    <Camera className={`w-8 h-8 ${isLightTheme ? 'text-emerald-300' : 'text-zinc-700'}`} />
                                    <p className={`text-xs font-bold ${isLightTheme ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                        Présentez la carte devant le lecteur
                                    </p>
                                </div>
                            </>
                        )}

                        {status === 'searching' && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center gap-3"
                            >
                                <RotateCcw className="w-10 h-10 text-green-500 animate-spin" />
                                <p className={`text-sm font-black ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>Identification en cours…</p>
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {status === 'found' && foundCustomer && (
                                <motion.div
                                    initial={{ scale: 0.7, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center gap-3 p-4"
                                >
                                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="w-7 h-7 text-green-500" />
                                    </div>
                                    <p className={`text-base font-black text-center ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>
                                        {foundCustomer.full_name}
                                    </p>
                                    <p className="text-xs font-bold text-amber-500">
                                        ★ {foundCustomer.loyalty_points} points
                                    </p>
                                </motion.div>
                            )}

                            {status === 'error' && (
                                <motion.div
                                    initial={{ scale: 0.7, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center gap-3 p-4"
                                >
                                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                        <AlertTriangle className="w-7 h-7 text-red-500" />
                                    </div>
                                    <p className="text-sm font-black text-red-400 text-center">{errorMsg}</p>
                                    <button
                                        onClick={() => { setStatus('idle'); setManualInput(''); setErrorMsg(''); }}
                                        className="text-xs font-bold text-zinc-500 hover:text-white underline transition-colors"
                                    >
                                        Réessayer
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Manual / scanner input */}
                    <div>
                        <label className={`block text-[9px] font-black uppercase tracking-[0.25em] mb-2 ${isLightTheme ? 'text-emerald-600/50' : 'text-zinc-500'}`}>
                            Scanner QR ou entrer l'ID manuellement
                        </label>
                        <div className="relative">
                            <QrCode className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isLightTheme ? 'text-emerald-400' : 'text-zinc-600'}`} />
                            <input
                                ref={inputRef}
                                value={manualInput}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Scannez ou collez le QR code…"
                                className={`w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-green-500/10 ${isLightTheme
                                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-950 placeholder-emerald-300 focus:border-green-500'
                                    : 'bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-700 focus:border-green-500'
                                    }`}
                            />
                        </div>
                        <p className={`text-[9px] mt-2 ${isLightTheme ? 'text-emerald-400/50' : 'text-zinc-600'}`}>
                            Branchez votre lecteur QR — il tapera le code automatiquement
                        </p>
                    </div>

                    <button
                        onClick={() => { if (manualInput.trim()) searchByQR(manualInput.trim()); }}
                        disabled={!manualInput.trim() || status === 'searching'}
                        className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isLightTheme
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-50 disabled:text-emerald-200'
                            : 'bg-green-500 text-black hover:bg-green-400 disabled:bg-zinc-800 disabled:text-zinc-600'
                            }`}
                    >
                        <QrCode className="w-4 h-4" />
                        Identifier le client
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
