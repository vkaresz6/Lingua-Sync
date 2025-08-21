import { useState, useCallback } from 'react';
import { Segment } from '../types';
import { useProject } from '../components/contexts/ProjectContext';
import { useApi } from './useApi';
import { analyzeStructure, analyzeDates } from '../utils/geminiApi';
import { stripHtml } from '../utils/fileHandlers';
import { STRINGS } from '../strings';

export const useSegmentAnalysis = (
    segments: Segment[], 
    updateSegment: (id: number, updates: Partial<Segment>) => void
) => {
    const { project, settings } = useProject();
    const { withApiTracking } = useApi();

    const [segmentsBeingStructured, setSegmentsBeingStructured] = useState<number[]>([]);
    const [segmentsBeingDated, setSegmentsBeingDated] = useState<number[]>([]);

    const createAnalysisHandler = (
        analysisType: 'structure' | 'date',
        apiFunction: any,
        prompt: string,
        loadingStateSetter: React.Dispatch<React.SetStateAction<number[]>>
    ) => useCallback(async (segmentId: number) => {
        const segment = segments.find(s => s.id === segmentId);
        if (!segment) return;

        const visibleFlag = `is${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)}Visible` as keyof Segment;
        let htmlField = `${analysisType}HighlightHtml` as keyof Segment; // Note: 'date' and 'entity' use this pattern
        if (analysisType === 'structure') {
             htmlField = 'structuredSourceHtml' as keyof Segment;
        }

        if (segment[visibleFlag]) {
            updateSegment(segmentId, { [visibleFlag]: false });
            return;
        }

        loadingStateSetter(prev => [...prev, segmentId]);
        try {
            if (segment[htmlField]) {
                updateSegment(segmentId, { [visibleFlag]: true });
                return;
            }

            const sourceText = stripHtml(segment.source);
            if (!sourceText) throw new Error(STRINGS.NO_SOURCE_TEXT_TO_ANALYZE);
            
            const html = await withApiTracking(() => apiFunction(sourceText, prompt, project.sourceLanguage, project.targetLanguage, settings.model));
            
            updateSegment(segmentId, { [htmlField]: html, [visibleFlag]: true });

        } catch (error) {
            console.error(`Failed to analyze ${analysisType}:`, error);
            alert(`Failed to analyze ${analysisType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            loadingStateSetter(prev => prev.filter(id => id !== segmentId));
        }
    }, [segments, project, settings, withApiTracking, updateSegment, prompt]);


    return {
        segmentsBeingStructured,
        segmentsBeingDated,
        handleToggleStructure: createAnalysisHandler('structure', analyzeStructure, settings.prompts.structureAnalysis, setSegmentsBeingStructured),
        handleToggleDateHighlight: createAnalysisHandler('date', analyzeDates, settings.prompts.dateAnalysis, setSegmentsBeingDated),
    };
};