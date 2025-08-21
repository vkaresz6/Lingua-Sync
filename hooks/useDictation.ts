import { useState, useRef, useCallback } from 'react';

// Type definitions for the Web Speech API to fix TypeScript errors.
interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    readonly transcript: string;
}

interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
}

interface UseDictationOptions {
    onTranscript: (transcript: string) => void;
    lang: string;
}

const langNameToCode: { [key: string]: string } = {
    'english': 'en-US',
    'spanish': 'es-ES',
    'french': 'fr-FR',
    'german': 'de-DE',
    'italian': 'it-IT',
    'japanese': 'ja-JP',
    'korean': 'ko-KR',
    'russian': 'ru-RU',
    'chinese': 'zh-CN',
    'portuguese': 'pt-BR',
    'hungarian': 'hu-HU',
    'ukrainian': 'uk-UA',
};

const getLangCode = (langName: string): string => {
    if (!langName) return 'en-US';
    return langNameToCode[langName.toLowerCase()] || 'en-US';
};

const SpeechRecognitionApi = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useDictation = ({ onTranscript, lang }: UseDictationOptions) => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    const startListening = useCallback(() => {
        if (!SpeechRecognitionApi) {
            const errorMessage = 'Speech recognition is not supported in this browser.';
            setError(errorMessage);
            console.error(errorMessage);
            return;
        }

        if (isListening || recognitionRef.current) {
            return;
        }

        const recognition: SpeechRecognition = new SpeechRecognitionApi();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = getLangCode(lang);

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const lastResult = event.results[event.results.length - 1];
            if (lastResult.isFinal) {
                const transcript = lastResult[0].transcript;
                onTranscript(transcript);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            setError(event.error);
            console.error('Speech recognition error:', event);
            stopListening();
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.start();

    }, [isListening, onTranscript, stopListening, lang]);

    return {
        isListening,
        error,
        startListening,
        stopListening,
    };
};
