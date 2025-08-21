
import { useState, useCallback } from 'react';
import { Segment } from '../types';
import { useProject } from '../components/contexts/ProjectContext';
import { useApi } from './useApi';
import { syncFormatting, batchSyncFormatting } from '../utils/geminiApi';
import { stripHtml } from '../utils/fileHandlers';
import { STRINGS } from '../strings';

export const useFormatting = (
    segments: Segment[], 
    activeSegment: number | null, 
    onTargetChange: (id: number, text: string) => void
) => {
    const { settings } = useProject();
    const { withApiTracking } = useApi();
    const [isSyncingFormatting, setIsSyncingFormatting] = useState<boolean>(false);
    const [isBatchSyncingFormatting, setIsBatchSyncingFormatting] = useState<boolean>(false);

    const handleSyncFormatting = useCallback(async () => {
        if (!activeSegment) return;
        const segment = segments.find(s => s.id === activeSegment);
        if (!segment || !stripHtml(segment.target).trim()) return;

        setIsSyncingFormatting(true);
        try {
            const targetText = stripHtml(segment.target);
            const formattedHtml = await withApiTracking(() => syncFormatting(segment.source, targetText, settings.prompts.syncFormatting, settings.model));
            onTargetChange(activeSegment, formattedHtml);
        } catch (error) {
            console.error(STRINGS.FAILED_TO_SYNC_FORMATTING, error);
            alert(STRINGS.FAILED_TO_SYNC_FORMATTING);
        } finally {
            setIsSyncingFormatting(false);
        }
    }, [activeSegment, segments, settings, withApiTracking, onTargetChange]);
    
    const handleBatchSyncFormatting = useCallback(async () => {
        const segmentsToFormat = segments
            .filter(s => stripHtml(s.target).trim() !== '' && s.target.includes('<p>'))
            .map(s => ({ id: s.id, sourceHtml: s.source, targetText: stripHtml(s.target) }));

        if (segmentsToFormat.length === 0) {
            alert("No segments with plain text translations to format.");
            return;
        }

        setIsBatchSyncingFormatting(true);
        try {
            const results = await withApiTracking(() => batchSyncFormatting(segmentsToFormat, settings.prompts.batchSyncFormatting, settings.model));
            
            results.forEach(result => {
                onTargetChange(result.id, result.formattedHtml);
            });

        } catch (error) {
            console.error("Batch sync formatting failed:", error);
            alert(`Batch sync formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsBatchSyncingFormatting(false);
        }
    }, [segments, settings, withApiTracking, onTargetChange]);

    return {
        isSyncingFormatting,
        isBatchSyncingFormatting,
        handleSyncFormatting,
        handleBatchSyncFormatting,
    };
};