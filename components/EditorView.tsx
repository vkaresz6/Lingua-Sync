

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useCatTool } from '../hooks/useCatTool';
import { SegmentTable } from './SegmentTable';
import { Header } from './Header';
import { BottomPanel } from './BottomPanel';
import { SettingsModal } from './SettingsModal';
import { DefinitionModal } from './DefinitionModal';
import { NewTermModal } from './NewTermModal';
import { CommitModal } from './CommitModal';
import { GitHubPushModal } from './GitHubPushModal';
import { ManageTmsModal } from './ManageTmsModal';
import { ManageTermDbsModal } from './ManageTermDbsModal';
import { LoadTermDbModal } from './LoadTermDbModal';
import { SyncModal, SyncConflict, Resolutions } from './SyncModal';
import { BoundingBox } from './BoundingBox';
import { ProjectState, PaneId, Term, Segment, QaIssue, SourceError, AiQaIssueType, Contributor, UserRole } from '../types';
import * as gh from '../utils/githubApi';
import { getGitHubAuth, clearGitHubAuth } from '../utils/projectManager';
import { exportToDocx, exportToPdf, exportProjectFile, exportToSrt, stripHtml, exportToHtml } from '../utils/fileHandlers';
import { parseTbx } from '../utils/xmlHandlers';
import { AutoTranslateModal } from './AutoTranslateModal';
import { STRINGS } from '../strings';
import { GitHubConnectModal } from './GitHubConnectModal';
import { UserManagementModal } from './UserManagementModal';
import { runQaChecks } from '../utils/qaChecks';
import { QaReportModal } from './QaReportModal';
import { SubtitleEditor } from './SubtitleEditor';
import { StatisticsReportModal } from './StatisticsReportModal';
import { generateStatisticsReport } from '../utils/statistics';


import { Sidebar } from './Sidebar';
import { Widget } from './Widget';
import { MachineTranslationPane } from './panes/MachineTranslationPane';
import { EvaluationPane } from './panes/EvaluationPane';
import { TermDbPane } from './panes/TermDbPane';
import { PreviewPane } from './panes/PreviewPane';
import { WebPreviewPane } from './panes/WebPreviewPane';
import { TranslationMemoryPane } from './panes/TranslationMemoryPane';
import { ChatPane } from './panes/ChatPane';
import { SxDevPane } from './panes/SxDevPane';
import { ProjectProvider, useProject } from './contexts/ProjectContext';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { UIStateProvider, useUIState, ModalType, ModalPayload } from './contexts/UIStateContext';
import { InsertionMenu, InsertableItem } from './InsertionMenu';
import { DictationModal } from './DictationModal';

// Import new feature hooks
import { useChat } from '../hooks/useChat';
import { useMachineTranslation } from '../hooks/useMachineTranslation';
import { useTerminology } from '../hooks/useTerminology';
import { useSegmentAnalysis } from '../hooks/useSegmentAnalysis';
import { useCorrection } from '../hooks/useCorrection';
import { useEvaluation } from '../hooks/useEvaluation';
import { useFormatting } from '../hooks/useFormatting';
import { useApi } from './../hooks/useApi';
import { runAiQaCheck, AiQaIssue } from '../utils/geminiApi';


interface EditorViewProps {
    projectState: ProjectState;
    onSave: (currentState: ProjectState) => void;
    onBack: () => void;
    onCommitToGitHub: (state: ProjectState, terms: Term[], message: string) => Promise<ProjectState>;
    onPushToNewGitHubRepo: (state: ProjectState, terms: Term[], repoName: string, repoDescription: string, isPrivate: boolean, commitMessage: string) => Promise<void>;
    onPushToExistingGitHubRepo: (state: ProjectState, terms: Term[], repo: gh.GitHubRepo, commitMessage: string) => Promise<void>;
    onImportTmArchive: (file: File, projectState: ProjectState) => Promise<string>;
    onUploadTermDbAndLink: (file: File, projectState: ProjectState) => Promise<string>;
    onUpdateContributors: (newContributors: Contributor[]) => void;
    onPullFromGitHub: (state: ProjectState) => Promise<void>;
}

interface EditorLayoutProps extends EditorViewProps {
    internalProjectState: ProjectState;
    setInternalProjectState: React.Dispatch<React.SetStateAction<ProjectState>>;
}

