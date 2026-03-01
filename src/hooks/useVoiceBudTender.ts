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
        return `- ${p.name} (ID: ${p.id}, ${cat}, ${specs || '?'}, ${p.price}€)${p.description ? ' — ' + p.description.slice(0, 60) : ''}${aromas ? ' | Arômes: ' + aromas : ''}${benefits ? ' | Effets: ' + benefits : ''}`;
    }).join('\n');

    const greeting = userName ? `Le client s'appelle ${userName}.` : '';

    return `Tu es BudTender, le conseiller CBD expert de Green Moon. ${greeting}

RÔLE : Tu es le BudTender de Green Moon, un expert passionné et bienveillant en CBD et cannabinoïdes. Ton but est de conseiller le client et de l'aider à COMPLÉTER SON PANIER par la voix.

RÈGLES IMPORTANTES (MODE VOCAL) :
- **STYLE NATUREL** : Parle comme un humain, sans jamais utiliser de balises de type "**Thinking aloud**", "**Greeting**" ou de listes à puces. Pas de gras ni de headers. 
- **COURT ET EFFICACE** : Tes réponses doivent être concises (maximum 2-3 phrases) pour rester fluide en audio.
- **SELECTION CATALOGUE** : Ne propose QUE des produits présents dans la liste ci-dessous.
- **CONFIRMATION OBLIGATOIRE (STRICTE)** : Avant d'utiliser l'outil 'add_to_cart', tu DOIS demander au client : "Souhaitez-vous que je l'ajoute à votre panier ?". 
- **COMMANDE D'ACTION** : Tu n'appelles l'outil 'add_to_cart' QUE ET UNIQUEMENT SI l'utilisateur a répondu "Oui", "D'accord", "Vas-y" ou équivalent APRÈS ta question de confirmation.
- **FEEDBACK RÉUSSI** : Une fois l'ajout fait (seulement après accord), confirme simplement : "C'est fait, j'ai mis [Nom] dans votre panier."

CATALOGUE PRODUITS (${products.length}) :
${catalog}

Commence chaleureusement.`;
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
        userName?: string | null,
        onAddToCart?: (productId: string) => void
    ) => {
        if (sessionRef.current) return;

        setStatus('connecting');
        setTranscript([]);
        setErrorMessage(null);

        const callbacks: GeminiLiveCallbacks = {
            onOpen: () => setStatus('listening'),

            onTranscript: (text, role) => {
                setTranscript(prev => [...prev, {
                    id: `${Date.now()}-${Math.random()}`,
                    role,
                    text,
                }]);
                if (role === 'model') setStatus('speaking');
            },

            onSpeakingChange: (isSpeaking) => {
                setStatus(isSpeaking ? 'speaking' : 'listening');
            },

            onToolCall: (toolCall) => {
                console.log('[useVoiceBudTender] Tool call received:', toolCall);
                const calls = toolCall.functionCalls || [];
                for (const call of calls) {
                    if (call.name === 'add_to_cart' && call.args?.product_id) {
                        console.log('[useVoiceBudTender] Adding product to cart:', call.args.product_id);
                        onAddToCart?.(call.args.product_id);
                    }
                }
            },

            onError: (err) => {
                console.error('[useVoiceBudTender] Error:', err);
                setErrorMessage(err.message || 'Erreur vocale');
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
