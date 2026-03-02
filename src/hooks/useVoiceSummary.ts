import { useState, useCallback } from 'react';
import { VoiceUtterance } from './useGeminiLiveVoice';
import { Product } from '../lib/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VoiceSessionSummary {
    startTime: number;
    endTime: number;
    durationSeconds: number;
    utteranceCount: number;
    userMessageCount: number;
    assistantMessageCount: number;
    mentionedProducts: Product[];
    transcriptExcerpt: VoiceUtterance[];
    fullTranscript: VoiceUtterance[];
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useVoiceSummary() {
    const [summary, setSummary] = useState<VoiceSessionSummary | null>(null);
    const [showSummary, setShowSummary] = useState(false);

    const generateSummary = useCallback((
        transcript: VoiceUtterance[],
        sessionStartTime: number | null,
        mentionedProducts: Product[]
    ) => {
        if (transcript.length === 0) return;

        const now = Date.now();
        const start = sessionStartTime ?? now;
        const duration = Math.floor((now - start) / 1000);

        const s: VoiceSessionSummary = {
            startTime: start,
            endTime: now,
            durationSeconds: duration,
            utteranceCount: transcript.length,
            userMessageCount: transcript.filter(u => u.role === 'user').length,
            assistantMessageCount: transcript.filter(u => u.role === 'assistant').length,
            mentionedProducts,
            transcriptExcerpt: transcript.slice(-10),
            fullTranscript: [...transcript],
        };

        setSummary(s);
        setShowSummary(true);
    }, []);

    const dismissSummary = useCallback(() => {
        setShowSummary(false);
        setSummary(null);
    }, []);

    const getShareText = useCallback((): string => {
        if (!summary) return '';

        const mins = Math.floor(summary.durationSeconds / 60);
        const secs = summary.durationSeconds % 60;
        let text = `Résumé session BudTender vocal Green Moon (${mins}m${String(secs).padStart(2, '0')}s)\n`;
        text += `${summary.utteranceCount} échanges\n\n`;

        if (summary.mentionedProducts.length > 0) {
            text += `Produits recommandés :\n`;
            for (const p of summary.mentionedProducts) {
                text += `  - ${p.name} (${p.price.toFixed(2)}€)`;
                if (p.cbd_percentage) text += ` | CBD ${p.cbd_percentage}%`;
                text += '\n';
            }
            text += '\n';
        }

        text += 'greenmooncbd.fr';
        return text;
    }, [summary]);

    return { summary, showSummary, generateSummary, dismissSummary, getShareText };
}
