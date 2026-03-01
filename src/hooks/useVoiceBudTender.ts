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
        return `- ${p.name} (Slug: ${p.slug}, ${cat}, ${specs || '?'}, ${p.price}€)${p.description ? ' — ' + p.description.slice(0, 60) : ''}${aromas ? ' | Arômes: ' + aromas : ''}${benefits ? ' | Effets: ' + benefits : ''}`;
    }).join('\n');

    const greeting = userName ? `Le client s'appelle ${userName}.` : '';

    return `Tu es BudTender, le conseiller CBD expert de Green Moon. ${greeting}

RÔLE : Tu es le BudTender de Green Moon, un expert passionné en CBD. Ton but est d'aider le client à trouver le produit idéal et à l'ajouter à son panier.

CONSIGNES DE DIALOGUE (INDISPENSABLE) :
1. **ZÉRO BALISE** : Ne commence JAMAIS tes phrases par des en-têtes comme "**Greeting**" ou "**Thinking aloud**". Parle directement, comme au téléphone.
2. **PAS DE MARKDOWN** : N'utilise jamais de gras (**), d'italique (*), de listes à puces ou de headers (#). Le flux audio doit être du texte pur.
3. **BRIÈVETÉ** : 1 à 2 phrases par réponse. Sois percutant et chaleureux.

GESTION DU PANIER (FLUX DE TRAVAIL) :
- **ÉTAPE 1 (Suggérer)** : Propose un produit du catalogue ci-dessous selon les besoins du client.
- **ÉTAPE 2 (Confirmer)** : Si le client semble intéressé, demande TOUJOURS : "Est-ce que je l'ajoute à votre panier ?".
- **ÉTAPE 3 (Agir)** : Appelle l'outil 'add_to_cart' avec le 'product_slug' correspondant UNIQUEMENT si le client dit "Oui" (ou équivalent).
- **ÉTAPE 4 (Valider)** : Une fois l'outil appelé, dis : "C'est fait, j'ai ajouté [Nom du produit] à votre panier."

CATALOGUE PRODUITS (${products.length}) :
${catalog}

Commence maintenant en accueillant le client avec enthousiasme.`;
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
        onAddToCart?: (productSlug: string) => void
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
                console.log('[useVoiceBudTender] 🛠️ Tool call data:', JSON.stringify(toolCall));
                const calls = toolCall.functionCalls || toolCall.function_calls || [];

                for (const call of calls) {
                    const slug = call.args?.product_slug || call.args?.productSlug;
                    if (call.name === 'add_to_cart' && slug) {
                        console.log('[useVoiceBudTender] ✅ Adding product to cart (slug):', slug);
                        onAddToCart?.(slug);
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
