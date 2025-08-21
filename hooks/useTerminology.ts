import { useState, useCallback } from 'react';
import { Term, TermUnit, Segment } from '../types';
import { useProject } from '../components/contexts/ProjectContext';
import { useUIState } from '../components/contexts/UIStateContext';
import { useApi } from './useApi';
import { extractTerms, getDefinition, getTermSuggestion } from '../utils/geminiApi';
import { stripHtml } from '../utils/fileHandlers';
import { STRINGS } from '../strings';

export const useTerminology = (
    loadedTerms: Term[], 
    segments: Segment[],
    addNewTerms: (terms: Term[]) => void
) => {
    const { project, settings } = useProject();
    const { withApiTracking } = useApi();
    const { openModal, closeModal } = useUIState();

    const [isExtractingTerms, setIsExtractingTerms] = useState<boolean>(false);
    
    const handleExtractTerms = useCallback(async () => {
        setIsExtractingTerms(true);
        try {
            const fullSourceText = segments.map(s => stripHtml(s.source)).join('\n');
            const extractedTerms = await withApiTracking(() => extractTerms(
                fullSourceText, project.context, settings.prompts.termExtraction, 
                project.sourceLanguage, project.targetLanguage, settings.model
            ));
            
            const existingSources = new Set(loadedTerms.map(t => t.source.toLowerCase()));
            const newTermUnits = extractedTerms.filter(t => !existingSources.has(t.source.toLowerCase()));
            const newTerms = newTermUnits.map((tu, i) => ({...tu, id: Date.now() + i}));

            if (newTerms.length > 0) {
                addNewTerms(newTerms);
                alert(STRINGS.EXTRACT_TERMS_SUCCESS(newTerms.length));
            } else {
                alert(STRINGS.EXTRACT_TERMS_NO_NEW);
            }
        } catch (error) {
            console.error("Failed to extract terms:", error);
            alert(STRINGS.EXTRACT_TERMS_FAILED(error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsExtractingTerms(false);
        }
    }, [segments, project, settings, loadedTerms, withApiTracking, addNewTerms]);
    
    const handleShowDefinition = useCallback((word: string, x: number, y: number) => {
        openModal('definition', { word, position: { x, y } });
    }, [openModal]);

    const handleFetchDefinition = useCallback(async (word: string): Promise<string> => {
        return withApiTracking(() => getDefinition(
            word,
            project.sourceLanguage,
            project.targetLanguage,
            settings.prompts.definition,
            settings.model
        ));
    }, [project, settings, withApiTracking]);

    const handleFetchTermSuggestions = useCallback(async (sourceTerm: string) => {
        return withApiTracking(() => getTermSuggestion(
            sourceTerm,
            project.context,
            project.sourceLanguage,
            project.targetLanguage,
            settings.prompts.termSuggestion,
            settings.model
        ));
    }, [project, settings, withApiTracking]);

    const handleNewTermRequest = useCallback((sourceText: string) => {
        openModal('newTerm', { sourceTerm: sourceText });
    }, [openModal]);

    const handleSaveNewTerm = useCallback((term: TermUnit) => {
        addNewTerms([{ ...term, id: Date.now() }]);
        closeModal();
    }, [addNewTerms, closeModal]);

    return {
        isExtracting: isExtractingTerms,
        handleExtractTerms,
        handleShowDefinition,
        handleFetchDefinition,
        handleNewTermRequest,
        handleSaveNewTerm,
        handleFetchTermSuggestions,
    };
};
