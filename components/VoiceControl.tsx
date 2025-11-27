import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { triggerHapticFeedback } from '../utils';

// Declare standard web speech API types
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

declare global {
    interface Window {
        SpeechRecognition: { new(): SpeechRecognition };
        webkitSpeechRecognition: { new(): SpeechRecognition };
    }
}

const VoiceControl: React.FC<{
    onScore: (points: number, type: 'standard' | 'clean10' | 'clean20') => void;
    onEndTurn: () => void;
    onUndo: () => void;
}> = ({ onScore, onEndTurn, onUndo }) => {
    const { t, i18n } = useTranslation();
    const [isListening, setIsListening] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const feedbackTimeoutRef = useRef<number | null>(null);

    const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

    useEffect(() => {
        if (!isSupported) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true; // Keep listening until stopped
        recognition.interimResults = false;
        recognition.lang = i18n.language === 'cs' ? 'cs-CZ' : 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const lastResultIndex = event.results.length - 1;
            const transcript = event.results[lastResultIndex][0].transcript.toLowerCase().trim();
            console.log("Voice Command:", transcript);
            handleCommand(transcript);
        };

        recognition.onend = () => {
            if (isListening) {
                // If it stopped but state says listening (e.g. timeout), restart
                try {
                    recognition.start();
                } catch (e) {
                    console.error("Failed to restart speech recognition", e);
                    setIsListening(false);
                }
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error("Speech recognition error", event.error);
            if (event.error === 'not-allowed') {
                setIsListening(false);
                alert(t('cameraError')); // Reuse error msg or generic
            }
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
        };
    }, [i18n.language, isSupported]);

    const showFeedback = (text: string) => {
        setFeedback(text);
        if (feedbackTimeoutRef.current) window.clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = window.setTimeout(() => setFeedback(null), 2000);
    };

    const handleCommand = (text: string) => {
        triggerHapticFeedback(50);
        const lang = i18n.language === 'cs' ? 'cs' : 'en';

        // Arrays of triggers for cleaner logic
        const nextTurnKeywordsCs = ['dále', 'další', 'dál', 'konec', 'hotovo', 'ukončit', 'piš', 'zapiš', 'střídat', 'končím'];
        const undoKeywordsCs = ['zpět', 'vrátit', 'chyba'];
        const clean10KeywordsCs = ['čistých 10', 'čistých deset'];
        
        const nextTurnKeywordsEn = ['next', 'end', 'finish', 'done', 'pass', 'switch', 'write'];
        const undoKeywordsEn = ['undo', 'back', 'mistake'];
        const clean10KeywordsEn = ['clean 10', 'clean ten'];

        // --- CZECH COMMANDS ---
        if (lang === 'cs') {
            if (nextTurnKeywordsCs.some(keyword => text.includes(keyword))) {
                onEndTurn();
                showFeedback(t('voice.feedback.next'));
                return;
            }
            if (undoKeywordsCs.some(keyword => text.includes(keyword))) {
                onUndo();
                showFeedback(t('voice.feedback.undo'));
                return;
            }
            if (clean10KeywordsCs.some(keyword => text.includes(keyword))) {
                onScore(10, 'clean10');
                showFeedback(t('voice.feedback.added', { count: 10 }));
                return;
            }
            
            // Numbers parsing
            if (text.includes('jedna') || text.includes('jeden') || text.includes('bod')) {
                onScore(1, 'standard');
                showFeedback(t('voice.feedback.added', { count: 1 }));
                return;
            }
            if (text.includes('dva') || text.includes('dvě')) {
                onScore(2, 'standard');
                showFeedback(t('voice.feedback.added', { count: 2 }));
                return;
            }
            if (text.includes('tři')) {
                onScore(3, 'standard');
                showFeedback(t('voice.feedback.added', { count: 3 }));
                return;
            }
             if (text.includes('čtyři')) {
                onScore(4, 'standard');
                showFeedback(t('voice.feedback.added', { count: 4 }));
                return;
            }
             if (text.includes('pět')) {
                onScore(5, 'standard');
                showFeedback(t('voice.feedback.added', { count: 5 }));
                return;
            }
        } 
        // --- ENGLISH COMMANDS ---
        else {
            if (nextTurnKeywordsEn.some(keyword => text.includes(keyword))) {
                onEndTurn();
                showFeedback(t('voice.feedback.next'));
                return;
            }
            if (undoKeywordsEn.some(keyword => text.includes(keyword))) {
                onUndo();
                showFeedback(t('voice.feedback.undo'));
                return;
            }
            if (clean10KeywordsEn.some(keyword => text.includes(keyword))) {
                onScore(10, 'clean10');
                showFeedback(t('voice.feedback.added', { count: 10 }));
                return;
            }

            // Numbers
            if (text.includes('one') || text.includes('point') || text.includes('add 1')) {
                onScore(1, 'standard');
                showFeedback(t('voice.feedback.added', { count: 1 }));
                return;
            }
            if (text.includes('two')) {
                onScore(2, 'standard');
                showFeedback(t('voice.feedback.added', { count: 2 }));
                return;
            }
            if (text.includes('three')) {
                onScore(3, 'standard');
                showFeedback(t('voice.feedback.added', { count: 3 }));
                return;
            }
             if (text.includes('four')) {
                onScore(4, 'standard');
                showFeedback(t('voice.feedback.added', { count: 4 }));
                return;
            }
             if (text.includes('five')) {
                onScore(5, 'standard');
                showFeedback(t('voice.feedback.added', { count: 5 }));
                return;
            }
        }
        
        // Generic number parsing fallback (simple)
        const numberMatch = text.match(/\d+/);
        if (numberMatch) {
            const points = parseInt(numberMatch[0], 10);
            if (points > 0 && points < 50) { // Safety limit
                onScore(points, 'standard');
                showFeedback(t('voice.feedback.added', { count: points }));
            }
        }
    };

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error("Error starting recognition", e);
            }
        }
    };

    if (!isSupported) return null;

    return (
        <>
            <button 
                onClick={toggleListening}
                className={`fixed bottom-20 right-4 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 border-4 ${isListening ? 'bg-red-500 border-red-300 animate-pulse scale-110' : 'bg-[--color-surface-light] border-[--color-border] opacity-80 hover:opacity-100'}`}
                aria-label={isListening ? t('voice.stop') : t('voice.start')}
            >
                <span className="text-3xl">{isListening ? '🎙️' : '🎤'}</span>
            </button>
            
            {/* Listening Indicator / Feedback Toast */}
            {isListening && (
                <div className="fixed bottom-36 right-4 z-40 bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-lg shadow-lg max-w-[200px] text-center">
                    {feedback ? (
                        <span className="font-bold text-[--color-green]">{feedback}</span>
                    ) : (
                        <span className="text-sm italic">{t('voice.listening')}</span>
                    )}
                </div>
            )}
        </>
    );
};

export default VoiceControl;