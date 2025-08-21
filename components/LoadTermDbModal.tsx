
import React, { useState, useEffect, useCallback } from 'react';
import { BoundingBox } from './BoundingBox';
import * as gh from '../utils/githubApi';
import { getGitHubAuth } from '../utils/projectManager';
import { STRINGS } from '../strings';

interface LoadTermDbModalProps {
    isOpen: boolean;
    onClose: () => void;
    owner: string;
    repo: string;
    onLoad: (fileName: string) => Promise<void>;
}

const LoadingSpinner: React.FC<{ message: string }> = ({ message }) => (
     <div className="flex flex-col items-center justify-center p-8 text-slate-500">
        <svg className="animate-spin h-8 w-8 text-indigo-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm font-medium">{message}</p>
    </div>
);

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);


export const LoadTermDbModal: React.FC<LoadTermDbModalProps> = ({ isOpen, onClose, owner, repo, onLoad }) => {
    const [availableDbs, setAvailableDbs] = useState<gh.GitHubFile[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isProcessing, setIsProcessing] = useState<string | null>(null); // Store name of file being processed
    const [error, setError] = useState('');

    const fetchTermDbs = useCallback(async () => {
        const auth = getGitHubAuth();
        if (!auth) {
            setError("Not connected to GitHub.");
            return;
        }
        setIsLoadingList(true);
        setError('');
        try {
            const dbs = await gh.listTermDbs(auth.token, owner, repo);
            setAvailableDbs(dbs);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch Terminology Databases.");
        } finally {
            setIsLoadingList(false);
        }
    }, [owner, repo]);

    useEffect(() => {
        if (isOpen) {
            fetchTermDbs();
        }
    }, [isOpen, fetchTermDbs]);

    const handleLoad = async (fileName: string) => {
        setIsProcessing(fileName);
        setError('');
        try {
            await onLoad(fileName);
            // On success, parent component will close the modal.
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load TermDB.');
            setIsProcessing(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 animate-fade-in-fast" onMouseDown={onClose}>
            <BoundingBox name="load termdb modal" className="!m-0 max-w-lg w-full">
                <div className="bg-white rounded-lg shadow-2xl w-full flex flex-col max-h-[80vh]" onMouseDown={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-800">{STRINGS.LOAD_TERMDBS_MODAL_TITLE}</h2>
                        <p className="text-sm text-slate-500 mt-1">{STRINGS.LOAD_TERMDBS_MODAL_DESC}</p>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-6">
                        <h3 className="text-md font-semibold text-slate-700 mb-3">{STRINGS.LOAD_TERMDBS_AVAILABLE_TERMDBS(repo)}</h3>

                        <div className="min-h-[200px] border border-slate-300 rounded-md bg-slate-50">
                            {isLoadingList ? <LoadingSpinner message={STRINGS.LOAD_TERMDBS_FETCHING} /> : (
                                <div className="p-2 space-y-1">
                                    {availableDbs.length > 0 ? availableDbs.map(db => (
                                        <button 
                                            key={db.sha} 
                                            onClick={() => handleLoad(db.name)}
                                            disabled={!!isProcessing}
                                            className="w-full flex items-center gap-3 text-sm p-2 cursor-pointer hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait"
                                        >
                                            <FileIcon />
                                            <span className="text-slate-800 font-medium">{db.name}</span>
                                            {isProcessing === db.name && <span className="ml-auto text-xs text-slate-500">{STRINGS.LOAD_TERMDBS_LOADING_FILE}</span>}
                                        </button>
                                    )) : (
                                        <div className="flex items-center justify-center h-full p-8 text-center text-sm text-slate-500">
                                            {STRINGS.LOAD_TERMDBS_EMPTY_PROJECT}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>
                    
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {STRINGS.BUTTON_CANCEL}
                        </button>
                    </div>
                </div>
            </BoundingBox>
             <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in-fast {
                    animation: fade-in-fast 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
