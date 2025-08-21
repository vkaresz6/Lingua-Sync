
import { useState, useCallback } from 'react';
import { Segment } from '../types';
import { useProject } from '../components/contexts/ProjectContext';
import { useApi } from './useApi';
import { getEvaluationAndGrammar, batchEvaluateSegments } from '../utils/geminiApi';
import { stripHtml } from '../utils/fileHandlers';
import { STRINGS } from '../strings';
import * as tmManager from '../utils/tmManager';

export const useEvaluation = (
    segments: Segment[], 
    updateSegment: (id: number, updates: Partial<Segment>) => void
) => {
    const { project, settings } = useProject();
    const { withApiTracking } = useApi();
    const [evaluatingSegmentId, setEvaluatingSegmentId] = useState<number | null>(null);
    const [isBatchEvaluating, setIsBatchEvaluating] = useState<boolean>(false);

    const handleSegmentComplete = useCallback(async (segmentId: number) => {
        const segment = segments.find(s => s.id === segmentId);
        
        if (!segment) return;

        const sourceText = stripHtml(segment.source);
        const targetText = stripHtml(segment.target);
        
        // If target is empty, revert status to draft and don't evaluate
        if (!targetText.trim()) {
            if (segment.status !== 'draft') {
                updateSegment(segmentId, { status: 'draft', evaluation: undefined, targetErrors: [] });
            }
            return;
        }

        // Add to local TM DB immediately upon completion for instant matching
        if (sourceText && targetText) {
            tmManager.addUnit({ source: sourceText, target: targetText }).catch(err => {
                console.warn("Failed to add unit to TM:", err);
            });
        }

        // Only evaluate if it's dirty
        if (!segment.isDirty) {
            return;
        }
    
        setEvaluatingSegmentId(segmentId);
        try {
            const data = await withApiTracking(() => getEvaluationAndGrammar(
                sourceText, targetText, project.context, '', 
                project.sourceLanguage, project.targetLanguage, 
                settings.prompts.evaluation, settings.model
            ));
    
            // Change status to 'translated' if it was a draft or rejected
            const newStatus = (segment.status === 'draft' || segment.status === 'rejected') ? 'translated' : segment.status;

            const updates: Partial<Segment> = {
                evaluation: data.evaluation,
                targetErrors: data.errors,
                isDirty: false, // Mark as clean after evaluation
                status: newStatus,
            };
            
            if (newStatus === 'translated' && segment.status === 'draft') {
                updates.translatorTarget = segment.target;
            }

            updateSegment(segmentId, updates);

        } catch (error) {
            console.error(STRINGS.EVALUATION_FAILED, error);
        } finally {
            setEvaluatingSegmentId(null);
        }
    }, [segments, project, settings, withApiTracking, updateSegment]);

    const handleBatchReevaluate = useCallback(async () => {
        const segmentsToReevaluate = segments
            .filter(s => stripHtml(s.target).trim() !== '' && s.status !== 'draft');
        
        if (segmentsToReevaluate.length === 0) {
            alert("No translated segments to re-evaluate.");
            return;
        }

        setIsBatchEvaluating(true);
        try {
            const batchData = segmentsToReevaluate.map(s => ({
                id: s.id,
                sourceText: stripHtml(s.source),
                targetText: stripHtml(s.target)
            }));
            
            const results = await withApiTracking(() => batchEvaluateSegments(
                batchData, project.context, project.sourceLanguage, project.targetLanguage, 
                settings.prompts.batchEvaluation, settings.model
            ));
            
            results.forEach(result => {
                updateSegment(result.id, {
                    evaluation: result.evaluation,
                    targetErrors: result.errors,
                    isDirty: false,
                });
            });

        } catch (error) {
            console.error("Batch re-evaluation failed:", error);
            alert(`Batch re-evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsBatchEvaluating(false);
        }
    }, [segments, project, settings, withApiTracking, updateSegment]);

    return {
        evaluatingSegmentId,
        handleSegmentComplete,
        isBatchEvaluating,
        handleBatchReevaluate,
    };
};
