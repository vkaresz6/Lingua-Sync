


import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ProjectState, Term, PaneLayout, PaneId, TranslationUnit, TermUnit, Segment, SegmentStatus } from '../types';
import { stripHtml, parseDocxForProject, parsePdfToText, getDocxXmlContent, exportToDocxAdvanced, exportProjectFile, rebuildDocx } from '../utils/fileHandlers';
import { segmentText as apiSegmentText, getQuickTranslation, ApiResponse } from '../utils/geminiApi';
import { getGitHubAuth } from '../utils/projectManager';
import * as gh from '../utils/githubApi';
import { INITIAL_PANE_LAYOUT } from '../constants';
import { STRINGS } from '../strings';
import { useDocumentData } from './useDocumentData';
import { useApi } from './useApi';
import { useSession } from '../components/contexts/SessionContext';
import * as tmManager from '../utils/tmManager';


// --- Helper function for Levenshtein distance ---
const levenshtein = (s1: string, s2: string): number => {
    if (s1.length > s2.length) {
        [s1, s2] = [s2, s1];
    }
    const distances = Array.from({ length: s1.length + 1 }, (_, i) => i);
    for (let j = 0; j < s2.length; j++) {
        let previousDiagonal = distances[0];
        distances[0] = j + 1;
        for (let i = 0; i < s1.length; i++) {
            const temp = distances[i + 1];
            if (s1[i] === s2[j]) {
                distances[i + 1] = previousDiagonal;
            } else {
                distances[i + 1] = Math.min(previousDiagonal, distances[i], distances[i + 1]) + 1;
            }
            previousDiagonal = temp;
        }
    }
    return distances[s1.length];
};

const calculateSimilarity = (s1: string, s2: string): number => {
    const s1Lower = s1.toLowerCase();
    const s2Lower = s2.toLowerCase();
    const maxLength = Math.max(s1Lower.length, s2Lower.length);
    if (maxLength === 0) return 1.0;
    const distance = levenshtein(s1Lower, s2Lower);
    return 1.0 - distance / maxLength;
};

// --- Helper function for generating HTML diff ---
const generateDiffedHtml = (oldText: string, newText: string): string => {
    // A robust, word-based diff implementation using Longest Common Subsequence (LCS)
    const oldWords = oldText.split(/(\s+)/); // Split by whitespace but keep it as a token
    const newWords = newText.split(/(\s+)/);

    // Create an LCS matrix
    const matrix = Array(oldWords.length + 1).fill(null).map(() => Array(newWords.length + 1).fill(0));
    for (let i = 1; i <= oldWords.length; i++) {
        for (let j = 1; j <= newWords.length; j++) {
            if (oldWords[i - 1] === newWords[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1] + 1;
            } else {
                matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
            }
        }
    }
    
    // Backtrack through the matrix to build the diff
    const result = [];
    let i = oldWords.length, j = newWords.length;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
            result.unshift({ value: oldWords[i - 1], type: 'common' });
            i--; j--;
        } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
            result.unshift({ value: newWords[j - 1], type: 'added' });
            j--;
        } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
            // This word was removed from the old text. We don't render it.
            i--;
        } else {
          break; // Should not be reached
        }
    }
    
    // Construct the HTML string from the diff result
    const html = result.map(part => {
        // Basic HTML escaping for the text content
        const escapedValue = part.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        if (part.type === 'added') {
            return `<span class="proofread-change">${escapedValue}</span>`;
        }
        return escapedValue;
    }).join('');

    // Since the input was plain text, the output must be valid HTML for a contentEditable cell,
    // which usually requires a block-level wrapper.
    return `<p>${html}</p>`;
};


