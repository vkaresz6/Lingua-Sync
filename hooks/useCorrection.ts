





import { useState, useCallback } from 'react';
import { Segment, SourceError } from '../types';
import { useProject } from '../components/contexts/ProjectContext';
import { useApi } from './useApi';
import { correctGrammarInHtml, correctPunctuation, splitSegment, correctTranscription } from '../utils/geminiApi';
import { stripHtml } from '../utils/fileHandlers';
import { STRINGS } from '../strings';
import { getGitHubAuth } from '../utils/projectManager';

export const useCorrection = (
    segments: Segment[], 
    updateSegment: (id: number, updates: Partial<Segment>) => void
) => {
    const { settings } = useProject();
    const { withApiTracking } = useApi();
    const [segmentsBeingCorrected, setSegmentsBeingCorrected] = useState<number[]>([]);
    const [lastUpdatedBySystem, setLastUpdatedBySystem] = useState<number | null>(null);

    const onTargetChange = (segmentId: number, newText: string) => {
        const currentUser = getGitHubAuth()?.login;
        updateSegment(segmentId, { target: newText, isDirty: true, lastModifiedBy: currentUser });
    };

    const handleCorrectGrammar = useCallback(async (segmentId: number) => {
        const segment = segments.find(s => s.id === segmentId);
        if (!segment || !segment.target.trim()) return;

        setSegmentsBeingCorrected(prev => [...prev, segmentId]);
        try {
            const correctedHtml = await withApiTracking(() => correctGrammarInHtml(segment.target, settings.prompts.grammarCorrectionHtml, settings.model));
            onTargetChange(segmentId, correctedHtml);
            setLastUpdatedBySystem(segmentId);
        } catch (error) {
            console.error(STRINGS.AUTOCORRECT_FAILED, error);
            alert(STRINGS.AUTOCORRECT_FAILED);
        } finally {
            setSegmentsBeingCorrected(prev => prev.filter(id => id !== segmentId));
        }
    }, [segments, settings, withApiTracking, onTargetChange]);

    const handleCorrectPunctuation = useCallback(async (segmentId: number) => {
        const segment = segments.find(s => s.id === segmentId);
        if (!segment || !stripHtml(segment.target).trim()) return;

        const originalText = stripHtml(segment.target);
        
        try {
            const correctedText = await withApiTracking(() => correctPunctuation(originalText, settings.prompts.punctuationCorrection, settings.model));
            if (correctedText !== originalText) {
                onTargetChange(segmentId, `<p>${correctedText}</p>`);
            }
        } catch (error) {
            console.error(STRINGS.CORRECT_PUNCTUATION_FAILED, error);
            alert(STRINGS.CORRECT_PUNCTUATION_FAILED);
        }
    }, [segments, settings, withApiTracking, onTargetChange]);
    

    const handleApplyCorrection = useCallback((segmentId: number, errorToApply: SourceError) => {
        const segment = segments.find(s => s.id === segmentId);
        if (!segment) return;
        
        // Replace only the first occurrence to be safe
        const newTarget = segment.target.replace(errorToApply.error, errorToApply.correction);
        
        // Remove the applied error from the list
        const newErrors = (segment.targetErrors || []).filter(
            err => !(err.error === errorToApply.error && err.correction === errorToApply.correction)
        );

        const currentUser = getGitHubAuth()?.login;
        updateSegment(segmentId, {
            target: newTarget,
            targetErrors: newErrors,
            isDirty: true,
            lastModifiedBy: currentUser,
        });
        
    }, [segments, updateSegment]);
    
    const handleSplitSegment = useCallback(async (segmentToSplit: Segment, sourceEditorDiv: HTMLDivElement) => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || !sourceEditorDiv.contains(selection.getRangeAt(0).startContainer)) {
            alert(`Please place your cursor in the source text of the segment to split it.`);
            return null;
        }

        const contextPhrase = selection.getRangeAt(0).startContainer.textContent || '';
        if (!contextPhrase.trim()) {
            alert("Cannot determine split point. Please click within text.");
            return null;
        }

        try {
            const splitResult = await withApiTracking(() => splitSegment(segmentToSplit.source, segmentToSplit.target, contextPhrase, settings.prompts.splitSegment, settings.model));
            
            const { sourceHtml1, sourceHtml2, targetHtml1, targetHtml2 } = splitResult;
            if (!sourceHtml1 && !sourceHtml2) throw new Error("AI did not return valid source HTML for the split.");
    
            return {
                newSegment1: { ...segmentToSplit, id: Date.now(), source: sourceHtml1 || '', target: targetHtml1 || '', isDirty: true },
                newSegment2: { ...segmentToSplit, id: Date.now() + 1, source: sourceHtml2 || '', target: targetHtml2 || '', isDirty: true },
            };
        } catch (error) {
            console.error("Failed to split segment:", error);
            alert(`Failed to split segment: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    }, [settings, withApiTracking]);

    const handleTranscriptionCorrection = useCallback(async (segmentId: number, originalText: string, newTranscript: string) => {
        setSegmentsBeingCorrected(prev => [...prev, segmentId]);
        setLastUpdatedBySystem(null);
        try {
            const correctedText = await withApiTracking(() => correctTranscription(
                stripHtml(originalText),
                newTranscript,
                settings.prompts.transcriptionCorrection,
                settings.model
            ));
            onTargetChange(segmentId, `<p>${correctedText}</p>`);
            setLastUpdatedBySystem(segmentId);
        } catch (error) {
            console.error("Transcription correction failed:", error);
            alert(`Transcription correction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            // Fallback to simple concatenation
            onTargetChange(segmentId, `${originalText} ${newTranscript}`);
        } finally {
            setSegmentsBeingCorrected(prev => prev.filter(id => id !== segmentId));
        }
    }, [settings, withApiTracking, onTargetChange]);

    const clearLastUpdatedBySystem = useCallback(() => setLastUpdatedBySystem(null), []);
    
    const insertHtmlAtCursor = useCallback((html: string, segmentId: number) => {
        const segment = segments.find(s => s.id === segmentId);
        if(segment) {
            onTargetChange(segmentId, segment.target + html);
        }
    }, [segments, onTargetChange]);

    return {
        segmentsBeingCorrected,
        lastUpdatedBySystem,
        handleCorrectGrammar,
        handleCorrectPunctuation,
        handleSplitSegment,
        clearLastUpdatedBySystem,
        insertHtmlAtCursor,
        handleApplyCorrection,
        handleTranscriptionCorrection,
    };
};