




import React, { useState, useEffect } from 'react';
import { ProjectState, GeminiPrompts, TermUnit, Term, Contributor, Segment, UserRole, TranslationUnit } from './types';
import { ProjectListView } from './components/ProjectListView';
import { EditorView } from './components/EditorView';
import { ImportContextModal } from './components/ImportContextModal';
import { TimedTranscriptImportModal } from './components/TimedTranscriptImportModal';
import { WebpageImportModal } from './components/WebpageImportModal';
import { getProjects, saveProject, deleteProject, getGitHubAuth } from './utils/projectManager';
import { DEFAULT_PROMPTS, STRINGS } from './strings';
import { loadProjectFile, parseDocxForProject, parsePdfToText, parseTermDb, exportTermDb, exportTranslationMemory, exportTmUnits, parseTimedTranscript, stripHtml, parseHtmlForProject } from './utils/fileHandlers';
import { parseMqxlz } from './utils/importer';
import { segmentText as apiSegmentText, batchSegmentTimedText } from './utils/geminiApi';
import * as gh from './utils/githubApi';
import * as tmManager from './utils/tmManager';

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string); // Return the full data URL
    reader.onerror = error => reject(error);
});


const App: React.FC = () => {
    const [view, setView] = useState<'projects' | 'editor'>('projects');
    const [projects, setProjects] = useState<Record<string, ProjectState>>({});
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [isImportContextModalOpen, setIsImportContextModalOpen] = useState(false);
    const [isTranscriptImportModalOpen, setIsTranscriptImportModalOpen] = useState(false);
    const [isWebpageImportModalOpen, setIsWebpageImportModalOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    useEffect(() => {
        setProjects(getProjects());
    }, [view]);

    const handleOpenFile = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.docx,.pdf,.lingua';
        fileInput.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            if (file.name.endsWith('.lingua')) {
                setLoadingMessage(STRINGS.LOADING_PROJECT);
                setIsLoading(true);
                try {
                    const projectState = await loadProjectFile(file);
                    
                    // Ensure all prompts have a default value if missing from the saved file.
                    const mergedPrompts = { ...DEFAULT_PROMPTS, ...(projectState.settings.prompts || {}) };
                    projectState.settings.prompts = mergedPrompts;

                    // Backwards compatibility for roles
                    if (projectState.project.contributors) {
                        projectState.project.contributors = (projectState.project.contributors as any[]).map(c => {
                            if (c.role && !c.roles) {
                                return { githubUsername: c.githubUsername, roles: [c.role] };
                            }
                            return c;
                        });
                    }
                    const projectId = `proj_${Date.now()}`;
                    saveProject(projectId, projectState);
                    setActiveProjectId(projectId);
                    setView('editor');
                } catch (error) {
                    console.error('Error loading project file:', error);
                    alert(STRINGS.FAILED_LOAD_PROJECT(error instanceof Error ? error.message : STRINGS.UNKNOWN_ERROR));
                } finally {
                    setIsLoading(false);
                }
            } else if (file.name.endsWith('.docx') || file.name.endsWith('.pdf')) {
                setPendingFile(file);
                setIsImportContextModalOpen(true);
            } else {
                alert(STRINGS.UNSUPPORTED_FILE_TYPE);
            }
        };
        fileInput.click();
    };

    const handleOpenTranscriptImport = () => {
        setIsTranscriptImportModalOpen(true);
    };

    const handleOpenWebpageImport = () => {
        setIsWebpageImportModalOpen(true);
    };
    
    const handleImportTmArchive = async (file: File, projectState: ProjectState): Promise<string> => {
        setLoadingMessage(STRINGS.IMPORTING_TM);
        setIsLoading(true);

        const auth = getGitHubAuth();
        if (!auth) {
            alert(STRINGS.CONNECT_GITHUB_FIRST);
            setIsLoading(false);
            throw new Error(STRINGS.GITHUB_NOT_CONNECTED);
        }
        
        if (!projectState.sourceControl) {
            alert("Project must be on GitHub to import a TM.");
            setIsLoading(false);
            throw new Error("Project not on GitHub.");
        }
        
        const { owner, repo } = projectState.sourceControl;

        try {
            const tmUnits = await parseMqxlz(file);
            if (tmUnits.length === 0) {
                alert(STRINGS.NO_UNITS_IN_ARCHIVE);
                throw new Error("No units found.");
            }

            const tmContent = exportTmUnits(tmUnits);
            const tmFileName = `${file.name.replace(/\.mqxlz$/, '')}.trmem`;
            const tmFilePath = `translation_memories/${tmFileName}`;
            
            let existingTmSha: string | undefined;
            try {
                const { sha } = await gh.getFileContent(auth.token, owner, repo, tmFilePath);
                existingTmSha = sha;
            } catch (e) { /* File probably doesn't exist, fine. */ }
            
            await gh.commitFile(auth.token, owner, repo, tmFilePath, tmContent, `Import TM from ${file.name}`, existingTmSha);

            alert(STRINGS.SUCCESS_IMPORT_TM(tmUnits.length, tmFileName));
            return tmFileName;

        } catch (error) {
            console.error('Error importing TM archive:', error);
            alert(STRINGS.FAILED_IMPORT_TM(error instanceof Error ? error.message : STRINGS.UNKNOWN_ERROR));
            throw error;
        } finally {
            setIsLoading(false);
        }
    };


    const handleProceedWithImport = async (context: string, sourceLang: string, targetLang: string) => {
        if (!pendingFile) return;

        setIsImportContextModalOpen(false);
        setLoadingMessage(STRINGS.CREATING_PROJECT);
        setIsLoading(true);

        try {
            const file = pendingFile;
            let newSegments: Segment[] = [];
            let sourceDocumentHtml: string | undefined = undefined;

            const savedSettingsRaw = localStorage.getItem('gemini-settings');
            const savedSettings = savedSettingsRaw ? JSON.parse(savedSettingsRaw) : {};
            const prompts: GeminiPrompts = { ...DEFAULT_PROMPTS, ...(savedSettings.prompts || {}) };
            const model: string = savedSettings.model || 'gemini-2.5-flash';

            if (file.name.endsWith('.docx')) {
                const result = await parseDocxForProject(file, prompts.segmentation, model);
                newSegments = result.segments;
                sourceDocumentHtml = result.sourceDocumentHtml;
            } else if (file.name.endsWith('.pdf')) {
                const rawText = await parsePdfToText(file);
                let parsedSegments: string[];
                if (rawText.trim()) {
                     const { data: sentences } = await apiSegmentText(rawText, prompts.segmentation, model);
                     parsedSegments = sentences;
                } else {
                    parsedSegments = [];
                }

                const tempDoc = document.createElement('body');
                newSegments = parsedSegments.map((text, index) => {
                    const id = Date.now() + index;
                    const p = document.createElement('p');
                    p.textContent = text;
                    const sourceHTML = p.outerHTML;
                    p.setAttribute('data-lingua-id', String(id));
                    tempDoc.appendChild(p);
                    return {
                        id,
                        source: sourceHTML,
                        target: '',
                        status: 'draft',
                    };
                });
                sourceDocumentHtml = tempDoc.innerHTML;
            } else {
                 throw new Error("Unsupported file type.");
            }
            
            const dataUrlContent = await toBase64(file);

            const projectId = `proj_${Date.now()}`;
            const newState: ProjectState = {
                version: '1.4.0', // Updated version to reflect new structure
                appName: 'LinguaSync',
                createdAt: new Date().toISOString(),
                project: {
                    name: file.name,
                    context: context,
                    sourceLanguage: sourceLang,
                    targetLanguage: targetLang,
                    translationMemories: [],
                    termDatabases: [],
                    contributors: [],
                    leader: '',
                    proofreader1: '',
                    proofreader2: '',
                },
                data: {
                    segments: newSegments,
                },
                session: {
                    inputTokenCount: 0,
                    outputTokenCount: 0,
                    apiCallCount: 0,
                    activeSegmentId: newSegments.length > 0 ? newSegments[0].id : null,
                },
                settings: {
                    prompts: prompts,
                    model: model
                },
                sourceFile: {
                    name: file.name,
                    content: dataUrlContent,
                },
                sourceDocumentHtml,
            };
            
            const auth = getGitHubAuth();
            if (auth?.login) {
                newState.project.contributors = [{ githubUsername: auth.login, roles: ['Owner'] }];
                newState.project.leader = auth.login;
            }

            saveProject(projectId, newState);
            setActiveProjectId(projectId);
            sessionStorage.setItem('newProjectCreated', 'true');
            setView('editor');
        } catch (error) {
            console.error('Error creating new project:', error);
            alert(STRINGS.FAILED_CREATE_PROJECT(error instanceof Error ? error.message : STRINGS.UNKNOWN_ERROR));
        } finally {
            setIsLoading(false);
            setPendingFile(null);
        }
    };
    
    const handleProceedWithWebpageImport = async (url: string, context: string, sourceLang: string, targetLang: string) => {
        setIsWebpageImportModalOpen(false);
        setLoadingMessage(STRINGS.CREATING_PROJECT_FROM_WEBPAGE);
        setIsLoading(true);
    
        try {
            // Note: This direct fetch can be blocked by CORS policy.
            // A robust solution would use a server-side proxy to fetch the URL content.
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch webpage. Status: ${response.status} ${response.statusText}`);
            }
            const htmlString = await response.text();
    
            const savedSettingsRaw = localStorage.getItem('gemini-settings');
            const savedSettings = savedSettingsRaw ? JSON.parse(savedSettingsRaw) : {};
            const prompts: GeminiPrompts = { ...DEFAULT_PROMPTS, ...(savedSettings.prompts || {}) };
            const model: string = savedSettings.model || 'gemini-2.5-flash';
    
            const { segments: newSegments, sourceDocumentHtml } = await parseHtmlForProject(htmlString, prompts.segmentation, model);
    
            const originalHtmlBase64 = btoa(unescape(encodeURIComponent(htmlString)));
            const dataUrlContent = `data:text/html;base64,${originalHtmlBase64}`;
    
            let projectName = new URL(url).hostname;
            try {
                 const doc = new DOMParser().parseFromString(htmlString, 'text/html');
                 const title = doc.querySelector('title')?.textContent;
                 if(title) projectName = title;
            } catch(e) {/* ignore parsing error */}


            const projectId = `proj_${Date.now()}`;
            const newState: ProjectState = {
                version: '1.5.0',
                appName: 'LinguaSync',
                createdAt: new Date().toISOString(),
                project: {
                    name: projectName,
                    webpageUrl: url,
                    context: context,
                    sourceLanguage: sourceLang,
                    targetLanguage: targetLang,
                    translationMemories: [],
                    termDatabases: [],
                    contributors: [],
                    leader: '',
                    proofreader1: '',
                    proofreader2: '',
                },
                data: {
                    segments: newSegments,
                },
                session: {
                    inputTokenCount: 0,
                    outputTokenCount: 0,
                    apiCallCount: 0,
                    activeSegmentId: newSegments.length > 0 ? newSegments[0].id : null,
                },
                settings: {
                    prompts: prompts,
                    model: model
                },
                sourceFile: {
                    name: `${new URL(url).hostname}.html`,
                    content: dataUrlContent,
                },
                sourceDocumentHtml,
            };
    
            const auth = getGitHubAuth();
            if (auth?.login) {
                newState.project.contributors = [{ githubUsername: auth.login, roles: ['Owner'] }];
                newState.project.leader = auth.login;
            }
    
            saveProject(projectId, newState);
            setActiveProjectId(projectId);
            sessionStorage.setItem('newProjectCreated', 'true');
            setView('editor');
    
        } catch (error) {
            console.error('Error creating new project from webpage:', error);
            alert(`Failed to create project from webpage: ${error instanceof Error ? error.message : STRINGS.UNKNOWN_ERROR}`);
        } finally {
            setIsLoading(false);
        }
    };
    

    const handleProceedWithTranscriptImport = async (transcriptText: string, projectName: string, youtubeUrl: string, context: string, sourceLang: string, targetLang: string) => {
        setIsTranscriptImportModalOpen(false);
        setLoadingMessage(STRINGS.CREATING_PROJECT);
        setIsLoading(true);

        try {
            const timedChunks = parseTimedTranscript(transcriptText);

            if (!timedChunks || timedChunks.length === 0) {
                throw new Error(STRINGS.TRANSCRIPT_PARSE_ERROR);
            }

            setLoadingMessage(STRINGS.YOUTUBE_SEGMENTING);

            const savedSettingsRaw = localStorage.getItem('gemini-settings');
            const savedSettings = savedSettingsRaw ? JSON.parse(savedSettingsRaw) : {};
            const prompts: GeminiPrompts = { ...DEFAULT_PROMPTS, ...(savedSettings.prompts || {}) };
            const model: string = savedSettings.model || 'gemini-2.5-flash';

            const { data: segmentedTimedChunks, inputTokens, outputTokens, apiCalls } = await batchSegmentTimedText(timedChunks, prompts.batchTimedSegmentation, model);

            const tempDoc = document.createElement('body');
            const allSegments: Segment[] = segmentedTimedChunks.map((chunk, index) => {
                const id = Date.now() + index;
                const p = document.createElement('p');
                p.textContent = chunk.text;
                const sourceHTML = p.outerHTML;
                p.setAttribute('data-lingua-id', String(id));
                tempDoc.appendChild(p);
                return {
                    id,
                    source: sourceHTML,
                    target: '',
                    startTime: chunk.start,
                    endTime: chunk.end,
                    status: 'draft',
                };
            });
            const sourceDocumentHtml = tempDoc.innerHTML;

            const projectId = `proj_${Date.now()}`;
            const newState: ProjectState = {
                version: '1.4.0',
                appName: 'LinguaSync',
                createdAt: new Date().toISOString(),
                project: {
                    name: projectName,
                    youtubeUrl: youtubeUrl,
                    context: context,
                    sourceLanguage: sourceLang,
                    targetLanguage: targetLang,
                    translationMemories: [],
                    termDatabases: [],
                    contributors: [],
                    leader: '',
                    proofreader1: '',
                    proofreader2: '',
                },
                data: {
                    segments: allSegments,
                },
                session: {
                    inputTokenCount: inputTokens,
                    outputTokenCount: outputTokens,
                    apiCallCount: apiCalls,
                    activeSegmentId: allSegments.length > 0 ? allSegments[0].id : null,
                },
                settings: {
                    prompts: prompts,
                    model: model
                },
                sourceDocumentHtml,
            };

            const auth = getGitHubAuth();
            if (auth?.login) {
                newState.project.contributors = [{ githubUsername: auth.login, roles: ['Owner'] }];
                newState.project.leader = auth.login;
            }

            saveProject(projectId, newState);
            setActiveProjectId(projectId);
            sessionStorage.setItem('newProjectCreated', 'true');
            setView('editor');

        } catch (error) {
            console.error('Error creating new project from transcript:', error);
            alert(STRINGS.FAILED_CREATE_PROJECT_YOUTUBE(error instanceof Error ? error.message : STRINGS.UNKNOWN_ERROR));
        } finally {
            setIsLoading(false);
        }
    };


    const handleOpenProject = (projectId: string) => {
        setActiveProjectId(projectId);
        setView('editor');
    };
    
    const handleOpenGitHubProject = async (repo: gh.GitHubRepo, file: gh.GitHubFile) => {
        const auth = getGitHubAuth();
        if(!auth) {
            alert(STRINGS.GITHUB_TOKEN_NOT_FOUND);
            return;
        }

        setLoadingMessage(STRINGS.LOADING_FROM_GITHUB(repo.full_name));
        setIsLoading(true);

        try {
            // 1. Get .lingua file
            const { content, sha } = await gh.getFileContent(auth.token, repo.owner.login, repo.name, file.path);
            const projectState: ProjectState = JSON.parse(content);
            
            // Ensure all prompts have a default value if missing from the saved file.
            const mergedPrompts = { ...DEFAULT_PROMPTS, ...(projectState.settings.prompts || {}) };
            projectState.settings.prompts = mergedPrompts;

            // Backwards compatibility and ensuring properties exist
            if (!projectState.project.translationMemories) projectState.project.translationMemories = [];
            if (!projectState.project.termDatabases) projectState.project.termDatabases = [];
            if (!projectState.settings.model) projectState.settings.model = 'gemini-2.5-flash';
            if (!projectState.project.contributors) projectState.project.contributors = [];
            
            // Backwards compatibility for roles
            projectState.project.contributors = (projectState.project.contributors as any[]).map(c => {
                if (c.role && !c.roles) {
                    return { githubUsername: c.githubUsername, roles: [c.role] };
                }
                return c;
            });

            if (!projectState.project.leader && projectState.project.contributors.find(c => c.roles.includes('Owner'))) {
                projectState.project.leader = projectState.project.contributors.find(c => c.roles.includes('Owner'))?.githubUsername;
            }
            if (!projectState.project.proofreader1) projectState.project.proofreader1 = '';
            if (!projectState.project.proofreader2) projectState.project.proofreader2 = '';
            projectState.data.segments = projectState.data.segments.map(s => ({ ...s, status: s.status || 'draft' }));

            
            // 2. Add source control info
            projectState.sourceControl = {
                provider: 'github',
                owner: repo.owner.login,
                repo: repo.name,
                path: file.path,
                sha: sha,
            };

            const projectId = `gh_${repo.owner.login}_${repo.name}_${file.path.replace(/\//g, '_')}`;
            saveProject(projectId, projectState);
            setActiveProjectId(projectId);
            setView('editor');

        } catch(e) {
            console.error(e);
            alert(STRINGS.FAILED_OPEN_GITHUB(e instanceof Error ? e.message : STRINGS.UNKNOWN_ERROR));
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadTerminologyDatabase = async (state: ProjectState, terms: Term[]): Promise<string | null> => {
        const auth = getGitHubAuth();
        const owner = state.sourceControl?.owner;
        const repo = state.sourceControl?.repo;

        if (!auth || !owner || !repo) {
            throw new Error(STRINGS.GITHUB_NOT_CONNECTED_OR_REPO_MISSING);
        }
        
        if (!terms || terms.length === 0) {
            return state.project.termDatabases?.[0] || null;
        }
        
        let termDbFileName = state.project.termDatabases?.[0];

        if (!termDbFileName) {
            termDbFileName = `${(state.project.name || 'project').replace(/\.(docx|pdf|lingua)$/, '')}.termdb`;
        }
        
        const termDbFilePath = `terminology_databases/${termDbFileName}`;
        const termDbContent = exportTermDb(terms);

        if (!termDbContent) {
            return termDbFileName; // No content to save
        }
        
        let existingSha: string | undefined;
        try {
            const { sha } = await gh.getFileContent(auth.token, owner, repo, termDbFilePath);
            existingSha = sha;
        } catch (e) { /* File probably doesn't exist, which is fine. */ }
        
        await gh.commitFile(
            auth.token,
            owner,
            repo,
            termDbFilePath,
            termDbContent,
            `Update TermDB for project: ${state.project.name}`,
            existingSha
        );
        console.log(`Successfully updated terminology database: ${termDbFileName}`);
        return termDbFileName;
    };


    const handleUploadTranslationMemory = async (state: ProjectState): Promise<string | null> => {
        const auth = getGitHubAuth();
        const owner = state.sourceControl?.owner;
        const repo = state.sourceControl?.repo;
        if (!auth || !owner || !repo) return null;
    
        // Assume a single TM file for now for simplicity, as per original logic.
        const tmFileName = state.project.translationMemories?.[0] || `${(state.project.name || 'project').replace(/\.(docx|pdf|lingua)$/, '')}.trmem`;
        const tmFilePath = `translation_memories/${tmFileName}`;
    
        try {
            // 1. Get all TUs from local DB
            await tmManager.openDB();
            const localTUs = await tmManager.getAllUnits();
            if (localTUs.length === 0) {
                console.log("Local TM is empty, nothing to upload.");
                return tmFileName;
            }
            
            // 2. Get remote TUs
            let remoteTUs: TranslationUnit[] = [];
            let existingTmSha: string | undefined;
            try {
                const { content, sha } = await gh.getFileContent(auth.token, owner, repo, tmFilePath);
                if (content.trim()) {
                    remoteTUs = content.trim().split('\n').map(line => JSON.parse(line));
                }
                existingTmSha = sha;
            } catch (e) { 
                console.log("No remote TM found, creating a new one.");
            }
    
            // 3. Find only new TUs to append
            const remoteSet = new Set(remoteTUs.map(tu => `${tu.source}::${tu.target}`));
            const newTUsToAppend = localTUs.filter(tu => !remoteSet.has(`${tu.source}::${tu.target}`));
    
            if (newTUsToAppend.length === 0) {
                console.log("No new TM units to upload.");
                return tmFileName;
            }
    
            // 4. Create new content and commit
            const newUnitsContent = exportTmUnits(newTUsToAppend);
            const existingContent = exportTmUnits(remoteTUs);
            const finalContent = existingContent ? `${existingContent}\n${newUnitsContent}` : newUnitsContent;
            
            await gh.commitFile(
                auth.token, 
                owner, 
                repo, 
                tmFilePath, 
                finalContent, 
                `Update TM for project: ${state.project.name} (+${newTUsToAppend.length} units)`, 
                existingTmSha
            );
            console.log(STRINGS.SUCCESS_UPLOAD_TM(tmFileName));
            return tmFileName;
    
        } catch (e) {
            console.error(STRINGS.FAILED_UPLOAD_TM, e);
            return null;
        }
    };
    
    const handleCommitToGitHub = async (state: ProjectState, terms: Term[], commitMessage: string): Promise<ProjectState> => {
        const auth = getGitHubAuth();
        if(!auth) throw new Error(STRINGS.GITHUB_TOKEN_NOT_FOUND);
        if(!state.sourceControl) throw new Error(STRINGS.PROJECT_NOT_LINKED_TO_GITHUB);

        const { owner, repo, path } = state.sourceControl;
        
        const projectStateToCommit = JSON.parse(JSON.stringify(state));
        delete projectStateToCommit.sourceControl;
        delete projectStateToCommit.sourceFile; // Don't re-commit source file

        // Clean dirty flags before committing
        projectStateToCommit.data.segments = projectStateToCommit.data.segments.map((s: Segment) => {
            const newSeg = { ...s };
            delete newSeg.isDirty;
            return newSeg;
        });
        
        try {
            const termDbFileName = await handleUploadTerminologyDatabase(state, terms);
             if (termDbFileName && !projectStateToCommit.project.termDatabases.includes(termDbFileName)) {
                projectStateToCommit.project.termDatabases = [termDbFileName];
            }
        } catch(e) {
            console.error("Failed to upload terminology database during commit:", e);
        }
        
        try {
            const tmFileName = await handleUploadTranslationMemory(state);
            if (tmFileName && !projectStateToCommit.project.translationMemories.includes(tmFileName)) {
                projectStateToCommit.project.translationMemories = [tmFileName];
            }
        } catch(e) {
            console.error("Failed to upload translation memory during commit:", e);
        }

        const projectJson = JSON.stringify(projectStateToCommit, null, 2);
        const { sha: newSha } = await gh.commitFile(auth.token, owner, repo, path, projectJson, commitMessage, state.sourceControl.sha);
        
        const updatedState = { 
            ...state, 
            data: {
                segments: projectStateToCommit.data.segments,
            },
            project: {
                ...projectStateToCommit.project,
            },
            sourceControl: { ...state.sourceControl, sha: newSha }, 
            createdAt: new Date().toISOString() 
        };
        
        if(activeProjectId) {
            saveProject(activeProjectId, updatedState);
            setProjects(getProjects());
        }

        return updatedState;
    };

    const handlePushToNewGitHubRepo = async (state: ProjectState, terms: Term[], repoName: string, repoDescription: string, isPrivate: boolean, commitMessage: string) => {
        const auth = getGitHubAuth();
        if (!auth) throw new Error(STRINGS.GITHUB_TOKEN_NOT_FOUND);
        if (!activeProjectId) throw new Error(STRINGS.NO_ACTIVE_PROJECT_TO_PUSH);

        const newRepo = await gh.createRepo(auth.token, repoName, repoDescription, isPrivate);
        const owner = newRepo.owner.login;
        
        const tempSourceControl = { provider: 'github' as const, owner, repo: newRepo.name, path: '', sha: '' };
        
        const projectStateToCommit: ProjectState = JSON.parse(JSON.stringify(state));

        // Commit original source file if it exists
        if (projectStateToCommit.sourceFile) {
            await gh.commitFile(
                auth.token,
                owner,
                newRepo.name,
                `source_document/${projectStateToCommit.sourceFile.name}`,
                projectStateToCommit.sourceFile.content.split(',')[1],
                `Add original source document: ${projectStateToCommit.sourceFile.name}`,
                undefined,
                true // isBase64
            );
            delete projectStateToCommit.sourceFile; // Remove after committing
        }

        delete projectStateToCommit.sourceControl;

        // Ensure creator is owner and leader
        if (!projectStateToCommit.project.contributors?.some((c: Contributor) => c.roles.includes('Owner'))) {
            projectStateToCommit.project.contributors = [{ githubUsername: owner, roles: ['Owner'] }];
            projectStateToCommit.project.leader = owner;
        }

        // Clean dirty flags before committing
        projectStateToCommit.data.segments = projectStateToCommit.data.segments.map((s: Segment) => {
            const newSeg = { ...s };
            delete newSeg.isDirty;
            return newSeg;
        });

        const stateForUploads = { ...projectStateToCommit, sourceControl: tempSourceControl };

        // Upload terms and get the filename to link it
        const termDbFileName = await handleUploadTerminologyDatabase(stateForUploads, terms);
        if (termDbFileName) {
            projectStateToCommit.project.termDatabases = [termDbFileName];
        }
        
        // Upload TM and get the filename to link it
        const tmFileName = await handleUploadTranslationMemory(stateForUploads);
        if (tmFileName) {
            projectStateToCommit.project.translationMemories = [tmFileName];
        }

        const path = `${(state.project.name || 'project').replace(/\.(docx|pdf|lingua)$/, '')}.lingua`;
        const projectJson = JSON.stringify(projectStateToCommit, null, 2);
        const { sha: newSha } = await gh.commitFile(auth.token, owner, newRepo.name, path, projectJson, commitMessage);
        
        const finalState: ProjectState = {
            ...state,
            data: {
                segments: projectStateToCommit.data.segments,
            },
            project: { ...projectStateToCommit.project },
            sourceControl: {
                ...tempSourceControl,
                path: path,
                sha: newSha,
            },
            createdAt: new Date().toISOString(),
        };
        delete finalState.sourceFile;
        
        saveProject(activeProjectId, finalState);
        setProjects(getProjects());
    };
    
    const handlePushToExistingGitHubRepo = async (state: ProjectState, terms: Term[], repo: gh.GitHubRepo, commitMessage: string) => {
        const auth = getGitHubAuth();
        if (!auth) throw new Error(STRINGS.GITHUB_TOKEN_NOT_FOUND);
        if (!activeProjectId) throw new Error(STRINGS.NO_ACTIVE_PROJECT_TO_PUSH);
        
        const owner = repo.owner.login;
        const tempSourceControl = { provider: 'github' as const, owner, repo: repo.name, path: '', sha: '' };

        const projectStateToCommit: ProjectState = JSON.parse(JSON.stringify(state));

        // Commit original source file if it exists
        if (projectStateToCommit.sourceFile) {
            await gh.commitFile(auth.token, owner, repo.name, `source_document/${projectStateToCommit.sourceFile.name}`, projectStateToCommit.sourceFile.content.split(',')[1], `Add original source document: ${projectStateToCommit.sourceFile.name}`, undefined, true);
            delete projectStateToCommit.sourceFile;
        }
        
        delete projectStateToCommit.sourceControl;
        
        if (!projectStateToCommit.project.contributors?.some((c: Contributor) => c.roles.includes('Owner'))) {
            projectStateToCommit.project.contributors = [{ githubUsername: owner, roles: ['Owner'] }];
            projectStateToCommit.project.leader = owner;
        }

        // Clean dirty flags before committing
        projectStateToCommit.data.segments = projectStateToCommit.data.segments.map((s: Segment) => {
            const newSeg = { ...s };
            delete newSeg.isDirty;
            return newSeg;
        });
        
        const stateForUploads = { ...projectStateToCommit, sourceControl: tempSourceControl };

        const termDbFileName = await handleUploadTerminologyDatabase(stateForUploads, terms);
        if (termDbFileName) {
            projectStateToCommit.project.termDatabases = [termDbFileName];
        }

        const tmFileName = await handleUploadTranslationMemory(stateForUploads);
        if (tmFileName) {
            projectStateToCommit.project.translationMemories = [tmFileName];
        }

        const path = `${(state.project.name || 'project').replace(/\.(docx|pdf|lingua)$/, '')}.lingua`;
        const projectJson = JSON.stringify(projectStateToCommit, null, 2);

        const { sha: newSha } = await gh.commitFile(auth.token, owner, repo.name, path, projectJson, commitMessage);

        const finalState: ProjectState = {
            ...state,
            data: {
                segments: projectStateToCommit.data.segments,
            },
            project: { ...projectStateToCommit.project },
            sourceControl: {
                ...tempSourceControl,
                path: path,
                sha: newSha,
            },
            createdAt: new Date().toISOString(),
        };
        delete finalState.sourceFile;

        saveProject(activeProjectId, finalState);
        setProjects(getProjects());
    };


    const handleDeleteProject = (projectId: string) => {
        deleteProject(projectId);
        setProjects(getProjects());
    };
    
    const handleSaveProject = (currentState: ProjectState) => {
        if (activeProjectId) {
            const stateToSave = { ...currentState, createdAt: new Date().toISOString() };
            saveProject(activeProjectId, stateToSave);
        }
    };

    const handleGoBack = () => {
        setActiveProjectId(null);
        setView('projects');
    };

    const handleUploadTermDbAndLink = async (file: File, projectState: ProjectState): Promise<string> => {
        const auth = getGitHubAuth();
        if (!auth) throw new Error(STRINGS.GITHUB_NOT_CONNECTED);
        if (!projectState.sourceControl) throw new Error("Project must be on GitHub to upload a TermDB.");
        
        const { owner, repo } = projectState.sourceControl;

        const fileName = file.name.endsWith('.termdb') ? file.name : `${file.name.replace(/\.csv$/, '')}.termdb`;
        let content: string;

        if (file.name.endsWith('.csv')) {
            const text = await file.text();
            const termUnits: TermUnit[] = text.split('\n').slice(1).map(line => {
                const [source, target, definition] = line.split(',');
                return { source: source?.trim(), target: target?.trim(), definition: definition?.trim() };
            }).filter(t => t.source && t.target);
            content = exportTermDb(termUnits.map((tu, i) => ({...tu, id: i})));
        } else {
            content = await file.text();
        }

        const filePath = `terminology_databases/${fileName}`;
        
        let existingSha: string | undefined;
        try {
            const { sha } = await gh.getFileContent(auth.token, owner, repo, filePath);
            existingSha = sha;
        } catch (e) { /* File likely doesn't exist, which is fine */ }
        
        await gh.commitFile(auth.token, owner, repo, filePath, content, `Upload/update TermDB: ${fileName}`, existingSha);

        return fileName;
    };
    
    const handleUpdateContributors = (newContributors: Contributor[]) => {
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        if (!project) return;
    
        const leader = newContributors.find(c => c.roles.includes('Project Leader'));
        const proofreader1 = newContributors.find(c => c.roles.includes('Proofreader 1'));
        const proofreader2 = newContributors.find(c => c.roles.includes('Proofreader 2'));
    
        project.project.contributors = newContributors;
        project.project.leader = leader ? leader.githubUsername : '';
        project.project.proofreader1 = proofreader1 ? proofreader1.githubUsername : '';
        project.project.proofreader2 = proofreader2 ? proofreader2.githubUsername : '';
    
        saveProject(activeProjectId, project);
        setProjects(getProjects());
    };

    const handlePullFromGitHub = async () => {
        if (!activeProjectId) throw new Error("No active project.");
        const currentProject = projects[activeProjectId];
        if (!currentProject.sourceControl) throw new Error("Project not linked to GitHub.");
        
        setLoadingMessage("Pulling from GitHub...");
        setIsLoading(true);

        try {
            const { owner, repo, path } = currentProject.sourceControl;
            const auth = getGitHubAuth();
            if (!auth) throw new Error(STRINGS.GITHUB_NOT_CONNECTED);
    
            const { content, sha } = await gh.getFileContent(auth.token, owner, repo, path);
            const remoteState: ProjectState = JSON.parse(content);
            
            // Ensure all prompts have a default value if missing from the saved file.
            const mergedPrompts = { ...DEFAULT_PROMPTS, ...(remoteState.settings.prompts || {}) };
            remoteState.settings.prompts = mergedPrompts;
    
            if (!remoteState.project.translationMemories) remoteState.project.translationMemories = [];
            if (!remoteState.project.termDatabases) remoteState.project.termDatabases = [];
            if (!remoteState.settings.model) remoteState.settings.model = 'gemini-2.5-flash';
            if (!remoteState.project.contributors) remoteState.project.contributors = [];

            // Backwards compatibility for roles
            remoteState.project.contributors = (remoteState.project.contributors as any[]).map(c => {
                if (c.role && !c.roles) {
                    return { githubUsername: c.githubUsername, roles: [c.role] };
                }
                return c;
            });

            if (!remoteState.project.leader && remoteState.project.contributors.find(c => c.roles.includes('Owner'))) {
                remoteState.project.leader = remoteState.project.contributors.find(c => c.roles.includes('Owner'))?.githubUsername;
            }
            if (!remoteState.project.proofreader1) remoteState.project.proofreader1 = '';
            if (!remoteState.project.proofreader2) remoteState.project.proofreader2 = '';
            remoteState.data.segments = remoteState.data.segments.map(s => ({ ...s, status: s.status || 'draft' }));
            
            remoteState.sourceControl = { ...currentProject.sourceControl, sha };
            saveProject(activeProjectId, remoteState);
            setProjects(getProjects());
        } finally {
            setIsLoading(false);
        }
    };


    const renderView = () => {
        if (isLoading) {
            return (
                <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
                    <div className="text-center p-8 rounded-lg">
                        <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-4 text-lg font-semibold text-slate-700">{loadingMessage || STRINGS.LOADING_INDICATOR_DEFAULT}</p>
                    </div>
                </div>
            )
        }
        
        const activeProject = activeProjectId ? projects[activeProjectId] : null;

        if (view === 'editor' && activeProject) {
            return <EditorView 
                        projectState={activeProject} 
                        onSave={handleSaveProject} 
                        onBack={handleGoBack} 
                        onCommitToGitHub={handleCommitToGitHub}
                        onPushToNewGitHubRepo={handlePushToNewGitHubRepo}
                        onPushToExistingGitHubRepo={handlePushToExistingGitHubRepo}
                        onImportTmArchive={handleImportTmArchive}
                        onUploadTermDbAndLink={handleUploadTermDbAndLink}
                        onUpdateContributors={handleUpdateContributors}
                        onPullFromGitHub={handlePullFromGitHub}
                    />;
        }
        
        return <ProjectListView 
                    projects={projects} 
                    onOpenFile={handleOpenFile} 
                    onOpenTranscriptImport={handleOpenTranscriptImport}
                    onOpenWebpageImport={handleOpenWebpageImport}
                    onOpenProject={handleOpenProject} 
                    onDeleteProject={handleDeleteProject}
                    onOpenGitHubProject={handleOpenGitHubProject}
                />;
    };
    
    return (
        <>
            {renderView()}
            {isImportContextModalOpen && (
                <ImportContextModal
                    isOpen={isImportContextModalOpen}
                    onClose={() => setIsImportContextModalOpen(false)}
                    onProceed={handleProceedWithImport}
                    fileName={pendingFile?.name || ''}
                />
            )}
            {isTranscriptImportModalOpen && (
                <TimedTranscriptImportModal
                    isOpen={isTranscriptImportModalOpen}
                    onClose={() => setIsTranscriptImportModalOpen(false)}
                    onProceed={handleProceedWithTranscriptImport}
                />
            )}
            {isWebpageImportModalOpen && (
                <WebpageImportModal
                    isOpen={isWebpageImportModalOpen}
                    onClose={() => setIsWebpageImportModalOpen(false)}
                    onProceed={handleProceedWithWebpageImport}
                />
            )}
        </>
    );
};

export default App;