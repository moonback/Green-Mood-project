import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { GeminiLiveSession, type LiveSessionCallbacks } from '../lib/geminiLive';
import { LIVE_BUDTENDER_TOOLS, handleToolCall } from '../lib/geminiLiveTools';
import { getLiveBudTenderPrompt } from '../lib/budtenderPrompts';
import { getBudTenderSettings } from '../lib/budtenderSettings';
import { useLiveBudtenderStore } from '../store/liveBudtenderStore';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import {
    LiveHeader,
    LiveAudioVisualizer,
    LiveTranscript,
    LiveProductCards,
    LiveCartNotification,
    LiveControls,
} from './live-budtender-ui';

interface LiveBudTenderProps {
    onClose: () => void;
}

export default function LiveBudTender({ onClose }: LiveBudTenderProps) {
    const sessionRef = useRef<GeminiLiveSession | null>(null);
    const setError = useLiveBudtenderStore((s) => s.setError);
    const setSessionStatus = useLiveBudtenderStore((s) => s.setSessionStatus);
    const addTranscriptEntry = useLiveBudtenderStore((s) => s.addTranscriptEntry);
    const setUserAudioLevel = useLiveBudtenderStore((s) => s.setUserAudioLevel);
    const setAiAudioLevel = useLiveBudtenderStore((s) => s.setAiAudioLevel);
    const resetSession = useLiveBudtenderStore((s) => s.resetSession);
    const setMicActive = useLiveBudtenderStore((s) => s.setMicActive);

    const sessionStatus = useLiveBudtenderStore((s) => s.sessionStatus);
    const userAudioLevel = useLiveBudtenderStore((s) => s.userAudioLevel);
    const aiAudioLevel = useLiveBudtenderStore((s) => s.aiAudioLevel);
    const transcript = useLiveBudtenderStore((s) => s.transcript);
    const recommendedProducts = useLiveBudtenderStore((s) => s.recommendedProducts);
    const error = useLiveBudtenderStore((s) => s.error);
    const isMicActive = useLiveBudtenderStore((s) => s.isMicActive);
    const lastCartAction = useLiveBudtenderStore((s) => s.lastCartAction);
    const lastSubscriptionAction = useLiveBudtenderStore((s) => s.lastSubscriptionAction);

    const profile = useAuthStore((s) => s.profile);

    // Build cart summary for the system prompt
    const getCartSummary = useCallback(() => {
        const items = useCartStore.getState().items;
        if (items.length === 0) return undefined;
        return items
            .map((i) => `${i.product.name} (x${i.quantity}, ${(i.product.price * i.quantity).toFixed(2)}€)`)
            .join(', ');
    }, []);

    // Initialize session on mount
    useEffect(() => {
        // Prevent multiple initializations in StrictMode
        if (sessionRef.current) return;

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            setError('Clé API Gemini manquante (VITE_GEMINI_API_KEY)');
            setSessionStatus('error');
            return;
        }

        const settings = getBudTenderSettings();
        const userName = profile?.full_name?.split(' ')[0];

        const callbacks: LiveSessionCallbacks = {
            onTranscript: (text, sender) => {
                addTranscriptEntry({ sender, text });
            },
            onAudioLevel: (level, sender) => {
                if (sender === 'user') {
                    setUserAudioLevel(level);
                } else {
                    setAiAudioLevel(level);
                }
            },
            onFunctionCall: async (name, args) => {
                // Add system transcript entry for function call
                addTranscriptEntry({
                    sender: 'system',
                    text: `Recherche: ${name}...`,
                });
                return handleToolCall(name, args);
            },
            onStatusChange: (status) => {
                setSessionStatus(status);
            },
            onError: (err) => {
                setError(err.message);
                console.error('[LiveBudTender] Error:', err);
            },
        };

        const session = new GeminiLiveSession({
            apiKey,
            model: settings.live_model || 'gemini-2.5-flash-native-audio-preview-12-2025',
            voiceName: settings.live_voice || 'Aoede',
            systemPrompt: getLiveBudTenderPrompt(userName, getCartSummary()),
            tools: LIVE_BUDTENDER_TOOLS,
            callbacks,
        });

        sessionRef.current = session;

        // Connect
        session.connect().catch((err) => {
            console.error('[LiveBudTender] Connect failed:', err);
        });

        // Cleanup on unmount
        return () => {
            if (sessionRef.current) {
                sessionRef.current.disconnect();
                sessionRef.current = null;
            }
            resetSession();
        };
    }, [profile, getCartSummary, setError, setSessionStatus, addTranscriptEntry, setUserAudioLevel, setAiAudioLevel, resetSession]);

    const handleToggleMic = useCallback(() => {
        const session = sessionRef.current;
        if (!session) return;
        const isActive = session.toggleMicrophone();
        setMicActive(isActive);
    }, [setMicActive]);

    const handleSendText = useCallback((text: string) => {
        const session = sessionRef.current;
        if (!session) return;
        session.sendText(text);
    }, []);

    const handleEndSession = useCallback(async () => {
        const session = sessionRef.current;
        if (session) {
            await session.disconnect();
            sessionRef.current = null;
        }
        resetSession();
        onClose();
    }, [resetSession, onClose]);

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-md"
                onClick={handleEndSession}
            />

            {/* Main panel */}
            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[70] w-[calc(100vw-32px)] sm:w-[460px] h-[min(700px,90vh)] flex flex-col overflow-hidden rounded-2xl sm:rounded-[2.5rem] shadow-[0_32px_80px_rgba(0,0,0,0.7),0_0_60px_rgba(57,255,20,0.06)] live-panel-bg border border-white/[0.06]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <LiveHeader status={sessionStatus} onClose={handleEndSession} />

                {/* Audio Visualizer */}
                <div className="px-4 pt-2">
                    <LiveAudioVisualizer
                        userLevel={userAudioLevel}
                        aiLevel={aiAudioLevel}
                        status={sessionStatus}
                    />
                </div>

                {/* Transcript */}
                <LiveTranscript
                    transcript={transcript}
                    status={sessionStatus}
                />

                {/* Product Cards */}
                <LiveProductCards products={recommendedProducts} />

                {/* Error display */}
                {error && (
                    <div className="mx-4 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-[11px] text-red-400 font-medium">{error}</p>
                    </div>
                )}

                {/* Controls */}
                <LiveControls
                    isMicActive={isMicActive}
                    userAudioLevel={userAudioLevel}
                    status={sessionStatus}
                    onToggleMic={handleToggleMic}
                    onSendText={handleSendText}
                    onEndSession={handleEndSession}
                />
            </motion.div>

            {/* Cart / Subscription Notifications */}
            <LiveCartNotification
                cartAction={lastCartAction}
                subscriptionAction={lastSubscriptionAction}
            />
        </>
    );
}
