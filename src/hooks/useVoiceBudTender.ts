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
        return `- ${p.name} (Slug Tool: ${p.slug}, Catégorie: ${cat}, ${specs || '?'}, ${p.price}€)${p.description ? ' — ' + p.description.slice(0, 60) : ''}${aromas ? ' | Arômes: ' + aromas : ''}${benefits ? ' | Effets: ' + benefits : ''}`;
    }).join('\n');

    const greeting = userName ? `Le client s'appelle ${userName}.` : '';

    return `Tu es BudTender, le conseiller CBD expert et dynamique de Green Moon. ${greeting}

RÔLE : Tu es là pour conseiller le client et gérer son panier par la voix. Tu dois être chaleureux, professionnel et efficace.

CONSIGNES DE DIALOGUE (CRITICAL) :
1. **VOIX NATURELLE** : Parle comme une personne réelle au téléphone. PAS d'en-têtes, PAS de balises, PAS de formatage (gras, italique). 
2. **BRIÈVETÉ** : 1 à 2 phrases par tour. Sois direct.
3. **PAS DE HALLUCINATION D'ACTION** : Ne dis JAMAIS que tu as ajouté un produit si tu n'as pas EXÉCUTÉ l'appel de fonction 'add_to_cart' dans le même message. Si tu dis "C'est fait" sans appeler l'outil, le client verra un panier vide et sera frustré.

GESTION DU PANIER (PROTOCOLE STRICT) :
- **ÉTAPE 1 (Suggérer)** : Propose un produit spécifique du catalogue ci-dessous.
- **ÉTAPE 2 (Validation)** : Si le client est intéressé, demande TOUJOURS : "Est-ce que je l'ajoute à votre panier ?".
- **ÉTAPE 3 (Action)** : Si le client dit oui ou demande l'ajout, tu DOIS :
  a) Appeler l'outil 'add_to_cart' avec le 'product_slug' EXACT du catalogue.
  b) Confirmer oralement : "C'est fait, j'ai ajouté [Nom] au panier."
- **IDENTIFIANT** : Utilise toujours la valeur 'Slug Tool' fournie dans le catalogue pour l'outil.

CATALOGUE PRODUITS (${products.length}) :
${catalog}

Accueille le client et demande comment tu peux l'aider aujourd'hui.`;
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
                console.log('[useVoiceBudTender] 🛠️ Tool call data received:', JSON.stringify(toolCall));

                // Robustness: handle both top-level and nested tool calls via GemineLiveSession
                // Support both functionCalls (plural) and function_calls (snake_case)
                const calls = toolCall.functionCalls || toolCall.function_calls || [];

                if (calls.length === 0) {
                    console.warn('[useVoiceBudTender] Tool call received but no function calls found inside.');
                    return;
                }

                for (const call of calls) {
                    console.log(`[useVoiceBudTender] Processing call: ${call.name}`, call.args);

                    // Robustness: handle both product_slug (snake_case) and productSlug (camelCase)
                    const slug = call.args?.product_slug || call.args?.productSlug;

                    if (call.name === 'add_to_cart' && slug) {
                        console.log('[useVoiceBudTender] ✅ Adding product to cart (slug):', slug);
                        onAddToCart?.(slug);
                    } else if (call.name === 'add_to_cart') {
                        console.error('[useVoiceBudTender] ❌ add_to_cart called but product_slug is missing!', call.args);
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
