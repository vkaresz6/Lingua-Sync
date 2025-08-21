import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

interface UseAdvancedDictationOptions {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    onTranscriptionComplete: (transcript: string) => void;
}

const MODEL_NAME = 'gemini-2.5-flash';

export const useAdvancedDictation = ({ canvasRef, onTranscriptionComplete }: UseAdvancedDictationOptions) => {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState('Ready to record');
    const [error, setError] = useState<string | null>(null);
    const [timer, setTimer] = useState('00:00.00');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);
    const waveformDataArrayRef = useRef<Uint8Array | null>(null);
    const waveformDrawingIdRef = useRef<number | null>(null);
    const timerIntervalIdRef = useRef<number | null>(null);
    const recordingStartTimeRef = useRef<number>(0);

    const stopRecording = useCallback(async () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
        
        setIsRecording(false);
        if (timerIntervalIdRef.current) clearInterval(timerIntervalIdRef.current);
        if (waveformDrawingIdRef.current) cancelAnimationFrame(waveformDrawingIdRef.current);
        
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            await audioContextRef.current.close();
            audioContextRef.current = null;
        }
    }, [isRecording]);

    const getTranscription = useCallback(async (base64Audio: string, mimeType: string) => {
        setStatus('Transcribing...');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const contents = [
                { text: 'Generate a complete, detailed transcript of this audio.' },
                { inlineData: { mimeType: mimeType, data: base64Audio } },
            ];

            const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: contents,
            });

            const transcriptionText = response.text;

            if (transcriptionText) {
                onTranscriptionComplete(transcriptionText);
                setStatus('Transcription complete.');
            } else {
                throw new Error('Transcription failed or returned empty.');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error('Error getting transcription:', err);
            setError(`Transcription Error: ${errorMessage}`);
            setStatus('Error');
        }
    }, [onTranscriptionComplete]);

    const processAudio = useCallback(async (audioBlob: Blob) => {
        if (audioBlob.size === 0) {
            setStatus('No audio captured.');
            return;
        }
        setStatus('Processing audio...');
        try {
            const reader = new FileReader();
            const readResult = new Promise<string>((resolve, reject) => {
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = () => reject(reader.error);
            });
            reader.readAsDataURL(audioBlob);
            const base64Audio = await readResult;

            const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
            await getTranscription(base64Audio, mimeType);
        } catch (err) {
            console.error('Error processing audio:', err);
            setStatus('Error processing audio.');
        }
    }, [getTranscription]);

    const drawLiveWaveform = useCallback(() => {
        if (!analyserNodeRef.current || !waveformDataArrayRef.current || !canvasRef.current || !isRecording) {
            return;
        }
        
        waveformDrawingIdRef.current = requestAnimationFrame(drawLiveWaveform);
        analyserNodeRef.current.getByteFrequencyData(waveformDataArrayRef.current);
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const logicalWidth = canvas.clientWidth;
        const logicalHeight = canvas.clientHeight;
        ctx.clearRect(0, 0, logicalWidth, logicalHeight);
        
        const bufferLength = analyserNodeRef.current.frequencyBinCount;
        const numBars = Math.floor(bufferLength * 0.5);
        if (numBars === 0) return;

        const totalBarPlusSpacingWidth = logicalWidth / numBars;
        const barWidth = Math.max(1, Math.floor(totalBarPlusSpacingWidth * 0.7));
        const barSpacing = Math.max(0, Math.floor(totalBarPlusSpacingWidth * 0.3));
        let x = 0;
        
        ctx.fillStyle = '#6366f1'; // indigo-500

        for (let i = 0; i < numBars; i++) {
            const dataIndex = Math.floor(i * (bufferLength / numBars));
            const barHeightNormalized = waveformDataArrayRef.current[dataIndex] / 255.0;
            let barHeight = barHeightNormalized * logicalHeight;
            if (barHeight < 1 && barHeight > 0) barHeight = 1;
            
            const y = (logicalHeight - barHeight) / 2;
            ctx.fillRect(x, y, barWidth, barHeight);
            x += barWidth + barSpacing;
        }
    }, [canvasRef, isRecording]);

    const startRecording = useCallback(async () => {
        setError(null);
        if (isRecording) return;

        try {
            setStatus('Requesting permission...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Setup visualizer
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;
            const source = audioContext.createMediaStreamSource(stream);
            const analyserNode = audioContext.createAnalyser();
            analyserNode.fftSize = 256;
            analyserNode.smoothingTimeConstant = 0.75;
            source.connect(analyserNode);
            analyserNodeRef.current = analyserNode;
            waveformDataArrayRef.current = new Uint8Array(analyserNode.frequencyBinCount);

            // Setup MediaRecorder
            audioChunksRef.current = [];
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
                processAudio(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setStatus('Recording...');
            
            // Start UI updates
            requestAnimationFrame(drawLiveWaveform);
            recordingStartTimeRef.current = Date.now();
            timerIntervalIdRef.current = window.setInterval(() => {
                const elapsedMs = Date.now() - recordingStartTimeRef.current;
                const totalSeconds = Math.floor(elapsedMs / 1000);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                const hundredths = Math.floor((elapsedMs % 1000) / 10);
                setTimer(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`);
            }, 50);

        } catch (err) {
            const error = err as Error;
            console.error('Error starting recording:', error);
            setError(error.message);
            setStatus('Error');
        }
    }, [isRecording, drawLiveWaveform, processAudio]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isRecording) {
                stopRecording();
            }
        };
    }, [isRecording, stopRecording]);


    return {
        isRecording,
        status,
        error,
        timer,
        startRecording,
        stopRecording,
    };
};
