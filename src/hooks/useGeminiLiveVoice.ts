import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

interface Options {
  products?: unknown[];
  pastProducts?: unknown[];
  savedPrefs?: unknown;
  userName?: string | null;
  onAddItem?: (...args: unknown[]) => void;
  deliveryFee?: number;
  deliveryFreeThreshold?: number;
  onCloseSession?: () => void;
  onViewProduct?: (...args: unknown[]) => void;
  onNavigate?: (path: string) => void;
}

/**
 * Legacy hook name kept for compatibility with existing imports.
 *
 * The previous Gemini live integration has been removed. Bytez does not expose
 * a drop-in realtime browser voice session in this app yet, so the hook now
 * fails gracefully while keeping the UI stable.
 */
export function useGeminiLiveVoice({ onCloseSession }: Options) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const [compatibilityError] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    if (!window.isSecureContext) return 'Sécurisé (HTTPS) requis.';
    if (!navigator.mediaDevices?.getUserMedia) return 'Microphone non supporté.';
    return null;
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const stopSession = useCallback(() => {
    if (!mountedRef.current) return;
    setVoiceState('idle');
    setError(null);
    setIsMuted(false);
  }, []);

  const startSession = useCallback(async () => {
    if (!mountedRef.current) return;

    if (compatibilityError) {
      setError(compatibilityError);
      setVoiceState('error');
      return;
    }

    setVoiceState('connecting');
    setError(null);

    const apiKey = import.meta.env.VITE_BYTEZ_API_KEY;
    if (!apiKey) {
      setError('Missing VITE_BYTEZ_API_KEY.');
      setVoiceState('error');
      return;
    }

    setError('Le mode vocal temps réel est momentanément indisponible avec la configuration Bytez actuelle.');
    setVoiceState('error');
    onCloseSession?.();
  }, [compatibilityError, onCloseSession]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    voiceState,
    error,
    isMuted,
    isSupported: !compatibilityError,
    compatibilityError,
    startSession,
    stopSession,
    toggleMute,
  };
}
