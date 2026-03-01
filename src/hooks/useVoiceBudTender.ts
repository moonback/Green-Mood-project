import { useState, useRef, useCallback } from 'react';
import { GeminiLiveSession, type GeminiLiveCallbacks } from '../lib/geminiLive';
import { Product } from '../lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type VoiceStatus =
    | 'idle'
    | 'connecting'
    | 'listening'
    | 'speaking'
    | 'error';

export interface VoiceTranscriptEntry {
    id: string;
    role: 'user' | 'model';
    text: string;
}

// ─── Build voice system prompt with full product catalog ──────────────────────

function buildVoiceSystemPrompt(
    products: Product[],
    userName?: string | null
): string {
    const catalog = products.map(p => {
        const cat = p.category?.slug ?? 'inconnu';
        const aromas = (p.attributes?.aromas ?? []).join(', ');
        const benefits = (p.attributes?.benefits ?? []).join(', ');
        const cbd = p.cbd_percentage ? `CBD ${p.cbd_percentage}%` : '';
        const thc = p.thc_max ? `THC max ${p.thc_max}%` : '';
        const specs = [cbd, thc].filter(Boolean).join(', ');
        return `- ${p.name} (${cat}, ${specs || '?'}, ${p.price}€, stock:${p.stock_quantity})${p.description ? ' — ' + p.description.slice(0, 80) : ''}${aromas ? ' | Arômes: ' + aromas : ''}${benefits ? ' | Effets: ' + benefits : ''}`;
    }).join('\n');

    const greeting = userName ? `Le client s'appelle ${userName}.` : '';

    return `Tu es BudTender, le conseiller CBD expert et vocal de la boutique Green Moon CBD. ${greeting}

RÔLE : Conseiller les clients sur les produits CBD par la voix, en français, de façon naturelle et conversationnelle.

RÈGLES ABSOLUES :
- Réponds TOUJOURS en français oral, naturel, sans markdown ni listes
- Réponses courtes : 2 à 3 phrases maximum par tour
- Tu DOIS recommander uniquement des produits du catalogue ci-dessous
- Ne mentionne jamais de pourcentages de THC sauf si demandé
- Adapte ton ton au niveau du client (débutant = rassurant, expert = technique)
- Tu peux proposer d'ajouter un produit au panier si le client semble intéressé
- Si hors-sujet : redirige poliment vers ton rôle de conseiller Green Moon

CATALOGUE PRODUITS DISPONIBLES (${products.length} produits actifs) :
${catalog}

Commence par te présenter chaleureusement et demander comment tu peux aider.`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVoiceBudTender() {
    const sessionRef = useRef<GeminiLiveSession | null>(null);

    const [status, setStatus] = useState<VoiceStatus>('idle');
    const [transcript, setTranscript] = useState<VoiceTranscriptEntry[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isActive = status !== 'idle' && status !== 'error';

    // ── Start voice session ────────────────────────────────────────────────────

    const startVoice = useCallback(async (
        products: Product[],
        apiKey: string,
        userName?: string | null
    ) => {
        if (sessionRef.current) return; // already active

        setStatus('connecting');
        setTranscript([]);
        setErrorMessage(null);

        const callbacks: GeminiLiveCallbacks = {
            onOpen: () => {
                setStatus('listening');
            },

            onTranscript: (text, role) => {
                setTranscript(prev => [...prev, {
                    id: `${Date.now()}-${Math.random()}`,
                    role,
                    text,
                }]);
                // When model speaks, set speaking status briefly
                if (role === 'model') {
                    setStatus('speaking');
                }
            },

            onSpeakingChange: (isSpeaking) => {
                setStatus(isSpeaking ? 'speaking' : 'listening');
            },

            onError: (err) => {
                console.error('[useVoiceBudTender] Error:', err);
                setErrorMessage(err.message || 'Erreur de connexion vocale');
                setStatus('error');
                sessionRef.current = null;
            },

            onClose: () => {
                setStatus('idle');
                sessionRef.current = null;
            },
        };

        try {
            const session = new GeminiLiveSession(apiKey, callbacks);
            sessionRef.current = session;
            const systemInstruction = buildVoiceSystemPrompt(products, userName);
            await session.connect(systemInstruction);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Impossible de démarrer la session vocale';
            setErrorMessage(msg);
            setStatus('error');
            sessionRef.current = null;
        }
    }, []);

    // ── Stop voice session ─────────────────────────────────────────────────────

    const stopVoice = useCallback(async () => {
        if (!sessionRef.current) return;
        await sessionRef.current.disconnect();
        sessionRef.current = null;
        setStatus('idle');
    }, []);

    // ── Toggle mute ────────────────────────────────────────────────────────────

    const [isMuted, setIsMuted] = useState(false);

    const toggleMute = useCallback(() => {
        if (!sessionRef.current) return;
        const newMuted = !isMuted;
        sessionRef.current.setMuted(newMuted);
        setIsMuted(newMuted);
    }, [isMuted]);

    // ── Clear transcript ────────────────────────────────────────────────────────

    const clearTranscript = useCallback(() => {
        setTranscript([]);
    }, []);

    return {
        status,
        isActive,
        isMuted,
        transcript,
        errorMessage,
        startVoice,
        stopVoice,
        toggleMute,
        clearTranscript,
    };
}
