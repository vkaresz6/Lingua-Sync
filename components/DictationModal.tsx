import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useAdvancedDictation } from '../hooks/useAdvancedDictation';
import { BoundingBox } from './BoundingBox';

interface DictationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (transcript: string) => void;
}

const playDing = (frequency = 440, duration = 100, type: OscillatorType = 'sine') => {
    if (typeof window === 'undefined' || !(window.AudioContext || (window as any).webkitAudioContext)) {
        return;
    }
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (duration / 1000));

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + (duration / 1000));
};

const RecordIcon = () => (
    <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M3.5 7A4.5 4.5 0 018 2.5h8A4.5 4.5 0 0120.5 7v10a4.5 4.5 0 01-4.5 4.5H8A4.5 4.5 0 013.5 17V7zM8 4a3 3 0 00-3 3v10a3 3 0 003 3h8a3 3 0 003-3V7a3 3 0 00-3-3H8z" clipRule="evenodd" />
    </svg>
);

const StopIcon = () => (
    <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M4.5 7.5A3 3 0 017.5 4.5h9A3 3 0 0119.5 7.5v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
    </svg>
);


export const DictationModal: React.FC<DictationModalProps> = ({ isOpen, onClose, onInsert }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [rawTranscription, setRawTranscription] = useState('');

    const handleTranscriptionComplete = useCallback((transcript: string) => {
        setRawTranscription(transcript);
    }, []);

    const { isRecording, status, startRecording, stopRecording, error, timer } = useAdvancedDictation({
        canvasRef,
        onTranscriptionComplete: handleTranscriptionComplete,
    });

    useEffect(() => {
        if (isOpen) {
            setRawTranscription('');
        }
    }, [isOpen]);

    const handleToggleRecording = () => {
        if (isRecording) {
            stopRecording();
            playDing(440, 100, 'triangle'); // Stop sound
        } else {
            setRawTranscription('');
            startRecording();
            playDing(880, 100, 'sine'); // Start sound
        }
    };
    
    const handleInsert = () => {
        if(rawTranscription) {
            onInsert(rawTranscription);
        }
    }
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4" onMouseDown={onClose}>
            <BoundingBox name="dictation modal" className="!m-0 max-w-2xl w-full">
                <div className="bg-white rounded-lg shadow-2xl w-full flex flex-col max-h-[80vh]" onMouseDown={e => e.stopPropagation()}>
                    <div className="p-5 border-b border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800">Dictate Text</h2>
                        <p className="text-sm text-slate-500 mt-1">Record your voice to generate a transcript.</p>
                    </div>

                    <div className="flex-grow p-6 flex flex-col items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-center">
                            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`}></div>
                            <p className="font-mono text-lg text-slate-700">{status}</p>
                            {isRecording && <p className="font-mono text-lg text-slate-500">{timer}</p>}
                        </div>

                        <canvas ref={canvasRef} className="w-full h-24 bg-slate-100 rounded-md"></canvas>

                        <button
                            onClick={handleToggleRecording}
                            className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                        >
                            {isRecording ? <StopIcon /> : <RecordIcon />}
                        </button>
                        
                        <div className="w-full">
                            <label className="text-xs font-semibold text-slate-500">TRANSCRIPT</label>
                            <div className="mt-1 w-full min-h-[80px] p-3 border border-slate-300 rounded-md bg-slate-50 text-slate-800 text-sm">
                                {rawTranscription || <span className="text-slate-400">Transcription will appear here...</span>}
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleInsert}
                            disabled={!rawTranscription || isRecording}
                            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300"
                        >
                            Insert
                        </button>
                    </div>
                </div>
            </BoundingBox>
        </div>
    );
};