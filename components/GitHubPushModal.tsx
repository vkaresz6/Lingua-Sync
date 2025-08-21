import React, { useState, useEffect, useMemo } from 'react';
import * as gh from '../utils/githubApi';
import { getGitHubAuth, saveGitHubAuth, clearGitHubAuth } from '../utils/projectManager';
import { BoundingBox } from './BoundingBox';
import { STRINGS } from '../strings';

interface GitHubPushModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectName: string;
    onPushToNewRepo: (repoName: string, repoDescription: string, isPrivate: boolean, commitMessage: string) => Promise<void>;
    onPushToExistingRepo: (repo: gh.GitHubRepo, commitMessage: string) => Promise<void>;
}

const GitHubLogo = () => (
    <svg height="24" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="24" fill="currentColor">
        <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
    </svg>
);
const RepoIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>);

const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const GitHubPushModal: React.FC<GitHubPushModalProps> = ({ isOpen, onClose, projectName, onPushToNewRepo, onPushToExistingRepo }) => {
    const [token, setToken] = useState('');
    const [user, setUser] = useState<gh.GitHubUser | null>(null);
    const [isLoading, setIsLoading] = useState<'auth' | 'repos' | 'push' | false>(false);
    const [error, setError] = useState('');
    const [selectedAction, setSelectedAction] = useState<'new' | 'existing' | null>('new');
    
    // Form state
    const [repoName, setRepoName] = useState(projectName.replace(/\.(docx|pdf|lingua)$/, ''));
    const [repoDesc, setRepoDesc] = useState('');
    const [isPrivate, setIsPrivate] = useState(true);
    const [commitMessage, setCommitMessage] = useState('Initial commit');

    // Existing repo state
    const [repos, setRepos] = useState<gh.GitHubRepo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<gh.GitHubRepo | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if(isOpen) {
            const savedAuth = getGitHubAuth();
            if (savedAuth) {
                connect(savedAuth.token);
            } else {
                 setUser(null);
                 setToken('');
            }
            // Reset form state on open
            setRepoName(projectName.replace(/\.(docx|pdf|lingua)$/, ''));
            setRepoDesc('');
            setIsPrivate(true);
            setCommitMessage('Initial commit');
            setSelectedRepo(null);
            setSearchTerm('');
            setSelectedAction('new');
            setError('');
        }
    }, [isOpen, projectName]);
    
    useEffect(() => {
        if(user && repos.length === 0) {
            fetchRepos();
        }
    }, [user, repos.length]);

    const connect = async (tokenToUse: string) => {
        setIsLoading('auth');
        setError('');
        try {
            const userData = await gh.verifyTokenAndGetUser(tokenToUse);
            setUser(userData);
            saveGitHubAuth(tokenToUse, userData.login);
        } catch (e: any) {
            setError('Connection failed. Please check your token.');
            clearGitHubAuth();
        } finally {
            setIsLoading(false);
        }
    };
    
    const fetchRepos = async () => {
        const auth = getGitHubAuth();
        if(!auth) return;
        setIsLoading('repos');
        setError('');
        try {
            const repoData = await gh.listRepos(auth.token);
            setRepos(repoData);
        } catch(e) {
            setError(STRINGS.GITHUB_FETCH_REPOS_FAILED);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePush = async () => {
        if (!commitMessage.trim()) {
            setError(STRINGS.ERROR_COMMIT_MSG_EMPTY);
            return;
        }

        setIsLoading('push');
        setError('');
        try {
            if (selectedAction === 'new') {
                if (!repoName.trim()) {
                    throw new Error(STRINGS.ERROR_REPO_NAME_EMPTY);
                }
                await onPushToNewRepo(repoName, repoDesc, isPrivate, commitMessage);
            } else if (selectedAction === 'existing' && selectedRepo) {
                await onPushToExistingRepo(selectedRepo, commitMessage);
            } else {
                throw new Error(STRINGS.ERROR_NO_REPO_SELECTED);
            }
        } catch(e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            setIsLoading(false);
        }
    };
    
    const handleActionSelect = (action: 'new' | 'existing') => {
        setSelectedAction(action);
        if (action === 'new') {
            setSelectedRepo(null);
        }
    };

    const filteredRepos = useMemo(() => {
        if (!searchTerm) return repos;
        return repos.filter(repo => repo.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [repos, searchTerm]);

    const isPushDisabled = isLoading === 'push' || !commitMessage.trim() || !selectedAction ||
        (selectedAction === 'new' && !repoName.trim()) ||
        (selectedAction === 'existing' && !selectedRepo);

    if (!isOpen) return null;

    const renderAuth = () => (
         <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
                <GitHubLogo />
                <h3 className="text-xl font-bold text-slate-800">{STRINGS.GITHUB_CONNECT_TITLE}</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">{STRINGS.GITHUB_TOKEN_SCOPES}</p>
            <div className="flex items-center gap-2">
                <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="ghp_..." className="flex-grow p-2 border border-slate-300 rounded-md shadow-sm text-slate-900"/>
                <button onClick={() => connect(token)} disabled={isLoading === 'auth'} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                    {isLoading === 'auth' ? <Spinner/> : STRINGS.GITHUB_CONNECT_BUTTON}
                </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
    );
    
    const renderPushUI = () => (
        <>
            <div className="p-6 border-b border-slate-200">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">{STRINGS.PUSH_MODAL_TITLE}</h2>
                    <button onClick={() => { setUser(null); clearGitHubAuth(); }} className="text-xs font-medium text-slate-500 hover:text-red-500">{STRINGS.GITHUB_DISCONNECT_BUTTON}</button>
                </div>
                <p className="text-sm text-slate-500 mt-1">{STRINGS.PUSH_MODAL_PROJECT_LABEL(projectName)}</p>
            </div>
            
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Create New Repo */}
                    <div onClick={() => handleActionSelect('new')} className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${selectedAction === 'new' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-slate-400'}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <input type="radio" readOnly checked={selectedAction === 'new'} className="form-radio text-indigo-600 focus:ring-indigo-500" />
                            <h4 className="font-bold text-lg text-slate-800">{STRINGS.ACTION_CREATE_NEW_REPO}</h4>
                        </div>
                        <div className="space-y-3 pl-6">
                             <div>
                                <label htmlFor="repo-name" className="block text-xs font-medium text-slate-600 mb-1">{STRINGS.LABEL_REPO_NAME}</label>
                                <input id="repo-name" type="text" value={repoName} onFocus={() => handleActionSelect('new')} onChange={e => setRepoName(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm text-sm text-slate-900"/>
                            </div>
                             <div>
                                <label htmlFor="repo-desc" className="block text-xs font-medium text-slate-600 mb-1">{STRINGS.LABEL_REPO_DESC}</label>
                                <input id="repo-desc" type="text" value={repoDesc} onFocus={() => handleActionSelect('new')} onChange={e => setRepoDesc(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm text-sm text-slate-900"/>
                            </div>
                            <div className="flex items-center gap-4 pt-1">
                                <label className="flex items-center gap-2 text-sm"><input type="radio" name="vis" checked={isPrivate} onChange={() => setIsPrivate(true)}/>{STRINGS.LABEL_REPO_VISIBILITY_PRIVATE}</label>
                                <label className="flex items-center gap-2 text-sm"><input type="radio" name="vis" checked={!isPrivate} onChange={() => setIsPrivate(false)}/> {STRINGS.LABEL_REPO_VISIBILITY_PUBLIC}</label>
                            </div>
                        </div>
                    </div>
                    {/* Push to Existing */}
                    <div onClick={() => handleActionSelect('existing')} className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${selectedAction === 'existing' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-slate-400'}`}>
                        <div className="flex items-center gap-2 mb-4">
                           <input type="radio" readOnly checked={selectedAction === 'existing'} className="form-radio text-indigo-600 focus:ring-indigo-500" />
                           <h4 className="font-bold text-lg text-slate-800">{STRINGS.ACTION_PUSH_EXISTING_REPO}</h4>
                        </div>
                        <div className="space-y-3 pl-6">
                             <div>
                                <label htmlFor="repo-search" className="block text-xs font-medium text-slate-600 mb-1">{STRINGS.LABEL_SEARCH_REPOS}</label>
                                <input id="repo-search" type="text" placeholder={STRINGS.PLACEHOLDER_SEARCH} value={searchTerm} onFocus={() => handleActionSelect('existing')} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm text-sm text-slate-900"/>
                            </div>
                            {isLoading === 'repos' ? <div className="flex justify-center p-4"><Spinner/></div> : (
                                <ul className="border border-slate-300 rounded-md max-h-40 overflow-y-auto bg-white">
                                    {filteredRepos.map(repo => (
                                        <li key={repo.id} className="border-b border-slate-200 last:border-b-0">
                                            <button onClick={() => setSelectedRepo(repo)} className={`w-full text-left p-2 text-sm truncate ${selectedRepo?.id === repo.id ? 'bg-indigo-100' : 'hover:bg-slate-50'}`}>
                                                <div className="flex items-center gap-2 font-semibold text-slate-800"><RepoIcon /> <span className="truncate">{repo.full_name}</span></div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                             )}
                        </div>
                    </div>
                </div>
                
                <div className="mt-6">
                    <label htmlFor="commit-msg" className="block text-sm font-medium text-slate-700 mb-1">{STRINGS.LABEL_COMMIT_MESSAGE}</label>
                    <input id="commit-msg" type="text" value={commitMessage} onChange={e => setCommitMessage(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm text-slate-900"/>
                </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 items-center">
                {error && <p className="text-red-500 text-sm mr-auto px-2">{error}</p>}
                <button onClick={onClose} disabled={isLoading === 'push'} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50">{STRINGS.BUTTON_CANCEL}</button>
                <button onClick={handlePush} disabled={isPushDisabled} className="px-4 py-2 w-36 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed flex justify-center">
                    {isLoading === 'push' ? <Spinner/> : STRINGS.BUTTON_PUSH_GITHUB}
                </button>
            </div>
        </>
    );


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 animate-fade-in-fast" onMouseDown={onClose}>
            <BoundingBox name="github push modal" className="w-full max-w-4xl">
                 <div className="bg-white rounded-lg shadow-2xl w-full" onMouseDown={e => e.stopPropagation()}>
                    {!user ? renderAuth() : renderPushUI()}
                </div>
            </BoundingBox>
            <style>{`
                @keyframes fade-in-fast { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};