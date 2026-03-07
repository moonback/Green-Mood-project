/**
 * ChatInputBar.tsx
 *
 * The chat input form at the bottom of the BudTender panel.
 * Includes a text field and submit button, plus a legal disclaimer.
 */

import { type FormEvent } from 'react';
import { SendHorizontal } from 'lucide-react';

interface ChatInputBarProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (e?: FormEvent) => void;
    isTyping: boolean;
}

export default function ChatInputBar({ value, onChange, onSubmit, isTyping }: ChatInputBarProps) {
    return (
        <div className="p-6 sm:p-10 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-3xl shrink-0">
            <div className="max-w-7xl mx-auto w-full space-y-4">
                <form
                    onSubmit={onSubmit}
                    className="flex items-center gap-3 bg-zinc-900 border-2 border-zinc-700 rounded-[2rem] p-2 focus-within:border-green-neon transition-all shadow-2xl"
                >
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Posez votre question à l'IA ou décrivez vos besoins..."
                        className="flex-1 bg-transparent border-none text-base text-white px-5 py-3 focus:outline-none placeholder:text-zinc-500"
                    />
                    <button
                        type="submit"
                        disabled={!value.trim() || isTyping}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-green-neon text-black disabled:opacity-20 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-neon/40"
                    >
                        <SendHorizontal className="w-6 h-6" />
                    </button>
                </form>
                <div className="flex flex-col items-center gap-1.5 px-1">
                    <p className="text-[10px] text-zinc-500 text-center leading-relaxed max-w-2xl">
                        <span className="text-amber-500/80 font-bold uppercase tracking-widest mr-1">Avis important :</span>
                        BudTender est une IA de conseil. Les informations fournies ne constituent pas un avis médical.
                        Consultez un médecin avant toute consommation, surtout en cas de traitement ou de grossesse.
                    </p>
                    <p className="text-[9px] text-green-neon font-black uppercase tracking-[0.4em] opacity-50 mt-1">
                        BudTender IA Expérience
                    </p>
                </div>
            </div>
        </div>
    );
}
