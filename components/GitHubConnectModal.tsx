import React, { useState } from 'react';
import { BoundingBox } from './BoundingBox';
import * as gh from '../utils/githubApi';
import { saveGitHubAuth, clearGitHubAuth } from '../utils/projectManager';
import { STRINGS } from '../strings';

const GitHubLogo = () => (
    <svg height="24" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="24" fill="currentColor">
        <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
    </svg>
);

const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface GitHubConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnectSuccess: () => void;
}

export const GitHubConnectModal: React.FC<GitHubConnectModalProps> = ({ isOpen, onClose, onConnectSuccess }) => {
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    if (!isOpen) return null;

    const handleConnect = async () => {
        if (!token.trim()) return;
        setIsLoading(true);
        setError('');
        try {
            const userData = await gh.verifyTokenAndGetUser(token);
            saveGitHubAuth(token, userData.login);
            onConnectSuccess();
        } catch (e) {
            setError('Connection failed. Please check your token and permissions.');
            clearGitHubAuth();
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConnect();
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 animate-fade-in-fast" onMouseDown={onClose}>
            <BoundingBox name="github connect modal" className="!m-0 max-w-lg w-full">
                <div className="bg-white rounded-lg shadow-2xl w-full" onMouseDown={e => e.stopPropagation()}>
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <GitHubLogo />
                            <h2 className="text-xl font-bold text-slate-800">{STRINGS.GITHUB_CONNECT_TITLE}</h2>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
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
                                onKeyDown={handleKeyDown}
                                placeholder="ghp_..."
                                className="flex-grow p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                            />
                        </div>
                         {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {STRINGS.BUTTON_CANCEL}
                        </button>
                        <button 
                            onClick={handleConnect} 
                            disabled={isLoading || !token.trim()}
                            className="w-32 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 flex justify-center items-center"
                        >
                            {isLoading ? <Spinner/> : STRINGS.GITHUB_CONNECT_BUTTON}
                        </button>
                    </div>
                </div>
            </BoundingBox>
            <style>{`
                @keyframes fade-in-fast { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};