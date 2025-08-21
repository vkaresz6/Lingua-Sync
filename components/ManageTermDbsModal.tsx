import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BoundingBox } from './BoundingBox';
import * as gh from '../utils/githubApi';
import { getGitHubAuth } from '../utils/projectManager';
import { STRINGS } from '../strings';
import { ProjectState } from '../types';

interface ManageTermDbsModalProps {
    isOpen: boolean;
    onClose: () => void;
    owner: string;
    repo: string;
    projectState: ProjectState;
    linkedTermDbs: string[];
    onSave: (newlyLinkedDbs: string[]) => void;
    onUploadAndLink: (file: File, projectState: ProjectState) => Promise<string>;
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


export const ManageTermDbsModal: React.FC<ManageTermDbsModalProps> = ({ isOpen, onClose, owner, repo, projectState, linkedTermDbs, onSave, onUploadAndLink }) => {
    const [availableDbs, setAvailableDbs] = useState<gh.GitHubFile[]>([]);
    const [selectedDbs, setSelectedDbs] = useState<string[]>(linkedTermDbs);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchTermDbs = useCallback(async () => {
        const auth = getGitHubAuth();
        if (!auth) {
            setError("Not connected to GitHub.");
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const dbs = await gh.listTermDbs(auth.token, owner, repo);
            setAvailableDbs(dbs);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch Terminology Databases.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [owner, repo]);

    useEffect(() => {
        if (isOpen) {
            setSelectedDbs(linkedTermDbs);
            fetchTermDbs();
        }
    }, [isOpen, linkedTermDbs, fetchTermDbs]);

    const handleDbToggle = (dbName: string) => {
        setSelectedDbs(prev =>
            prev.includes(dbName) ? prev.filter(t => t !== dbName) : [...prev, dbName]
        );
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError('');
        try {
            const newDbName = await onUploadAndLink(file, projectState);
            // Automatically link the newly uploaded DB
            if (!selectedDbs.includes(newDbName)) {
                setSelectedDbs(prev => [...prev, newDbName]);
            }
            await fetchTermDbs(); // Refresh the list to show the new TM
        } catch (err) {
            setError(err instanceof Error ? err.message : STRINGS.UPLOAD_FAILED);
        } finally {
            setIsUploading(false);
        }
        // Reset file input
        if(event.target) event.target.value = '';
    };

    const handleSave = () => {
        onSave(selectedDbs);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 animate-fade-in-fast" onMouseDown={onClose}>
            <BoundingBox name="manage termdbs modal" className="!m-0 max-w-2xl w-full">
                <div className="bg-white rounded-lg shadow-2xl w-full flex flex-col max-h-[80vh]" onMouseDown={e => e.stopPropagation()}>
                    <BoundingBox name="modal header">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-2xl font-bold text-slate-800">{STRINGS.MANAGE_TERMDBS_TITLE}</h2>
                            <p className="text-sm text-slate-500 mt-1">{STRINGS.MANAGE_TERMDBS_DESC_PROJECT}</p>
                        </div>
                    </BoundingBox>
                    
                    <BoundingBox name="modal content" className="flex-grow overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-semibold text-slate-700">{STRINGS.MANAGE_TERMDBS_AVAILABLE_TERMDBS_PROJECT(repo)}</h3>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".termdb,.csv"
                                />
                                <button
                                    onClick={handleUploadClick}
                                    disabled={isUploading}
                                    className="px-4 py-2 border border-purple-600 text-sm font-semibold rounded-md text-purple-600 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-60"
                                >
                                    {isUploading ? STRINGS.MANAGE_TERMDBS_UPLOADING_BUTTON : STRINGS.MANAGE_TERMDBS_UPLOAD_BUTTON}
                                </button>
                            </div>

                            <div className="min-h-[200px] border border-slate-300 rounded-md bg-slate-50">
                                {isLoading ? <LoadingSpinner message={STRINGS.MANAGE_TERMDBS_FETCHING} /> : (
                                    <div className="p-2 space-y-1">
                                        {availableDbs.length > 0 ? availableDbs.map(db => (
                                            <label key={db.sha} className="flex items-center gap-3 text-sm p-2 cursor-pointer hover:bg-slate-200 rounded-md transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedDbs.includes(db.name)} 
                                                    onChange={() => handleDbToggle(db.name)} 
                                                    className="form-checkbox h-4 w-4 text-indigo-600 border-slate-400 rounded focus:ring-indigo-500"
                                                />
                                                <span className="text-slate-800 font-medium">{db.name}</span>
                                            </label>
                                        )) : (
                                            <div className="flex items-center justify-center h-full p-8 text-center text-sm text-slate-500">
                                                {STRINGS.MANAGE_TERMDBS_EMPTY_PROJECT}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        </div>
                    </BoundingBox>
                    
                    <BoundingBox name="modal footer">
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {STRINGS.BUTTON_CANCEL}
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {STRINGS.MANAGE_TERMDBS_SAVE_BUTTON}
                            </button>
                        </div>
                    </BoundingBox>
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