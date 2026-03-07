/**
 * QuizOptions.tsx
 *
 * Renders the multiple-choice option buttons for a BudTender quiz step.
 * Highlights the selected answer and disables options once the step is past.
 */

import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { QuizOption, QuizStep } from '../../lib/budtenderSettings';
import { Answers } from '../../services/aiService';

interface QuizOptionsProps {
    options: QuizOption[];
    stepId: string;
    answers: Answers;
    messages: Array<{ sender: string; text?: string }>;
    stepIndex: number;
    quizSteps: QuizStep[];
    onAnswer: (option: QuizOption, stepId: string) => void;
}

export default function QuizOptions({ options, stepId, answers, messages, stepIndex, quizSteps, onAnswer }: QuizOptionsProps) {
    const currentStepIndex = quizSteps.findIndex(s => s.id === stepId);

    return (
        <div className="grid grid-cols-1 gap-2.5 mt-3">
            {options.map((opt) => {
                const isSelected = answers[stepId] === opt.value;
                const hasAnsweredNext = messages.some(m => m.sender === 'user' && m.text === opt.label);
                const isDisabled = stepIndex !== currentStepIndex;

                return (
                    <motion.button
                        key={opt.value}
                        whileHover={{ x: 4, backgroundColor: 'rgba(57,255,20,0.05)' }}
                        disabled={isDisabled}
                        onClick={() => onAnswer(opt, stepId)}
                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all ${isSelected || hasAnsweredNext
                            ? 'bg-green-neon/10 border-green-neon/50 text-green-neon shadow-[0_0_20px_rgba(57,255,20,0.05)]'
                            : 'bg-zinc-800/30 border-zinc-800 hover:border-zinc-600 text-zinc-400 group'
                            }`}
                    >
                        <span className="text-2xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{opt.emoji}</span>
                        <span className="text-sm font-bold tracking-tight">{opt.label}</span>
                        <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${isSelected || hasAnsweredNext ? 'text-green-neon rotate-90' : 'text-zinc-600'}`} />
                    </motion.button>
                );
            })}
        </div>
    );
}
