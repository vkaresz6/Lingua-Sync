
import { useState, useCallback } from 'react';
import { Segment } from '../types';
import { useProject } from '../components/contexts/ProjectContext';
import { useApi } from './useApi';
import { getTranslation, batchTranslateSegments } from '../utils/geminiApi';
import { stripHtml } from '../utils/fileHandlers';

export const useMachineTranslation = (
    segments: Segment[], 
    activeSegment: number | null
) => {
    const { project, settings } = useProject();
    const { withApiTracking } = useApi();
    const [machineTranslations, setMachineTranslations] = useState<string[]>([]);
    const [isTranslating, setIsTranslating] = useState<boolean>(false);
    const [isAutoTranslating, setIsAutoTranslating] = useState(false);

    const handleGenerateMachineTranslations = useCallback(async () => {
        if (!activeSegment) return;
        const segment = segments.find(s => s.id === activeSegment);
        if (!segment) return;
        
        setIsTranslating(true);
        setMachineTranslations([]);
        try {
            const sourceText = stripHtml(segment.source);
            const translations = await withApiTracking(() => getTranslation(
                sourceText, project.context, project.sourceLanguage, project.targetLanguage, settings.prompts.translation, settings.model
            ));
            setMachineTranslations(translations);
        } catch (error) {
            console.error("Failed to get machine translations:", error);
            alert(`Failed to get machine translations: ${error instanceof Error ? error.message : 'Unknown Error'}`);
        } finally {
            setIsTranslating(false);
        }
    }, [activeSegment, segments, project, settings, withApiTracking]);

    const handleAutoTranslateSegments = useCallback(async (
        endSegmentNumber: number, 
        onComplete: (translations: {id: number, text: string}[]) => void
    ) => {
        if (!activeSegment) return;
        const startIndex = segments.findIndex(s => s.id === activeSegment);
        if (startIndex === -1) return;
        
        const endIndex = endSegmentNumber - 1;
        if (endIndex < startIndex) return;

        const segmentsToTranslate = segments.slice(startIndex, endIndex + 1);
        const sourceTexts = segmentsToTranslate.map(s => stripHtml(s.source));

        setIsAutoTranslating(true);
        try {
            const translations = await withApiTracking(() => batchTranslateSegments(
                sourceTexts, project.context, project.sourceLanguage, project.targetLanguage, settings.prompts.batchTranslation, settings.model
            ));
            
            const results = segmentsToTranslate.map((segment, i) => ({
                id: segment.id,
                text: translations[i],
            }));
            onComplete(results);
        } catch (error) {
            console.error("Auto-translation failed:", error);
            alert(`Auto-translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsAutoTranslating(false);
        }
    }, [activeSegment, segments, project, settings, withApiTracking]);

    return {
        machineTranslations,
        isTranslating,
        isAutoTranslating,
        handleGenerateMachineTranslations,
        handleAutoTranslateSegments,
    };
};