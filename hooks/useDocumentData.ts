
import { useState, useCallback, useEffect } from 'react';
import { ProjectState, Segment, Term, TermUnit } from '../types';
import { getGitHubAuth } from '../utils/projectManager';

export const useDocumentData = (initialState: ProjectState) => {
    const [segments, setSegments] = useState<Segment[]>(initialState.data.segments);
    const [loadedTerms, setLoadedTerms] = useState<Term[]>([]); // Terms are loaded async, so start empty
    const [sourceDocumentHtml, setSourceDocumentHtml] = useState<string | undefined>(initialState.sourceDocumentHtml);

    useEffect(() => {
        setSegments(initialState.data.segments);
        setSourceDocumentHtml(initialState.sourceDocumentHtml);
        // Do not reset loadedTerms here as they are loaded from GitHub and managed separately.
    }, [initialState]);

    const updateSegment = useCallback((segmentId: number, updates: Partial<Segment>) => {
        setSegments(prev => prev.map(seg => seg.id === segmentId ? { ...seg, ...updates } : seg));
    }, []);

    const updateSegmentTarget = useCallback((segmentId: number, newText: string) => {
        const currentUser = getGitHubAuth()?.login;
        updateSegment(segmentId, { target: newText, isDirty: true, lastModifiedBy: currentUser });
    }, [updateSegment]);

    const joinSegments = useCallback((segmentId: number) => {
        let joinedSegmentId: number | null = null;
        setSegments(prev => {
            const index = prev.findIndex(s => s.id === segmentId);
            if (index === -1 || index >= prev.length - 1) {
                return prev;
            }

            const currentSegment = prev[index];
            const nextSegment = prev[index + 1];

            const newSource = currentSegment.source + " " + nextSegment.source;
            const newTarget = currentSegment.target + " " + nextSegment.target;

            const joinedSegment: Segment = {
                ...currentSegment,
                source: newSource,
                target: newTarget,
                evaluation: undefined,
                targetErrors: undefined,
                isDirty: true,
            };
            
            joinedSegmentId = joinedSegment.id;

            const newSegments = [...prev];
            newSegments.splice(index, 2, joinedSegment);
            return newSegments;
        });
        return joinedSegmentId;
    }, []);

    const splitSegmentInState = useCallback((segmentIndex: number, newSegment1: Segment, newSegment2: Segment) => {
        setSegments(prev => {
            const newSegments = [...prev];
            newSegments.splice(segmentIndex, 1, newSegment1, newSegment2);
            return newSegments;
        });
    }, []);
    
    const addTerm = useCallback((term: TermUnit) => {
        const newTerm: Term = { ...term, id: Date.now() };
        setLoadedTerms(prev => [...prev, newTerm]);
    }, []);

    const addNewTerms = useCallback((termsToAdd: Term[]) => {
        setLoadedTerms(prevTerms => {
            const existingSources = new Set(prevTerms.map(t => t.source.toLowerCase()));
            const uniqueNewTerms = termsToAdd.filter(t => {
                const sourceLower = t.source.toLowerCase();
                if (existingSources.has(sourceLower)) {
                    return false;
                }
                existingSources.add(sourceLower);
                return true;
            });
            return [...prevTerms, ...uniqueNewTerms];
        });
    }, []);

    const updateWholeDocument = useCallback((newSegments: Segment[], newHtml?: string) => {
        setSegments(newSegments);
        setSourceDocumentHtml(newHtml);
    }, []);

    return {
        segments,
        setSegments,
        loadedTerms,
        setLoadedTerms,
        sourceDocumentHtml,
        setSourceDocumentHtml,
        updateSegment,
        updateSegmentTarget,
        joinSegments,
        splitSegmentInState,
        addTerm,
        addNewTerms,
        updateWholeDocument,
    };
};