const EditorLayout: React.FC<EditorLayoutProps> = (props) => {
    const { 
        internalProjectState, setInternalProjectState,
        onSave, onBack, onCommitToGitHub, 
        onPushToNewGitHubRepo, onPushToExistingGitHubRepo, onImportTmArchive, onUploadTermDbAndLink,
        onUpdateContributors, onPullFromGitHub
    } = props;
    
    const { activeModal, openModal: openModalFromCtx, closeModal } = useUIState();
    const { isLeader } = useProject();
    
    // Core Hook (for non-API logic)
    const catToolData = useCatTool(internalProjectState);
    const { 
        segments, loadedTerms, tmMatches, allTmMatches, isMatchingTm, segmentRefs, sourceSegmentRefs, 
        handleApplyTmMatch, handleFindAllTmMatches, paneLayout, handleReorderSidebarPanes, handleDockPane, 
        sidebarWidth, handleSidebarResize, bottomPanelHeight, handleBottomPanelResize, sxDevContent, 
        isFetchingDocxXml, handleResegmentProject, handleFetchDocxXml, toastMessage, isAdvancedExporting, 
        handleAdvancedExport, isRebuildingDocx, handleRebuildDocx, isExpExporting, handleExpExport, 
        joinSegments, splitSegmentInState, addNewTerms, updateSegmentTarget, updateSegment, setLoadedTerms, finalizeAllSegments,
        approveSegment, rejectSegment, handleTranslateSelection, translationStats,
        videoCurrentTime, setVideoCurrentTime, videoDuration, setVideoDuration, updateSegmentTimes,
        prepareSegmentsForProofreading,
    } = catToolData;

    const { activeSegmentId: activeSegment, onSegmentFocus: handleSegmentFocus, inputTokenCount, outputTokenCount, apiCallCount } = useSession();
    const { withApiTracking } = useApi();
    
    // Feature Hooks (for API-centric logic)
    const chatHook = useChat(segments);
    const mtHook = useMachineTranslation(segments, activeSegment);
    const terminologyHook = useTerminology(loadedTerms, segments, addNewTerms);
    const analysisHook = useSegmentAnalysis(segments, updateSegment);
    const correctionHook = useCorrection(segments, updateSegment);
    const evaluationHook = useEvaluation(segments, updateSegment);
    const formattingHook = useFormatting(segments, activeSegment, updateSegmentTarget);
    
    const [insertionMenu, setInsertionMenu] = useState<{
        isOpen: boolean;
        items: InsertableItem[];
        position: { top: number; left: number };
    }>({ isOpen: false, items: [], position: { top: 0, left: 0 } });

    const ctrlKeyPressedRef = useRef(false);
    const otherKeyPressedWithCtrlRef = useRef(false);

    const [isCommitting, setIsCommitting] = useState(false);
    const [isGitHubConnected, setIsGitHubConnected] = useState(!!getGitHubAuth());
    const [postConnectionAction, setPostConnectionAction] = useState<'push' | null>(null);
    const [qaIssues, setQaIssues] = useState<QaIssue[]>([]);
    const [isQaRunning, setIsQaRunning] = useState(false);
    const [statisticsData, setStatisticsData] = useState<any>(null);
    
    // Sync state
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>([]);
    const [latestRemoteSha, setLatestRemoteSha] = useState('');
    const [isResolving, setIsResolving] = useState(false);

    // Overall score state
    const [trends, setTrends] = useState<{ quality: 'up' | 'down' | null, consistency: 'up' | 'down' | null }>({ quality: null, consistency: null });
    const prevScoresRef = useRef<{ quality: number, consistency: number } | null>(null);

    const hasDockedWebPreview = useRef(false);

    // Proofreading state
    const [isProofreaderMode, setIsProofreaderMode] = useState(false);

    const { login: currentUserLogin, roles: currentUserRoles } = useMemo(() => {
        const auth = getGitHubAuth();
        const login = auth?.login || '';
        if (!login || !internalProjectState.project.contributors) {
            return { login, roles: [] };
        }
        const contributor = internalProjectState.project.contributors.find(c => c.githubUsername === login);
        
        // Backwards compatibility for single role during transition
        const roles = contributor?.roles || ((contributor as any)?.role ? [(contributor as any).role] : []);

        return { login, roles };
    }, [isGitHubConnected, internalProjectState.project.contributors]);

    const handleToggleProofreaderMode = () => {
        const newMode = !isProofreaderMode;
        if (newMode) {
            prepareSegmentsForProofreading();
        }
        setIsProofreaderMode(newMode);
    };

    const handleApproveSegment = (segmentId: number) => {
        approveSegment(segmentId);
    };

    const handleRejectSegment = (segmentId: number) => {
        const reason = window.prompt("Please provide a reason for rejection:");
        if (reason && reason.trim()) {
            rejectSegment(segmentId, reason.trim());
        }
    };

    const handleFinalizeProject = () => {
        if (window.confirm("Are you sure you want to finalize all approved segments? This action cannot be undone and will prevent further edits to them.")) {
            finalizeAllSegments();
        }
    };

    const isFinalizeDisabled = useMemo(() => {
        if (!isLeader) return true;
        return !segments.some(s => s.status === 'approved_by_p1' || s.status === 'approved_by_p2');
    }, [segments, isLeader]);

    const openModal = (type: ModalType, payload?: ModalPayload) => {
        if (type === 'statisticsReport') {
            const reportData = generateStatisticsReport(internalProjectState, allTmMatches);
            setStatisticsData(reportData);
        }
        openModalFromCtx(type, payload);
    };

    useEffect(() => {
        const isWebProject = !!internalProjectState.project.webpageUrl;
        const isPaneVisible = paneLayout.sidebar.includes('web-preview') || paneLayout.bottom.includes('web-preview');
        
        if (isWebProject && !isPaneVisible && !hasDockedWebPreview.current) {
            handleDockPane('web-preview', 'bottom');
            hasDockedWebPreview.current = true;
        }
    }, [internalProjectState.project.webpageUrl, paneLayout, handleDockPane]);

    const overallScores = useMemo(() => {
        const evaluatedSegments = segments.filter(s => s.evaluation && typeof s.evaluation.rating === 'number');
        if (evaluatedSegments.length === 0) {
            return { quality: 0, consistency: 0 };
        }

        const totalQuality = evaluatedSegments.reduce((sum, seg) => sum + (seg.evaluation!.rating), 0);
        const segmentsWithConsistency = evaluatedSegments.filter(s => typeof s.evaluation!.consistency === 'number');
        const totalConsistency = segmentsWithConsistency.reduce((sum, seg) => sum + (seg.evaluation!.consistency!), 0);

        // Scores are 1-5, convert to 0-100 percentage: ((avg - 1) / 4) * 100
        const quality = (totalQuality / evaluatedSegments.length - 1) * 25;
        const consistency = segmentsWithConsistency.length > 0 ? (totalConsistency / segmentsWithConsistency.length - 1) * 25 : 0;

        return { quality, consistency };
    }, [segments]);

    useEffect(() => {
        if (prevScoresRef.current) { // Don't run on first render
            const { quality: prevQ, consistency: prevC } = prevScoresRef.current;
            const { quality: newQ, consistency: newC } = overallScores;

            const newTrends = {
                quality: newQ > prevQ ? 'up' as const : newQ < prevQ ? 'down' as const : null,
                consistency: newC > prevC ? 'up' as const : newC < prevC ? 'down' as const : null,
            };

            if (newTrends.quality || newTrends.consistency) {
                setTrends(newTrends);
                const timer = setTimeout(() => setTrends({ quality: null, consistency: null }), 2500);
                return () => clearTimeout(timer);
            }
        }
    }, [overallScores]);

    useEffect(() => {
        // This effect ensures the ref is always up-to-date for the *next* comparison.
        prevScoresRef.current = overallScores;
    }, [overallScores]);


    const isGitHubProject = !!internalProjectState.sourceControl;
    const isDocxProjectOnGitHub = isGitHubProject && internalProjectState.project.name.endsWith('.docx');

    const activeSegmentNumber = useMemo(() => {
        if (activeSegment === null) return 0;
        const index = segments.findIndex(s => s.id === activeSegment);
        return index + 1;
    }, [activeSegment, segments]);

    const finalStateForSave = useMemo(() => {
        // This recalculates the final state for saving by combining session data
        // with the latest document data from the catTool hook.
        const { session: baseSession, ...restOfProjectState } = props.projectState;
        
        return {
            ...restOfProjectState,
            ...catToolData.currentState,
            session: {
                ...catToolData.currentState.session,
                inputTokenCount,
                outputTokenCount,
                apiCallCount,
            }
        };
    }, [props.projectState, catToolData.currentState, inputTokenCount, outputTokenCount, apiCallCount]);
    
    const extractInsertableItems = useCallback((segment: Segment, terms: Term[]): InsertableItem[] => {
        const items: InsertableItem[] = [];
        const sourceText = stripHtml(segment.source);
    
        // 1. Tags
        const tagRegex = /<[^>]+>/g;
        const tags = segment.source.match(tagRegex) || [];
        tags.forEach(tag => {
            items.push({ type: 'tag', display: tag, value: tag });
        });
    
        // 2. Terms
        terms.forEach(term => {
            if (sourceText.toLowerCase().includes(term.source.toLowerCase())) {
                items.push({ type: 'term', display: `${term.source} → ${term.target}`, value: term.target });
            }
        });
    
        // 3. Dates (if analysis was run)
        if (segment.dateHighlightHtml) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = segment.dateHighlightHtml;
            const dateElements = tempDiv.querySelectorAll('.date-highlight');
            dateElements.forEach(el => {
                const value = el.getAttribute('data-title');
                const display = el.textContent;
                if (value && display) {
                    items.push({ type: 'date', display: `${display} → ${value}`, value: value });
                }
            });
        }
    
        const seen = new Set();
        return items.filter(item => {
            const duplicate = seen.has(item.value);
            seen.add(item.value);
            return !duplicate;
        });
    }, []);

    const handleCloseMenu = useCallback(() => {
        setInsertionMenu(prev => ({ ...prev, isOpen: false }));
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Control' && e.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
                if (!ctrlKeyPressedRef.current) { // First time Ctrl is pressed
                    ctrlKeyPressedRef.current = true;
                    otherKeyPressedWithCtrlRef.current = false;
                }
            } else if (ctrlKeyPressedRef.current && !e.repeat) {
                // Another key was pressed while Ctrl is down.
                if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
                    otherKeyPressedWithCtrlRef.current = true;
                }
            }
        };
        
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Control' && e.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
                if (ctrlKeyPressedRef.current && !otherKeyPressedWithCtrlRef.current) {
                    // This is a tap.
                    e.preventDefault();
                    
                    if (insertionMenu.isOpen) {
                        handleCloseMenu();
                    } else {
                        if (activeSegment !== null) {
                            const segment = segments.find(s => s.id === activeSegment);
                            const activeEditor = segmentRefs.current[activeSegment];
                            if (segment && activeEditor) {
                                const selection = window.getSelection();
                                if (selection && selection.rangeCount > 0) {
                                    let rect;
                                    const range = selection.getRangeAt(0);
                                    if (activeEditor.contains(range.commonAncestorContainer)) {
                                        const clientRects = range.getClientRects();
                                        rect = clientRects.length > 0 ? clientRects[0] : range.getBoundingClientRect();
                                    } else {
                                        rect = activeEditor.getBoundingClientRect();
                                    }
                                    
                                    const items = extractInsertableItems(segment, loadedTerms);
                                    
                                    setInsertionMenu({
                                        isOpen: true,
                                        items,
                                        position: { top: rect.bottom + 5, left: rect.left }
                                    });
                                }
                            }
                        }
                    }
                }
                // Reset flags
                ctrlKeyPressedRef.current = false;
                otherKeyPressedWithCtrlRef.current = false;
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, [activeSegment, segments, loadedTerms, extractInsertableItems, insertionMenu.isOpen, segmentRefs, handleCloseMenu]);

    const handleInsertItem = useCallback((valueToInsert: string) => {
        if (activeSegment === null) return;
        const segment = segments.find(s => s.id === activeSegment);
        if (!segment) return;
    
        let newTarget = segment.target;
        // Ensure we are working with a <p> tag, which is the default for editable cells
        if (!newTarget.startsWith('<p') || !newTarget.endsWith('</p>')) {
            newTarget = `<p>${newTarget || ''}</p>`;
        }
    
        const insertionPoint = newTarget.lastIndexOf('</p>');
        // Add a space before inserting if there's content and it doesn't end with a space
        const contentBefore = newTarget.substring(0, insertionPoint);
        const needsSpace = contentBefore.length > 3 && !/\s>$/.test(contentBefore) && !contentBefore.endsWith(' ');
        const contentToInsert = (needsSpace ? ' ' : '') + valueToInsert + ' ';

        newTarget = contentBefore + contentToInsert + newTarget.slice(insertionPoint);
        
        updateSegmentTarget(activeSegment, newTarget);
        setInsertionMenu(prev => ({ ...prev, isOpen: false }));
        
        setTimeout(() => {
            const editor = segmentRefs.current[activeSegment];
            if (editor) {
                editor.focus();
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(editor);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }, 0);
    }, [activeSegment, segments, updateSegmentTarget, segmentRefs]);

    const handleConnectSuccess = () => {
        setIsGitHubConnected(true);
        closeModal();
        if (postConnectionAction === 'push') {
            openModal('push');
            setPostConnectionAction(null);
        }
    };
    
    const handleDisconnect = () => {
        clearGitHubAuth();
        setIsGitHubConnected(false);
    };

    const handleImportTmArchiveClick = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.mqxlz';
        fileInput.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const newTmName = await onImportTmArchive(file, internalProjectState);
                if (newTmName && !internalProjectState.project.translationMemories.includes(newTmName)) {
                    setInternalProjectState(prev => ({...prev, project: {...prev.project, translationMemories: [...prev.project.translationMemories, newTmName]}}));
                }
            }
        };
        fileInput.click();
    };
    
    const handleUploadAndLinkTermDb = async (file: File) => {
        const newDbName = await onUploadTermDbAndLink(file, internalProjectState);
        if (newDbName && !internalProjectState.project.termDatabases.includes(newDbName)) {
             setInternalProjectState(prev => ({...prev, project: {...prev.project, termDatabases: [...prev.project.termDatabases, newDbName]}}));
        }
        return newDbName;
    };

    const handleLoadAndMergeTermDb = async (fileName: string) => {
        const auth = getGitHubAuth();
        const sc = internalProjectState.sourceControl;
        if (!auth || !sc) {
            throw new Error("Cannot load TermDB: Not connected to a GitHub project.");
        }

        const { content } = await gh.getFileContent(auth.token, sc.owner, sc.repo, `terminology_databases/${fileName}`);
        const termUnits = parseTbx(content);

        if (termUnits && termUnits.length > 0) {
            const newTerms: Term[] = termUnits.map((tu, i) => ({ ...tu, id: Date.now() + i }));
            if (newTerms.length > 0) {
                addNewTerms(newTerms);
            }
        }
        closeModal();
    };

    const handleExport = (format: 'docx' | 'pdf' | 'srt' | 'html') => {
        const fileName = internalProjectState.project.name.replace(/\.(docx|pdf|lingua|html)$/, '');
        try {
            if (format === 'docx') {
                exportToDocx(internalProjectState, fileName);
            } else if (format === 'pdf') {
                exportToPdf(internalProjectState, fileName);
            } else if (format === 'srt') {
                exportToSrt(segments, fileName);
            } else if (format === 'html') {
                exportToHtml(internalProjectState, fileName);
            }
        } catch (error) {
            alert(STRINGS.ERROR_EXPORT_FAILED(format.toUpperCase(), error instanceof Error ? error.message : ''));
            console.error(error);
        }
    };

    const handleDownloadProject = () => {
        const fileName = internalProjectState.project.name.replace(/\.(docx|pdf|lingua)$/, '') + '.lingua';
        exportProjectFile(internalProjectState, fileName);
    };

    useEffect(() => {
        if (isGitHubProject) return;

        const interval = setInterval(() => {
            onSave(finalStateForSave);
        }, 30000);
        return () => clearInterval(interval);
    }, [onSave, finalStateForSave, isGitHubProject]);

    useEffect(() => {
        const isNew = sessionStorage.getItem('newProjectCreated');
        if (isNew && !isGitHubProject) {
            sessionStorage.removeItem('newProjectCreated');
            if (isGitHubConnected) {
                openModal('push');
            } else {
                setPostConnectionAction('push');
                openModal('connectGitHub');
            }
        }
    }, [isGitHubProject, isGitHubConnected, openModal]);


    const handleSaveOrCommit = () => {
        if (isGitHubProject && onCommitToGitHub) {
            openModal('commit');
        } else {
            onSave(finalStateForSave);
        }
    };
    
    const handleCommit = async (message: string) => {
        setIsCommitting(true);
        try {
            const updatedState = await onCommitToGitHub(finalStateForSave, loadedTerms, message);
            setInternalProjectState(updatedState);
            alert("Successfully committed to GitHub.");
            closeModal();
        } catch(e) {
            console.error(e);
            alert(STRINGS.COMMIT_FAILED_MESSAGE(e instanceof Error ? e.message : 'Unknown error'));
        } finally {
            setIsCommitting(false);
        }
    };
    
    const handlePush = async (action: 'new' | 'existing', data: any) => {
        const { commitMessage } = data;
        if (!commitMessage) throw new Error("Commit message is required.");
        
        if (action === 'new') {
            const { repoName, repoDescription, isPrivate } = data;
            await onPushToNewGitHubRepo(finalStateForSave, loadedTerms, repoName, repoDescription, isPrivate, commitMessage);
            alert(STRINGS.PUSH_NEW_REPO_SUCCESS(repoName));
        } else { // 'existing'
            const { repo } = data;
            await onPushToExistingGitHubRepo(finalStateForSave, loadedTerms, repo, commitMessage);
            alert(STRINGS.PUSH_EXISTING_REPO_SUCCESS(repo.name));
        }
        closeModal();
        // Force a re-render or state update to reflect the new GitHub linkage
        onBack(); // Go back to project list to see the change
    };
    
    const handlePull = async () => {
        if (!isGitHubProject || !window.confirm(STRINGS.PULL_CONFIRM)) {
            return;
        }
        
        try {
            await onPullFromGitHub(finalStateForSave);
            alert(STRINGS.PULL_SUCCESS);
        } catch(e) {
            console.error(e);
            alert(STRINGS.PULL_FAILED(e instanceof Error ? e.message : 'Unknown error'));
        }
    };

    const handleSync = async () => {
        if (!isGitHubProject) return;
        setIsSyncing(true);
        const auth = getGitHubAuth();
        const sc = internalProjectState.sourceControl;
        if (!auth || !sc) return;

        try {
            // 1. Fetch remote content
            const { content: remoteContent, sha: remoteSha } = await gh.getFileContent(auth.token, sc.owner, sc.repo, sc.path);
            setLatestRemoteSha(remoteSha);

            // 2. Compare SHAs
            if (remoteSha === sc.sha) {
                const dirtySegments = segments.filter(s => s.isDirty);
                if (dirtySegments.length > 0) {
                     alert(STRINGS.SYNC_PUSHING_LOCAL_CHANGES);
                     openModal('commit');
                } else {
                    alert(STRINGS.SYNC_UP_TO_DATE);
                }
                setIsSyncing(false);
                return;
            }
            
            // 3. Find conflicts
            const remoteState: ProjectState = JSON.parse(remoteContent);
            const conflicts: SyncConflict[] = [];
            const remoteSegmentsMap = new Map(remoteState.data.segments.map(s => [s.id, s]));

            segments.forEach(localSeg => {
                if (localSeg.isDirty) {
                    const remoteSeg = remoteSegmentsMap.get(localSeg.id);
                    if (remoteSeg && remoteSeg.target !== localSeg.target) {
                        const localLastModified = localSeg.lastModifiedBy;
                        const remoteLastModified = remoteSeg.lastModifiedBy;
                        // Basic check: if they have different modifiers, it's a conflict
                        if (localLastModified && remoteLastModified && localLastModified !== remoteLastModified) {
                             conflicts.push({
                                segmentId: localSeg.id,
                                source: localSeg.source,
                                localTarget: localSeg.target,
                                remoteTarget: remoteSeg.target,
                            });
                        }
                    }
                }
            });

            if (conflicts.length > 0) {
                setSyncConflicts(conflicts);
                openModal('sync');
            } else {
                // No conflicts, perform merge
                const mergedSegments = segments.map(localSeg => {
                    const remoteSeg = remoteSegmentsMap.get(localSeg.id);
                    if (remoteSeg && !localSeg.isDirty) { // Remote change, local unchanged
                        return remoteSeg;
                    }
                    return localSeg; // Local change or no change
                });

                const updatedState = {
                    ...internalProjectState,
                    data: { segments: mergedSegments },
                    sourceControl: { ...sc, sha: remoteSha }
                };
                setInternalProjectState(updatedState);
                openModal('commit');
            }

        } catch (e) {
            console.error(e);
            alert(STRINGS.SYNC_FAILED(e instanceof Error ? e.message : 'Unknown error'));
        } finally {
            setIsSyncing(false);
        }
    };
    
    const handleResolveSync = async (resolutions: Resolutions) => {
        setIsResolving(true);
        const auth = getGitHubAuth();
        const sc = internalProjectState.sourceControl;
        if (!auth || !sc) return;

        try {
             // 1. Fetch remote content again to be safe
            const { content: remoteContent } = await gh.getFileContent(auth.token, sc.owner, sc.repo, sc.path);
            const remoteState: ProjectState = JSON.parse(remoteContent);
            const remoteSegmentsMap = new Map(remoteState.data.segments.map(s => [s.id, s]));

            // 2. Merge based on resolutions
            const resolvedSegments = segments.map(localSeg => {
                const resolution = resolutions[localSeg.id];
                if (resolution === 'remote') {
                    return remoteSegmentsMap.get(localSeg.id) || localSeg;
                }
                if (resolution === 'local') {
                    return { ...localSeg, isDirty: true }; // Keep local and mark for commit
                }
                // No conflict or no resolution needed
                const remoteSeg = remoteSegmentsMap.get(localSeg.id);
                 if (remoteSeg && !localSeg.isDirty) { // Remote change, local unchanged
                    return remoteSeg;
                }
                return localSeg;
            });
            
            const stateToCommit = { 
                ...internalProjectState, 
                data: { segments: resolvedSegments },
                sourceControl: { ...sc, sha: latestRemoteSha } // Update sha to latest
            };

            setInternalProjectState(stateToCommit);
            closeModal();
            openModal('commit');

        } catch (e) {
            alert(STRINGS.SYNC_FAILED(e instanceof Error ? e.message : 'Unknown error'));
        } finally {
            setIsResolving(false);
        }
    };
    
    const handleRunQaChecks = () => {
        setIsQaRunning(true);
        setQaIssues([]);

        const basicIssues = runQaChecks(segments, loadedTerms);
        setQaIssues(basicIssues);

        withApiTracking(() => runAiQaCheck(
            segments,
            internalProjectState.project.context,
            internalProjectState.project.sourceLanguage,
            internalProjectState.project.targetLanguage,
            internalProjectState.settings.prompts.aiQaCheck,
            internalProjectState.settings.model
        )).then((aiIssues: AiQaIssue[]) => {
            const formattedAiIssues: QaIssue[] = aiIssues.map(issue => {
                const segmentIndex = issue.segmentIndex - 1;
                const segment = segments[segmentIndex];
                if (!segment) return null;
                const qaIssue: QaIssue = {
                    segmentId: segment.id,
                    type: issue.type as AiQaIssueType,
                    description: issue.description,
                    source: segment.source,
                    target: segment.target,
                };
                return qaIssue;
            }).filter((i): i is QaIssue => i !== null);
            setQaIssues(prev => [...prev, ...formattedAiIssues]);
        }).catch(err => {
            console.error("AI QA Check failed:", err);
        }).finally(() => {
            setIsQaRunning(false);
        });
    };

    const handleGoToSegment = (segmentId: number) => {
        handleSegmentFocus(segmentId);
        closeModal();
    };
    
    // Auto-translate logic
    const handleAutoTranslate = async (endSegmentNumber: number) => {
        closeModal();
        mtHook.handleAutoTranslateSegments(endSegmentNumber, (results) => {
            results.forEach(result => {
                const targetText = `<p>${result.text}</p>`;
                updateSegmentTarget(result.id, targetText);
            });
        });
    };
    
    const handleApplyQaSuggestion = (segmentId: number, newTarget: string) => {
        updateSegmentTarget(segmentId, newTarget);
        setQaIssues(prev => prev.filter(issue => 
            !(issue.segmentId === segmentId && issue.suggestedFix === newTarget)
        ));
    };

    // ----------------------------------------------------
    // PANE RENDERING LOGIC
    // ----------------------------------------------------
    const getPaneTitle = (paneId: PaneId): string => {
        const titles: Record<PaneId, string> = {
            'preview': STRINGS.PANE_TITLE_PREVIEW,
            'web-preview': STRINGS.PANE_TITLE_WEB_PREVIEW,
            'machine-translation': STRINGS.PANE_TITLE_MT,
            'term-db': STRINGS.PANE_TITLE_TERMDB,
            'evaluation': STRINGS.PANE_TITLE_EVALUATION,
            'translation-memory': STRINGS.PANE_TITLE_TM_MATCHES,
            'chat': STRINGS.PANE_TITLE_CHAT,
            'sxDev': 'Dev',
            'youtube-player': STRINGS.PANE_TITLE_YOUTUBE_PLAYER,
        };
        return titles[paneId] || 'Unknown';
    };

    const activeSegmentData = useMemo(() => segments.find(s => s.id === activeSegment), [segments, activeSegment]);

    const renderPane = (paneId: PaneId): React.ReactNode => {
        switch (paneId) {
            case 'preview': return <PreviewPane segments={segments} />;
            case 'web-preview': return <WebPreviewPane segments={segments} />;
            case 'machine-translation':
                return <MachineTranslationPane 
                            machineTranslations={mtHook.machineTranslations}
                            isTranslating={mtHook.isTranslating}
                            onMachineTranslationClick={(translation) => updateSegmentTarget(activeSegment!, `<p>${translation}</p>`)}
                            handleGenerateMachineTranslations={mtHook.handleGenerateMachineTranslations}
                            isSegmentActive={!!activeSegment}
                       />;
            case 'term-db':
                return <TermDbPane 
                            terms={loadedTerms}
                            onTermsChange={setLoadedTerms}
                            handleExtractTerms={terminologyHook.handleExtractTerms}
                            isExtracting={terminologyHook.isExtracting}
                            segments={segments}
                       />;
            case 'evaluation':
                return <EvaluationPane 
                            evaluation={activeSegmentData?.evaluation?.feedback || ''}
                            onCorrectPunctuation={() => activeSegment && correctionHook.handleCorrectPunctuation(activeSegment)}
                            isActionDisabled={!activeSegment}
                            errors={activeSegmentData?.targetErrors || []}
                            onApplyCorrection={(error: SourceError) => activeSegment && correctionHook.handleApplyCorrection(activeSegment, error)}
                       />;
            case 'translation-memory':
                return <TranslationMemoryPane 
                            matches={tmMatches}
                            isMatching={isMatchingTm}
                            onMatchClick={(target) => activeSegment && handleApplyTmMatch(activeSegment, target)}
                       />;
            case 'chat':
                return <ChatPane 
                            messages={chatHook.messages}
                            isLoading={chatHook.isLoading || chatHook.isChatInitializing}
                            handleSendMessage={chatHook.handleSendMessage}
                       />;
            case 'sxDev':
                return <SxDevPane xmlContent={sxDevContent} />;
            default: return null;
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-200">
            {toastMessage && (
                 <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-toast">
                    {toastMessage}
                </div>
            )}
            <Header
                onGoToProjects={onBack}
                onSaveProject={handleSaveOrCommit}
                onDownloadProject={handleDownloadProject}
                onExport={handleExport}
                onAdvancedExport={isDocxProjectOnGitHub ? handleAdvancedExport : undefined}
                isAdvancedExporting={isAdvancedExporting}
                onRebuildDocx={isDocxProjectOnGitHub ? handleRebuildDocx : undefined}
                isRebuildingDocx={isRebuildingDocx}
                onExpExport={isDocxProjectOnGitHub ? handleExpExport : undefined}
                isExpExporting={isExpExporting}
                onOpenModal={openModal}
                isEditingDisabled={!activeSegment}
                onPull={isGitHubProject ? handlePull : undefined}
                onSync={isGitHubProject ? handleSync : undefined}
                onImportTmArchiveClick={isGitHubProject ? handleImportTmArchiveClick : undefined}
                onFindTmMatches={isGitHubProject ? handleFindAllTmMatches : undefined}
                isFindingTms={isMatchingTm}
                isGitHubConnected={isGitHubConnected}
                onDisconnectFromGitHub={handleDisconnect}
                onSyncFormatting={formattingHook.handleSyncFormatting}
                isSyncingFormatting={formattingHook.isSyncingFormatting}
                onBatchSyncFormatting={formattingHook.handleBatchSyncFormatting}
                isBatchSyncingFormatting={formattingHook.isBatchSyncingFormatting}
                onResegment={handleResegmentProject}
                onViewDocxXml={isDocxProjectOnGitHub ? handleFetchDocxXml : undefined}
                isViewingDocxXml={isFetchingDocxXml}
                overallQuality={overallScores.quality}
                overallConsistency={overallScores.consistency}
                qualityTrend={trends.quality}
                consistencyTrend={trends.consistency}
                isSubtitleProject={!!internalProjectState.project.youtubeUrl}
                isWebpageProject={!!internalProjectState.project.webpageUrl}
                isProofreaderMode={isProofreaderMode}
                onToggleProofreaderMode={handleToggleProofreaderMode}
                contributors={internalProjectState.project.contributors || []}
                proofreader1={internalProjectState.project.proofreader1}
                proofreader2={internalProjectState.project.proofreader2}
                onFinalizeProject={handleFinalizeProject}
                isFinalizeDisabled={isFinalizeDisabled}
                onBatchReevaluate={evaluationHook.handleBatchReevaluate}
                isBatchEvaluating={evaluationHook.isBatchEvaluating}
            />

            <div className="flex-grow flex min-h-0">
                <div className="flex-grow flex flex-col min-w-0">
                    <main className="flex-grow p-4 min-h-0 overflow-y-auto">
                        <BoundingBox name="editor main view" className="h-full !m-0 !p-0">
                            {internalProjectState.project.youtubeUrl ? (
                                <SubtitleEditor
                                    segments={segments}
                                    onSegmentChange={updateSegmentTarget}
                                    onSegmentFocus={handleSegmentFocus}
                                    onSegmentComplete={evaluationHook.handleSegmentComplete}
                                    onUpdateSegmentTimes={updateSegmentTimes}
                                    videoCurrentTime={videoCurrentTime}
                                    onTimeUpdate={setVideoCurrentTime}
                                    videoDuration={videoDuration}
                                    onDurationChange={setVideoDuration}
                                    activeSegmentId={activeSegment}
                                    evaluatingSegmentId={evaluationHook.evaluatingSegmentId}
                                />
                            ) : (
                                <SegmentTable
                                    segments={segments}
                                    onSegmentChange={updateSegmentTarget}
                                    onJoinSegments={joinSegments}
                                    onSplitSegment={async (segmentId) => {
                                        const segment = segments.find(s => s.id === segmentId);
                                        const sourceEditor = sourceSegmentRefs.current[segmentId];
                                        if(segment && sourceEditor) {
                                            const result = await correctionHook.handleSplitSegment(segment, sourceEditor);
                                            if (result) {
                                                const segmentIndex = segments.findIndex(s => s.id === segmentId);
                                                splitSegmentInState(segmentIndex, result.newSegment1, result.newSegment2);
                                            }
                                        }
                                    }}
                                    onSegmentComplete={evaluationHook.handleSegmentComplete}
                                    onEnterPress={(id) => {
                                        evaluationHook.handleSegmentComplete(id);
                                        const currentIndex = segments.findIndex(s => s.id === id);
                                        if (currentIndex !== -1 && currentIndex < segments.length - 1) {
                                            handleSegmentFocus(segments[currentIndex + 1].id);
                                        }
                                    }}
                                    onCopySource={(id) => {
                                        const segment = segments.find(s => s.id === id);
                                        if (segment) updateSegmentTarget(id, segment.source);
                                    }}
                                    onCopyFormatting={(id) => formattingHook.handleSyncFormatting()}
                                    segmentRefs={segmentRefs}
                                    sourceSegmentRefs={sourceSegmentRefs}
                                    onShowDefinition={terminologyHook.handleShowDefinition}
                                    onTranslateSelection={handleTranslateSelection}
                                    termBase={loadedTerms}
                                    onNewTerm={terminologyHook.handleNewTermRequest}
                                    onInsertTerm={(targetTerm) => correctionHook.insertHtmlAtCursor(targetTerm, activeSegment!)}
                                    onInsertTag={(tag, segmentId) => correctionHook.insertHtmlAtCursor(tag, segmentId)}
                                    onInsertHighlight={(text) => correctionHook.insertHtmlAtCursor(text, activeSegment!)}
                                    onToggleStructure={analysisHook.handleToggleStructure}
                                    segmentsBeingStructured={analysisHook.segmentsBeingStructured}
                                    onToggleDateHighlight={analysisHook.handleToggleDateHighlight}
                                    segmentsBeingDated={analysisHook.segmentsBeingDated}
                                    onCorrectGrammar={correctionHook.handleCorrectGrammar}
                                    segmentsBeingCorrected={correctionHook.segmentsBeingCorrected}
                                    evaluatingSegmentId={evaluationHook.evaluatingSegmentId}
                                    allTmMatches={allTmMatches}
                                    onApplyTmMatch={handleApplyTmMatch}
                                    lastUpdatedBySystem={correctionHook.lastUpdatedBySystem}
                                    onUpdateProcessed={correctionHook.clearLastUpdatedBySystem}
                                    openModal={openModal}
                                    isProofreaderMode={isProofreaderMode}
                                    currentUser={currentUserLogin}
                                    currentUserRoles={currentUserRoles}
                                    proofreader1={internalProjectState.project.proofreader1}
                                    proofreader2={internalProjectState.project.proofreader2}
                                    onApproveSegment={handleApproveSegment}
                                    onRejectSegment={handleRejectSegment}
                                />
                            )}
                        </BoundingBox>
                    </main>

                    {paneLayout.bottom.length > 0 && (
                        <div style={{ flex: `0 0 ${bottomPanelHeight}px` }} className="min-h-0">
                           <BottomPanel 
                                height={bottomPanelHeight}
                                wordCount={translationStats.wordCount}
                                charCount={translationStats.charCount}
                                charCountWithSpaces={translationStats.charCountWithSpaces}
                                terminologyHits={translationStats.terminologyHits}
                                tmHitsFuzzy={translationStats.tmHitsFuzzy}
                                tmHits100={translationStats.tmHits100}
                                panes={paneLayout.bottom}
                                getPaneTitle={getPaneTitle}
                                renderPane={renderPane}
                                onDockPane={(paneId) => handleDockPane(paneId, 'sidebar')}
                                onDropPane={(paneId) => handleDockPane(paneId, 'bottom')}
                            />
                        </div>
                    )}
                     <div 
                        onMouseDown={(e) => {
                            const startY = e.clientY;
                            const startHeight = bottomPanelHeight;
                            const handleMouseMove = (moveE: MouseEvent) => {
                                const newHeight = startHeight - (moveE.clientY - startY);
                                handleBottomPanelResize(newHeight);
                            };
                            const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                            };
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                        }}
                        className="w-full h-2 bg-slate-300 hover:bg-indigo-400 cursor-ns-resize transition-colors"
                    />
                </div>

                <div 
                    onMouseDown={(e) => {
                        const startX = e.clientX;
                        const startWidth = sidebarWidth;
                        const handleMouseMove = (moveE: MouseEvent) => {
                            const newWidth = startWidth - (moveE.clientX - startX);
                            handleSidebarResize(newWidth);
                        };
                        const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                        };
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                    }}
                    className="h-full w-2 bg-slate-300 hover:bg-indigo-400 cursor-ew-resize transition-colors"
                />
                <div style={{ flex: `0 0 ${sidebarWidth}px` }} className="min-w-0">
                    <Sidebar 
                        onReorder={handleReorderSidebarPanes}
                        onDropPane={(paneId) => handleDockPane(paneId, 'sidebar')}
                    >
                        {paneLayout.sidebar.map(paneId => (
                            <Widget 
                                key={paneId} 
                                title={getPaneTitle(paneId)} 
                                onDock={() => handleDockPane(paneId, 'bottom')}
                            >
                                {renderPane(paneId)}
                            </Widget>
                        ))}
                    </Sidebar>
                </div>
            </div>

            {/* Modals */}
            {activeModal?.type === 'settings' && <SettingsModal isOpen={true} onClose={closeModal} onSave={(newSettings) => setInternalProjectState(p => ({...p, settings: newSettings}))} />}
            {activeModal?.type === 'commit' && <CommitModal isOpen={true} onClose={closeModal} onCommit={handleCommit} isCommitting={isCommitting} />}
            {activeModal?.type === 'push' && <GitHubPushModal isOpen={true} onClose={closeModal} projectName={internalProjectState.project.name} onPushToNewRepo={(...args) => handlePush('new', { ...args, repoName: args[0], repoDescription: args[1], isPrivate: args[2], commitMessage: args[3]})} onPushToExistingRepo={(...args) => handlePush('existing', { ...args, repo: args[0], commitMessage: args[1]})} />}
            {activeModal?.type === 'manageTms' && isGitHubProject && <ManageTmsModal isOpen={true} onClose={closeModal} owner={internalProjectState.sourceControl!.owner} repo={internalProjectState.sourceControl!.repo} projectState={internalProjectState} linkedTms={internalProjectState.project.translationMemories || []} onSave={(tms) => setInternalProjectState(p => ({...p, project: {...p.project, translationMemories: tms }}))} onUploadAndLink={onImportTmArchive} />}
            {activeModal?.type === 'manageTermDbs' && isGitHubProject && <ManageTermDbsModal isOpen={true} onClose={closeModal} owner={internalProjectState.sourceControl!.owner} repo={internalProjectState.sourceControl!.repo} projectState={internalProjectState} linkedTermDbs={internalProjectState.project.termDatabases || []} onSave={(dbs) => setInternalProjectState(p => ({...p, project: {...p.project, termDatabases: dbs }}))} onUploadAndLink={handleUploadAndLinkTermDb} />}
            {activeModal?.type === 'loadTermDb' && isGitHubProject && <LoadTermDbModal isOpen={true} onClose={closeModal} owner={internalProjectState.sourceControl!.owner} repo={internalProjectState.sourceControl!.repo} onLoad={handleLoadAndMergeTermDb} />}
            {activeModal?.type === 'sync' && <SyncModal isOpen={true} onClose={closeModal} conflicts={syncConflicts} onResolve={handleResolveSync} isResolving={isResolving} />}
            {activeModal?.type === 'qaReport' && <QaReportModal isOpen={true} onClose={closeModal} issues={qaIssues} onGoToSegment={handleGoToSegment} onRunAgain={handleRunQaChecks} isLoading={isQaRunning} onApplySuggestion={handleApplyQaSuggestion} />}
            {activeModal?.type === 'autoTranslate' && <AutoTranslateModal isOpen={true} onClose={closeModal} onConfirm={handleAutoTranslate} isTranslating={mtHook.isAutoTranslating} totalSegments={segments.length} activeSegmentNumber={activeSegmentNumber} />}
            {activeModal?.type === 'connectGitHub' && <GitHubConnectModal isOpen={true} onClose={closeModal} onConnectSuccess={handleConnectSuccess} />}
            {activeModal?.type === 'manageUsers' && <UserManagementModal isOpen={true} onClose={closeModal} contributors={internalProjectState.project.contributors || []} onUpdateContributors={onUpdateContributors} currentUser={currentUserLogin} />}
            {activeModal?.type === 'definition' && activeModal.payload?.word && activeModal.payload?.position && <DefinitionModal isOpen={true} word={activeModal.payload.word} position={activeModal.payload.position} onClose={closeModal} onFetchDefinition={terminologyHook.handleFetchDefinition} />}
            {activeModal?.type === 'newTerm' && activeModal.payload?.sourceTerm && <NewTermModal isOpen={true} onClose={closeModal} sourceTerm={activeModal.payload.sourceTerm} onSave={terminologyHook.handleSaveNewTerm} onFetchSuggestions={terminologyHook.handleFetchTermSuggestions} />}
            {activeModal?.type === 'dictation' && activeModal.payload?.segmentId != null && activeModal.payload?.originalText != null && <DictationModal isOpen={true} onClose={closeModal} onInsert={(transcript) => correctionHook.handleTranscriptionCorrection(activeModal.payload!.segmentId!, activeModal.payload!.originalText!, transcript)} />}
            {activeModal?.type === 'statisticsReport' && <StatisticsReportModal isOpen={true} onClose={closeModal} reportData={statisticsData} projectName={internalProjectState.project.name} />}
            {insertionMenu.isOpen && (
                <InsertionMenu 
                    items={insertionMenu.items}
                    position={insertionMenu.position}
                    onInsert={handleInsertItem}
                    onClose={handleCloseMenu}
                />
            )}
        </div>
    );
};

