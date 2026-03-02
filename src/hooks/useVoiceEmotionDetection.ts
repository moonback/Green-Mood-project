import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceUtterance } from './useGeminiLiveVoice';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EmotionState = 'neutral' | 'confident' | 'curious' | 'hesitant' | 'enthusiastic';

export interface EmotionIndicator {
    emotion: EmotionState;
    confidence: number; // 0..1
    message: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMOTION_MESSAGES: Record<EmotionState, string> = {
    neutral: '',
    confident: 'Vous savez ce que vous cherchez',
    curious: 'Vous explorez vos options',
    hesitant: 'Prenez votre temps, je suis là pour vous guider',
    enthusiastic: 'Excellent choix, vous avez du goût !',
};

// French linguistic markers
const HESITATION_PATTERNS = /\b(euh|hm+|hmm+|bah|bof|je sais pas|peut-[eê]tre|pas s[uû]r|comment dire|je ne sais pas)\b/gi;
const CONFIDENCE_PATTERNS = /\b(je veux|je cherche|j'aime|exactement|parfait|c'est [cç]a|g[eé]nial|super|j'adore|excellent)\b/gi;
const CURIOSITY_PATTERNS = /\b(c'est quoi|diff[eé]rence|qu'est-ce|comment|pourquoi|quel|quelle|lequel|laquelle|expliqu)\b/gi;
const QUESTION_PATTERN = /\?/g;
const EXCLAMATION_PATTERN = /!/g;

const MIN_CONFIDENCE_THRESHOLD = 0.3;

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useVoiceEmotionDetection(transcript: VoiceUtterance[], isActive: boolean) {
    const [currentEmotion, setCurrentEmotion] = useState<EmotionIndicator>({
        emotion: 'neutral',
        confidence: 0,
        message: '',
    });
    const [emotionHistory, setEmotionHistory] = useState<EmotionState[]>([]);
    const lastProcessedRef = useRef(0);

    useEffect(() => {
        if (!isActive) {
            lastProcessedRef.current = 0;
            setCurrentEmotion({ emotion: 'neutral', confidence: 0, message: '' });
            setEmotionHistory([]);
            return;
        }

        // Only analyze new utterances
        const startIdx = lastProcessedRef.current;
        if (transcript.length <= startIdx) return;
        const newUtterances = transcript.slice(startIdx);
        lastProcessedRef.current = transcript.length;

        const userTexts = newUtterances
            .filter(u => u.role === 'user')
            .map(u => u.text);

        if (userTexts.length === 0) return;

        const combinedText = userTexts.join(' ');

        // Score each emotion
        const hesitationCount = (combinedText.match(HESITATION_PATTERNS) || []).length;
        const questionCount = (combinedText.match(QUESTION_PATTERN) || []).length;
        const exclamationCount = (combinedText.match(EXCLAMATION_PATTERN) || []).length;
        const confidenceCount = (combinedText.match(CONFIDENCE_PATTERNS) || []).length;
        const curiosityCount = (combinedText.match(CURIOSITY_PATTERNS) || []).length;

        const scores: Record<EmotionState, number> = {
            neutral: 0.5,
            hesitant: hesitationCount * 2,
            curious: questionCount * 1.5 + curiosityCount * 2,
            confident: confidenceCount * 2 + exclamationCount * 0.5,
            enthusiastic: exclamationCount * 2 + confidenceCount * 1,
        };

        // Find highest scoring emotion
        let maxEmotion: EmotionState = 'neutral';
        let maxScore = 0;
        for (const [emotion, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                maxEmotion = emotion as EmotionState;
            }
        }

        const confidence = Math.min(1, maxScore / 4);

        if (confidence > MIN_CONFIDENCE_THRESHOLD) {
            setCurrentEmotion({
                emotion: maxEmotion,
                confidence,
                message: EMOTION_MESSAGES[maxEmotion],
            });
            setEmotionHistory(prev => [...prev, maxEmotion]);
        }
    }, [transcript, isActive]);

    const dominantEmotion = useCallback((): EmotionState => {
        if (emotionHistory.length === 0) return 'neutral';
        const counts: Record<string, number> = {};
        for (const e of emotionHistory) {
            counts[e] = (counts[e] || 0) + 1;
        }
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as EmotionState;
    }, [emotionHistory]);

    return { currentEmotion, emotionHistory, dominantEmotion };
}
