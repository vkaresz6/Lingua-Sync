import React, { useState, useEffect } from 'react';
import { BoundingBox } from './BoundingBox';
import * as gh from '../utils/githubApi';
import { getGitHubAuth, saveGitHubAuth, clearGitHubAuth } from '../utils/projectManager';
import { STRINGS } from '../strings';

interface GitHubPanelProps {
    onOpenGitHubProject: (repo: gh.GitHubRepo, file: gh.GitHubFile) => void;
}

const GitHubLogo = () => (
    <svg height="24" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="24" fill="currentColor">
        <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
    </svg>
);

const RepoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
);

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l4-4m-4 4l4 4" />
    </svg>
);


export const GitHubPanel: React.FC<GitHubPanelProps> = ({ onOpenGitHubProject }) => {
    const [token, setToken] = useState<string>('');
    const [user, setUser] = useState<gh.GitHubUser | null>(null);
    const [repos, setRepos] = useState<gh.GitHubRepo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<gh.GitHubRepo | null>(null);
    const [files, setFiles] = useState<gh.GitHubFile[]>([]);
    const [currentPath, setCurrentPath] = useState('');
    const [isLoading, setIsLoading] = useState<'user' | 'repos' | 'files' | false>(false);
    const [error, setError] = useState<string>('');
    
    useEffect(() => {
        const savedAuth = getGitHubAuth();
        if (savedAuth) {
            connect(savedAuth.token);
        }
    }, []);

    const connect = async (tokenToUse: string) => {
        setIsLoading('user');
        setError('');
        try {
            const userData = await gh.verifyTokenAndGetUser(tokenToUse);
            setUser(userData);
            saveGitHubAuth(tokenToUse, userData.login);
            await fetchRepos(tokenToUse);
        } catch (e: any) {
            setError('Connection failed. Please check your token and permissions.');
            clearGitHubAuth();
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = () => {
        if (token.trim()) {
            connect(token);
        }
    };

    const handleDisconnect = () => {
        clearGitHubAuth();
        setUser(null);
        setRepos([]);
        setSelectedRepo(null);
        setFiles([]);
        setToken('');
        setCurrentPath('');
    };
    
    const fetchRepos = async (tokenToUse: string) => {
        setIsLoading('repos');
        try {
            const repoData = await gh.listRepos(tokenToUse);
            setRepos(repoData);
        } catch (e) {
            setError(STRINGS.GITHUB_FETCH_REPOS_FAILED);
        } finally {
            setIsLoading(false);
        }
    };
    
    const fetchFiles = async (repo: gh.GitHubRepo, path: string) => {
        setFiles([]);
        setIsLoading('files');
        setError('');
        try {
            const auth = getGitHubAuth();
            if(!auth) throw new Error("Token not found");
            const fileData = await gh.getRepoContents(auth.token, repo.owner.login, repo.name, path);
            fileData.sort((a, b) => {
                if (a.type === 'dir' && b.type !== 'dir') return -1;
                if (a.type !== 'dir' && b.type === 'dir') return 1;
                return a.name.localeCompare(b.name);
            });
            setFiles(fileData);
            setCurrentPath(path);
        } catch (e) {
            setError(STRINGS.GITHUB_FETCH_CONTENT_FAILED(path));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectRepo = async (repo: gh.GitHubRepo) => {
        if (selectedRepo?.id === repo.id) {
            setSelectedRepo(null);
            setFiles([]);
            setCurrentPath('');
            return;
        }
        
        setSelectedRepo(repo);
        setCurrentPath('');
        await fetchFiles(repo, '');
    };
    
    const handleFileOrDirClick = (item: gh.GitHubFile) => {
        if (!selectedRepo) return;

        if (item.type === 'dir') {
            fetchFiles(selectedRepo, item.path);
        } else if (item.name.endsWith('.lingua')) {
            onOpenGitHubProject(selectedRepo, item);
        }
    };

    const handleGoBack = () => {
        if (!selectedRepo || !currentPath) return;

        const pathSegments = currentPath.split('/').filter(Boolean);
        pathSegments.pop();
        const newPath = pathSegments.join('/');
        fetchFiles(selectedRepo, newPath);
    };

    if (!user) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-4">
                    <GitHubLogo />
                    <h2 className="text-xl font-bold text-slate-800">{STRINGS.GITHUB_CONNECT_TITLE}</h2>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                    {STRINGS.GITHUB_CONNECT_DESC}
                </p>
                <p className="text-sm text-slate-600 mb-4">
                    {STRINGS.GITHUB_TOKEN_SCOPES}
                    <a href="https://github.com/settings/tokens/new?scopes=repo&description=LinguaSync" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 font-medium ml-2">{STRINGS.GITHUB_GENERATE_TOKEN_LINK}</a>
                </p>
                <div className="flex items-center gap-2">
                    <input
                        type="password"
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        placeholder="ghp_..."
                        className="flex-grow p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                    />
                    <button onClick={handleConnect} disabled={isLoading === 'user'} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                        {isLoading === 'user' ? STRINGS.GITHUB_CONNECTING_BUTTON : STRINGS.GITHUB_CONNECT_BUTTON}
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <img src={user.avatar_url} alt="user avatar" className="w-10 h-10 rounded-full" />
                    <div>
                        <p className="font-bold text-slate-800">{user.name || user.login}</p>
                        <a href={user.html_url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">{user.login}</a>
                    </div>
                </div>
                <button onClick={handleDisconnect} className="text-sm font-medium text-slate-600 hover:text-red-600">{STRINGS.GITHUB_DISCONNECT_BUTTON}</button>
            </div>
            
            <div className="flex justify-between items-center mt-6 mb-2">
                 <h3 className="text-lg font-semibold text-slate-700">{STRINGS.GITHUB_REPOS_TITLE}</h3>
            </div>
            {isLoading === 'repos' && <p>{STRINGS.GITHUB_LOADING_REPOS}</p>}
            <ul className="border border-slate-200 rounded-md max-h-96 overflow-y-auto">
                {repos.map(repo => (
                    <li key={repo.id} className="border-b border-slate-200 last:border-b-0">
                        <button onClick={() => handleSelectRepo(repo)} className="w-full text-left p-3 hover:bg-slate-50">
                            <div className="flex items-center gap-2 font-semibold text-slate-800">
                                <RepoIcon /> {repo.full_name}
                            </div>
                            {repo.description && <p className="text-sm text-slate-500 mt-1 ml-6">{repo.description}</p>}
                        </button>
                        {selectedRepo?.id === repo.id && (
                            <div className="bg-slate-50 p-3 border-t border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                     <p className="text-sm font-semibold text-slate-600 truncate" title={STRINGS.GITHUB_PATH_LABEL(currentPath)}>
                                        <span className="font-normal text-slate-400">/</span>{currentPath || STRINGS.GITHUB_PATH_ROOT}
                                    </p>
                                    {currentPath && (
                                        <button onClick={handleGoBack} className="flex items-center gap-1 p-1 rounded-md hover:bg-slate-200 text-slate-600 text-xs font-medium">
                                            <BackIcon /> {STRINGS.GITHUB_BACK_BUTTON}
                                        </button>
                                    )}
                                </div>
                                {isLoading === 'files' ? <p className="text-sm text-center p-2">{STRINGS.GITHUB_LOADING_FILES}</p> : (
                                    files.length > 0 ? (
                                        <ul className="space-y-1">
                                            {files.map(file => {
                                                const isLingua = file.name.endsWith('.lingua');
                                                const isClickable = file.type === 'dir' || isLingua;
                                                return (
                                                    <li key={file.path}>
                                                        <button 
                                                            onClick={() => handleFileOrDirClick(file)} 
                                                            disabled={!isClickable}
                                                            title={isClickable ? (file.type === 'dir' ? STRINGS.GITHUB_OPEN_DIR_TITLE(file.name) : STRINGS.GITHUB_OPEN_PROJECT_TITLE(file.name)) : STRINGS.GITHUB_UNSUPPORTED_FILE_TITLE(file.name)}
                                                            className={`flex items-center gap-2 p-2 rounded-md w-full text-left font-medium text-sm ${
                                                                isClickable 
                                                                    ? 'hover:bg-indigo-100 text-indigo-700' 
                                                                    : 'text-slate-400 cursor-not-allowed'
                                                            }`}
                                                        >
                                                            {file.type === 'dir' ? <RepoIcon /> : <FileIcon />}
                                                            {file.name}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : <p className="text-sm text-center p-2 text-slate-500">{STRINGS.GITHUB_DIR_EMPTY}</p>
                                )}
                                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};