export const EditorView: React.FC<EditorViewProps> = (props) => {
    const [internalProjectState, setInternalProjectState] = useState(props.projectState);
    
    useEffect(() => {
        setInternalProjectState(props.projectState);
    }, [props.projectState]);

    // --- Session State Management ---
    const [activeSegmentId, setActiveSegmentId] = useState<number | null>(props.projectState.session.activeSegmentId);
    const [tokenCounts, setTokenCounts] = useState({
        input: props.projectState.session.inputTokenCount || 0,
        output: props.projectState.session.outputTokenCount || 0,
        calls: props.projectState.session.apiCallCount || 0,
    });

    const onSegmentFocus = useCallback((segmentId: number | null) => {
        setActiveSegmentId(segmentId);
    }, []);

    const addTokens = useCallback((input: number, output: number, calls: number) => {
        setTokenCounts(prev => ({
            input: prev.input + input,
            output: prev.output + output,
            calls: prev.calls + calls,
        }));
    }, []);
    
    // Create the value for the SessionProvider
    const sessionContextValue = {
        activeSegmentId,
        inputTokenCount: tokenCounts.input,
        outputTokenCount: tokenCounts.output,
        apiCallCount: tokenCounts.calls,
        onSegmentFocus,
        addTokens,
    };
    
    return (
        <ProjectProvider projectState={internalProjectState}>
             <UIStateProvider>
                <SessionProvider value={sessionContextValue}>
                    <EditorLayout 
                        {...props} 
                        internalProjectState={internalProjectState}
                        setInternalProjectState={setInternalProjectState}
                    />
                </SessionProvider>
            </UIStateProvider>
        </ProjectProvider>
    );
};