export const useCatTool = (initialState: ProjectState) => {
    const {
        segments,
        setSegments,
        loadedTerms,
        setLoadedTerms,
        sourceDocumentHtml,
        updateSegment,
        updateSegmentTarget,
        joinSegments,
        splitSegmentInState,
        addNewTerms,
        updateWholeDocument,
    } = useDocumentData(initialState);
    const { withApiTracking } = useApi();
    const { activeSegmentId: activeSegment, onSegmentFocus, addTokens } = useSession();
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    const [allTmMatches, setAllTmMatches] = useState<Record<number, { source: string; target: string; score: number; }>>({});
    const [isMatchingTm, setIsMatchingTm] = useState<boolean>(false);
    const [paneLayout, setPaneLayout] = useState<PaneLayout>(INITIAL_PANE_LAYOUT);
    const [sidebarWidth, setSidebarWidth] = useState(500);
    const [bottomPanelHeight, setBottomPanelHeight] = useState(window.innerHeight * 0.3);
    const [sxDevContent, setSxDevContent] = useState('');
    const [isFetchingDocxXml, setIsFetchingDocxXml] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isAdvancedExporting, setIsAdvancedExporting] = useState<boolean>(false);
    const [isRebuildingDocx, setIsRebuildingDocx] = useState<boolean>(false);
    const [isExpExporting, setIsExpExporting] = useState<boolean>(false);
    const [tmMatches, setTmMatches] = useState<{ source: string; target: string; score: number; }[]>([]);
    const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
    const [videoDuration, setVideoDuration] = useState<number>(0);

    const segmentRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const sourceSegmentRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const hasAutoMatched = useRef(false);


    const translationStats = useMemo(() => {
        let charCount = 0; // no spaces
        let wordCount = 0;
        let charCountWithSpaces = 0;
        let terminologyHits = 0;

        const translatedSegments = segments.filter(s => stripHtml(s.target).trim() !== '');

        const termRegexes = loadedTerms.map(term => ({
            regex: new RegExp(`\\b${term.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'),
            term: term
        }));

        for (const segment of translatedSegments) {
            const text = stripHtml(segment.target);
            charCount += text.replace(/\s/g, '').length;
            
            const normalizedText = text.trim().replace(/\s+/g, ' ');
            charCountWithSpaces += normalizedText.length;

            const words = normalizedText.split(' ').filter(Boolean);
            wordCount += words.length;

            if (termRegexes.length > 0) {
                for (const { regex } of termRegexes) {
                    const matches = text.match(regex);
                    if (matches) {
                        terminologyHits += matches.length;
                    }
                }
            }
        }
    
        const tmHitsFuzzy = Object.values(allTmMatches).filter(m => m.score < 1.0 && m.score >= 0.7).length;
        const tmHits100 = Object.values(allTmMatches).filter(m => m.score === 1.0).length;

        return { charCount, wordCount, charCountWithSpaces, terminologyHits, tmHitsFuzzy, tmHits100 };
    }, [segments, loadedTerms, allTmMatches]);

    const currentState: ProjectState = useMemo(() => ({ ...initialState,
        data: { segments },
        project: { ...initialState.project, 
            translationMemories: initialState.project.translationMemories || [], 
            termDatabases: initialState.project.termDatabases || [],
        },
        session: { ...initialState.session, activeSegmentId: activeSegment },
        settings: initialState.settings,
        sourceDocumentHtml,
    }), [initialState, segments, activeSegment, sourceDocumentHtml]);
    
    useEffect(() => {
        if (activeSegment !== null) {
            const activeSegmentRef = segmentRefs.current[activeSegment];
            if (activeSegmentRef) {
                setTimeout(() => activeSegmentRef.focus(), 0);
            }
        }
    }, [activeSegment]);
    
    useEffect(() => {
        if (!initialState.project.youtubeUrl) {
            setPaneLayout(prev => ({
                sidebar: prev.sidebar.filter(p => p !== 'youtube-player'),
                bottom: prev.bottom.filter(p => p !== 'youtube-player'),
            }));
        }
    }, [initialState.project.youtubeUrl]);
    
    useEffect(() => {
        const initTm = async () => {
            await tmManager.openDB();
            
            // This flag prevents re-loading on every project switch if the data is already in IndexedDB
            if (sessionStorage.getItem('tm_loaded_from_github')) {
                return;
            }
    
            const auth = getGitHubAuth();
            const sc = currentState.sourceControl;
            const tmFiles = currentState.project.translationMemories;
    
            if (!auth || !sc || !tmFiles || tmFiles.length === 0) {
                return;
            }
    
            console.log("Loading remote TMs into local database...");
    
            const allUnits: TranslationUnit[] = [];
            const tmFolderPath = 'translation_memories';
    
            for (const tmFileName of tmFiles) {
                try {
                    const { content } = await gh.getFileContent(auth.token, sc.owner, sc.repo, `${tmFolderPath}/${tmFileName}`);
                    const units = content.trim().split('\n').map(line => JSON.parse(line));
                    allUnits.push(...units);
                } catch (error) {
                    console.error(`Failed to load TM file: ${tmFileName}`, error);
                }
            }
            
            if (allUnits.length > 0) {
                await tmManager.bulkAddUnits(allUnits);
                sessionStorage.setItem('tm_loaded_from_github', 'true');
                console.log(`Loaded ${allUnits.length} TUs into local database.`);
            }
        };
    
        if (currentState.sourceControl?.provider === 'github') {
            initTm();
        }
    }, [currentState.sourceControl, currentState.project.translationMemories]);
    
    useEffect(() => {
        const loadTermDbs = async () => {
            const auth = getGitHubAuth();
            const sc = currentState.sourceControl;
            const dbFiles = currentState.project.termDatabases;

            if (!auth || !sc || !dbFiles || !dbFiles.length) {
                setLoadedTerms([]);
                return;
            }

            const allTerms: Term[] = [];
            const termDbFolderPath = 'terminology_databases';

            for (const dbFileName of dbFiles) {
                try {
                    const { content } = await gh.getFileContent(auth.token, sc.owner, sc.repo, `${termDbFolderPath}/${dbFileName}`);
                    const units: TermUnit[] = content.trim().split('\n').map(line => JSON.parse(line));
                    const terms = units.map((unit, index) => ({...unit, id: Date.now() + index}));
                    allTerms.push(...terms);
                } catch (error) {
                    console.error(`Failed to load TermDB file: ${dbFileName}`, error);
                }
            }
            setLoadedTerms(allTerms);
        };

        if (currentState.sourceControl?.provider === 'github') {
            loadTermDbs();
        }
    }, [currentState.sourceControl, currentState.project.termDatabases, setLoadedTerms]);

    const handleSegmentFocus = useCallback((id: number) => {
        onSegmentFocus(id);
        const segment = segments.find(s => s.id === id);
        
        if (segment) {
            const sourceContainsTable = /<table/i.test(segment.source);
            const targetIsEmpty = stripHtml(segment.target).trim() === '';
    
            if (sourceContainsTable && targetIsEmpty) {
                const rowMatches = segment.source.match(/<tr/gi);
                if (rowMatches && rowMatches.length > 0) {
                    const rowCount = rowMatches.length;
                    const firstRowMatch = segment.source.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
                    if (firstRowMatch) {
                        const colCount = (firstRowMatch[1].match(/<(td|th)/gi) || []).length;
                        if (colCount > 0) {
                            let newTable = '<table><tbody>';
                            for (let r = 0; r < rowCount; r++) {
                                newTable += '<tr>';
                                for (let c = 0; c < colCount; c++) {
                                    newTable += '<td><p></p></td>';
                                }
                                newTable += '</tr>';
                            }
                            newTable += '</tbody></table>';
                            updateSegmentTarget(id, newTable);
                        }
                    }
                }
            }
        }
    }, [segments, updateSegmentTarget, onSegmentFocus]);

    const handleApplyTmMatch = useCallback((segmentId: number, targetText: string) => {
        updateSegmentTarget(segmentId, `<p>${targetText}</p>`);
    }, [updateSegmentTarget]);

    const findTmMatchesForSegment = useCallback(async (segment: Segment) => {
        const sourceText = stripHtml(segment.source);
        if (!sourceText) return [];
    
        const allTUs = await tmManager.getAllUnits();
        if (allTUs.length === 0) return [];
        
        return allTUs
            .map(unit => ({
                source: unit.source,
                target: unit.target,
                score: calculateSimilarity(sourceText, unit.source)
            }))
            .filter(match => match.score > 0.7)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }, []);

    useEffect(() => {
        if (activeSegment !== null) {
            const segment = segments.find(s => s.id === activeSegment);
            if (segment) {
                findTmMatchesForSegment(segment).then(setTmMatches);
            }
        } else {
            setTmMatches([]);
        }
    }, [activeSegment, segments, findTmMatchesForSegment]);

    const handleFindAllTmMatches = useCallback(async () => {
        setIsMatchingTm(true);
        const allMatches: Record<number, { source: string; target: string; score: number; }> = {};
        
        const matchPromises = segments.map(async (segment) => {
            const matches = await findTmMatchesForSegment(segment);
            if (matches.length > 0) {
                return { segmentId: segment.id, match: matches[0] };
            }
            return null;
        });
    
        const results = await Promise.all(matchPromises);
        results.forEach(result => {
            if (result) {
                allMatches[result.segmentId] = result.match;
            }
        });
        
        setAllTmMatches(allMatches);
        setIsMatchingTm(false);
    }, [segments, findTmMatchesForSegment]);

    useEffect(() => {
        const shouldRun = currentState.sourceControl && !hasAutoMatched.current;
        if (shouldRun) {
            tmManager.openDB().then(() => {
                handleFindAllTmMatches();
                hasAutoMatched.current = true;
            });
        }
    }, [currentState.sourceControl, handleFindAllTmMatches]);


    const handleTranslateSelection = useCallback(async (text: string) => {
        if (!activeSegment) return;
        const segment = segments.find(s => s.id === activeSegment);
        if (!segment) return;

        const context = stripHtml(segment.source);
        
        try {
            const translation = await withApiTracking(() => getQuickTranslation(
                text,
                context,
                currentState.project.sourceLanguage,
                currentState.project.targetLanguage,
                currentState.settings.prompts.quickTranslate,
                currentState.settings.model
            ));
            
            setToastMessage(`"${text}" → "${translation}"`);
            setTimeout(() => setToastMessage(null), 4000);
        } catch (e) {
            console.error("Quick translation failed:", e);
            alert(`Quick translation failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }

    }, [activeSegment, segments, currentState, withApiTracking]);

    const handleReorderSidebarPanes = useCallback((dragIndex: number, hoverIndex: number) => {
        setPaneLayout(prev => {
            const newSidebar = [...prev.sidebar];
            const [removed] = newSidebar.splice(dragIndex, 1);
            newSidebar.splice(hoverIndex, 0, removed);
            return { ...prev, sidebar: newSidebar };
        });
    }, []);

    const handleDockPane = useCallback((paneId: PaneId, target: 'sidebar' | 'bottom') => {
        setPaneLayout(prev => {
            const source = target === 'sidebar' ? 'bottom' : 'sidebar';
            if (prev[target].includes(paneId)) return prev;
            const newSourceList = prev[source].filter(p => p !== paneId);
            const newTargetList = [...prev[target], paneId];
            return { ...prev, [source]: newSourceList, [target]: newTargetList };
        });
    }, []);

    const handleSidebarResize = useCallback((newWidth: number) => {
        const minWidth = 250;
        const maxWidth = window.innerWidth - 400;
        setSidebarWidth(Math.max(minWidth, Math.min(newWidth, maxWidth)));
    }, []);
    
    const handleBottomPanelResize = useCallback((newHeight: number) => {
        const minHeight = 100;
        const maxHeight = window.innerHeight - 200; // Leave 200px for the top part
        setBottomPanelHeight(Math.max(minHeight, Math.min(newHeight, maxHeight)));
    }, []);
    
    const handleResegmentProject = useCallback(async () => {
        if (!window.confirm(STRINGS.RESEGMENT_CONFIRM)) return;

        setIsLoading(true);
        try {
            let dataUrl: string | undefined;
            const fileName = currentState.project.name;

            if (currentState.sourceFile?.content) {
                dataUrl = currentState.sourceFile.content;
            } else if (currentState.sourceControl) {
                const auth = getGitHubAuth();
                if (!auth) throw new Error(STRINGS.GITHUB_NOT_CONNECTED);
                const { owner, repo } = currentState.sourceControl;
                const path = `source_document/${fileName}`;
                
                try {
                    const { content: base64Content } = await gh.getRawFileContent(auth.token, owner, repo, path);
                    const mimeType = fileName.endsWith('.pdf') 
                        ? 'application/pdf' 
                        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    dataUrl = `data:${mimeType};base64,${base64Content}`;
                } catch (e) {
                    if (e instanceof Error && e.message.includes('404')) {
                         throw new Error(`Could not find the source document ('${fileName}') in the GitHub repository. Make sure it exists under the 'source_document' folder.`);
                    }
                    throw e;
                }
            }

            if (!dataUrl) {
                throw new Error(STRINGS.RESEGMENT_UNSUPPORTED);
            }

            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], fileName, { type: blob.type });

            let newSegments: Segment[] = [];
            let newSourceDocumentHtml: string | undefined = undefined;
            const { prompts, model } = currentState.settings;

            if (file.name.endsWith('.docx')) {
                const result = await parseDocxForProject(file, prompts.segmentation, model);
                newSegments = result.segments;
                newSourceDocumentHtml = result.sourceDocumentHtml;
            } else if (file.name.endsWith('.pdf')) {
                const rawText = await parsePdfToText(file);
                if (rawText.trim()) {
                    const { data: sentences, apiCalls, inputTokens, outputTokens } = await apiSegmentText(rawText, prompts.segmentation, model);
                    addTokens(inputTokens, outputTokens, apiCalls);

                    const tempDoc = document.createElement('body');
                    newSegments = sentences.map((text, index) => {
                        const id = Date.now() + index;
                        const p = document.createElement('p');
                        p.textContent = text;
                        const sourceHTML = p.outerHTML;
                        p.setAttribute('data-lingua-id', String(id));
                        tempDoc.appendChild(p);
                        return { id, source: sourceHTML, target: '', status: 'draft' };
                    });
                    newSourceDocumentHtml = tempDoc.innerHTML;
                }
            } else {
                throw new Error("Unsupported file type for re-segmentation.");
            }
            
            updateWholeDocument(newSegments, newSourceDocumentHtml);
            onSegmentFocus(newSegments.length > 0 ? newSegments[0].id : null);
            alert(STRINGS.RESEGMENT_SUCCESS);
        } catch (error) {
            console.error("Resegmentation failed:", error);
            alert(`Resegmentation failed: ${error instanceof Error ? error.message : STRINGS.UNKNOWN_ERROR}`);
        } finally {
            setIsLoading(false);
        }
    }, [currentState, addTokens, updateWholeDocument, onSegmentFocus]);


    const handleFetchDocxXml = useCallback(async () => {
        const sc = currentState.sourceControl;
        const auth = getGitHubAuth();

        if (!sc || !auth || !currentState.project.name.endsWith('.docx')) {
            alert("This feature is only available for .docx projects stored on GitHub.");
            return;
        }
        
        if (!paneLayout.sidebar.includes('sxDev') && !paneLayout.bottom.includes('sxDev')) {
            handleDockPane('sxDev', 'bottom');
        }

        setIsFetchingDocxXml(true);
        setSxDevContent('Fetching XML...');
        try {
            const { owner, repo } = sc;
            const path = `source_document/${currentState.project.name}`;
            const { content: base64Content } = await gh.getRawFileContent(auth.token, owner, repo, path);
            const xmlContent = await getDocxXmlContent(base64Content);
            setSxDevContent(xmlContent);

        } catch (e) {
            const errorMessage = `Failed to fetch DOCX XML: ${e instanceof Error ? e.message : 'Unknown error'}`;
            setSxDevContent(errorMessage);
            console.error(errorMessage);
        } finally {
            setIsFetchingDocxXml(false);
        }

    }, [currentState, paneLayout, handleDockPane]);

    const handleAdvancedExport = useCallback(async () => {
        if (!currentState.sourceControl || !currentState.project.name) {
            alert("This project is not linked to GitHub or has no source file name.");
            return;
        }
        setIsAdvancedExporting(true);
        setToastMessage("Starting advanced export...");
        try {
            const auth = getGitHubAuth();
            if (!auth) {
                alert("Please connect to GitHub.");
                return;
            }
            const { owner, repo } = currentState.sourceControl;
            const path = `source_document/${currentState.project.name}`;
            
            const { content: base64Content } = await gh.getRawFileContent(auth.token, owner, repo, path);
            const finalFileName = (currentState.project.name || 'document').replace(/\.docx$/, '_advanced_translated.docx');
            
            await exportToDocxAdvanced(base64Content, segments, finalFileName);
            
            setToastMessage("Advanced export completed successfully.");

        } catch (e) {
            console.error("Advanced export failed:", e);
            alert(`Advanced export failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
            setToastMessage(null);
        } finally {
            setIsAdvancedExporting(false);
            setTimeout(() => setToastMessage(null), 4000);
        }
    }, [currentState, segments]);
    
    const handleRebuildDocx = useCallback(async () => {
        const sc = currentState.sourceControl;
        const auth = getGitHubAuth();

        if (!sc || !auth || !currentState.project.name.endsWith('.docx')) {
            alert("This feature is only available for .docx projects stored on GitHub.");
            return;
        }

        if (!paneLayout.sidebar.includes('sxDev') && !paneLayout.bottom.includes('sxDev')) {
            handleDockPane('sxDev', 'bottom');
        }
        setSxDevContent(''); // Clear previous logs
        
        setIsRebuildingDocx(true);
        setToastMessage(STRINGS.DEV_REBUILD_DOCX_LOADING);

        const progressCallback = (message: string) => {
            setSxDevContent(prev => `${prev}\n${new Date().toLocaleTimeString()} - ${message}`);
        };

        try {
            const { owner, repo } = sc;
            const path = `source_document/${currentState.project.name}`;
            const { content: base64Content } = await gh.getRawFileContent(auth.token, owner, repo, path);
            
            await rebuildDocx(base64Content, currentState, progressCallback, withApiTracking);

            setToastMessage("DOCX rebuilt successfully.");

        } catch (e) {
            const errorMsg = `DOCX rebuild failed: ${e instanceof Error ? e.message : 'Unknown error'}`;
            progressCallback(`ERROR: ${errorMsg}`);
            console.error(errorMsg, e);
            alert(errorMsg);
            setToastMessage(null);
        } finally {
            setIsRebuildingDocx(false);
            setTimeout(() => setToastMessage(null), 4000);
        }
    }, [currentState, withApiTracking, paneLayout, handleDockPane]);

    const handleExpExport = useCallback(async () => {
        setIsExpExporting(true);
        setToastMessage("Starting experimental export...");
        try {
            const baseFileName = (currentState.project.name || 'document').replace(/\.(docx|pdf|lingua)$/, '');
            const experimentalFileName = `${baseFileName}_exp_translated.docx`;
            
            await exportProjectFile(currentState, experimentalFileName);
            
            setToastMessage("Experimental export completed successfully.");

        } catch (e) {
            console.error("Experimental export failed:", e);
            alert(`Experimental export failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
            setToastMessage(null);
        } finally {
            setIsExpExporting(false);
            setTimeout(() => setToastMessage(null), 4000);
        }
    }, [currentState]);

    const updateSegmentTimes = useCallback((segmentId: number, start: number, end: number) => {
        setSegments(prev => prev.map(seg =>
            seg.id === segmentId ? { ...seg, startTime: start, endTime: end, isDirty: true } : seg
        ));
    }, [setSegments]);

    const finalizeAllSegments = useCallback(() => {
        setSegments(prev => prev.map(seg => {
            if (seg.status === 'approved_by_p1' || seg.status === 'approved_by_p2') {
                return { ...seg, status: 'finalized', isDirty: true };
            }
            return seg;
        }));
    }, [setSegments]);

    const approveSegment = useCallback((segmentId: number) => {
        const auth = getGitHubAuth();
        const currentUser = auth?.login;
        const { proofreader1, proofreader2 } = initialState.project;
    
        setSegments(prev => prev.map(seg => {
            if (seg.id !== segmentId) return seg;
    
            let newStatus: SegmentStatus = seg.status;
            let newTarget = seg.target;

            const wasTranslated = seg.status === 'translated' || seg.status === 'rejected';
            const wasApprovedByP1 = seg.status === 'approved_by_p1';

            if (currentUser === proofreader1 && wasTranslated) {
                newStatus = 'approved_by_p1';
            } else if (currentUser === proofreader2 && wasApprovedByP1) {
                newStatus = 'approved_by_p2';
            }
            
            // Generate diff if status changed and there's a baseline translator target
            if (newStatus !== seg.status && seg.translatorTarget) {
                const oldText = stripHtml(seg.translatorTarget);
                const newText = stripHtml(seg.target);
                newTarget = generateDiffedHtml(oldText, newText);
            }
            
            return { ...seg, status: newStatus, target: newTarget, isDirty: true, lastModifiedBy: currentUser };
        }));
    }, [setSegments, initialState.project]);
    
    const rejectSegment = useCallback((segmentId: number, reason: string) => {
        const auth = getGitHubAuth();
        const currentUser = auth?.login;
        if (!currentUser) return;
    
        setSegments(prev => prev.map(seg => {
            if (seg.id !== segmentId) return seg;
    
            const newComment = {
                author: currentUser,
                text: reason,
                createdAt: new Date().toISOString(),
                isResolved: false
            };
    
            return { 
                ...seg, 
                status: 'rejected', 
                comments: [...(seg.comments || []), newComment],
                isDirty: true,
                lastModifiedBy: currentUser
            };
        }));
    }, [setSegments]);

    const prepareSegmentsForProofreading = useCallback(() => {
        const currentUser = getGitHubAuth()?.login;
        setSegments(prev => {
            let changed = false;
            const newSegments = prev.map(s => {
                if (s.status === 'draft' && stripHtml(s.target).trim() !== '') {
                    changed = true;
                    return { ...s, status: 'translated' as SegmentStatus, isDirty: true, lastModifiedBy: currentUser };
                }
                return s;
            });
            return changed ? newSegments : prev;
        });
    }, [setSegments]);

    return {
        currentState,
        segments,
        activeSegment,
        isLoading,
        translationStats,
        loadedTerms,
        tmMatches,
        allTmMatches,
        isMatchingTm,
        segmentRefs,
        sourceSegmentRefs,
        handleSegmentFocus,
        handleApplyTmMatch,
        handleFindAllTmMatches,
        handleTranslateSelection,
        paneLayout,
        handleReorderSidebarPanes,
        handleDockPane,
        sidebarWidth,
        handleSidebarResize,
        bottomPanelHeight,
        handleBottomPanelResize,
        sxDevContent,
        isFetchingDocxXml,
        handleResegmentProject,
        handleFetchDocxXml,
        toastMessage,
        isAdvancedExporting,
        handleAdvancedExport,
        isRebuildingDocx,
        handleRebuildDocx,
        isExpExporting,
        handleExpExport,
        updateSegment,
        joinSegments,
        splitSegmentInState,
        addNewTerms,
        updateSegmentTarget,
        setLoadedTerms,
        videoCurrentTime,
        setVideoCurrentTime,
        videoDuration,
        setVideoDuration,
        updateSegmentTimes,
        finalizeAllSegments,
        approveSegment,
        rejectSegment,
        prepareSegmentsForProofreading,
    };
};