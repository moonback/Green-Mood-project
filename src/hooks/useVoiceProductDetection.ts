import { useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '../lib/types';
import { VoiceUtterance } from './useGeminiLiveVoice';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DetectedProduct {
    product: Product;
    detectedAt: number;
    utteranceIndex: number;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

const MAX_PRODUCT_CARDS = 4;

export function useVoiceProductDetection(
    transcript: VoiceUtterance[],
    products: Product[],
    isActive: boolean
) {
    const [detectedProducts, setDetectedProducts] = useState<DetectedProduct[]>([]);
    const processedCountRef = useRef(0);

    useEffect(() => {
        if (!isActive) {
            processedCountRef.current = 0;
            setDetectedProducts([]);
            return;
        }

        // Only process new utterances
        const startIdx = processedCountRef.current;
        if (transcript.length <= startIdx) return;
        const newUtterances = transcript.slice(startIdx);
        processedCountRef.current = transcript.length;

        for (let i = 0; i < newUtterances.length; i++) {
            const u = newUtterances[i];
            if (u.role !== 'assistant') continue;

            const textLower = u.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            for (const product of products) {
                const nameLower = product.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

                // Only match product names longer than 3 chars to avoid false positives
                if (nameLower.length > 3 && textLower.includes(nameLower)) {
                    setDetectedProducts(prev => {
                        // Avoid duplicates
                        if (prev.some(d => d.product.id === product.id)) return prev;
                        const next = [...prev, {
                            product,
                            detectedAt: Date.now(),
                            utteranceIndex: startIdx + i,
                        }];
                        // Keep max cards
                        return next.slice(-MAX_PRODUCT_CARDS);
                    });
                }
            }
        }
    }, [transcript, products, isActive]);

    const dismissProduct = useCallback((productId: string) => {
        setDetectedProducts(prev => prev.filter(d => d.product.id !== productId));
    }, []);

    const clearDetectedProducts = useCallback(() => {
        setDetectedProducts([]);
        processedCountRef.current = 0;
    }, []);

    return { detectedProducts, dismissProduct, clearDetectedProducts };
}
