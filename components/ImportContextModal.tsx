import React, { useState, useEffect } from 'react';
import { BoundingBox } from './BoundingBox';
import * as gh from '../utils/githubApi';
import { getGitHubAuth } from '../utils/projectManager';
import { STRINGS } from '../strings';

interface ImportContextModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProceed: (context: string, sourceLang: string, targetLang: string) => void;
    fileName: string;
}

export const ImportContextModal: React.FC<ImportContextModalProps> = ({ isOpen, onClose, onProceed, fileName }) => {
    const [context, setContext] = useState('');
    const [sourceLang, setSourceLang] = useState('');
    const [targetLang, setTargetLang] = useState('');

    const handleProceed = () => {
        onProceed(context, sourceLang, targetLang);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 animate-fade-in-fast" onMouseDown={onClose}>
            <BoundingBox name="import context modal" className="!m-0">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl" onMouseDown={e => e.stopPropagation()}>
                    <BoundingBox name="modal header">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-2xl font-bold text-slate-800">{STRINGS.IMPORT_MODAL_TITLE}</h2>
                            <p className="text-sm text-slate-500 mt-1">{STRINGS.IMPORT_MODAL_DESC}</p>
                        </div>
                    </BoundingBox>
                    
                    <BoundingBox name="modal content">
                        <div className="p-6">
                            <p className="mb-4 text-sm text-slate-600">{STRINGS.IMPORT_MODAL_FILENAME_LABEL('')}<span className="font-semibold text-slate-800">{fileName}</span></p>
                            
                            <div className="flex gap-4 mb-4">
                                <div className="w-1/2">
                                    <label htmlFor="source-lang-input" className="block text-sm font-medium text-slate-700 mb-2">
                                        {STRINGS.LABEL_SOURCE_LANG}
                                    </label>
                                    <input
                                        id="source-lang-input"
                                        type="text"
                                        value={sourceLang}
                                        onChange={e => setSourceLang(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 text-slate-900"
                                        placeholder={STRINGS.PLACEHOLDER_SOURCE_LANG}
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label htmlFor="target-lang-input" className="block text-sm font-medium text-slate-700 mb-2">
                                        {STRINGS.LABEL_TARGET_LANG}
                                    </label>
                                    <input
                                        id="target-lang-input"
                                        type="text"
                                        value={targetLang}
                                        onChange={e => setTargetLang(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 text-slate-900"
                                        placeholder={STRINGS.PLACEHOLDER_TARGET_LANG}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label htmlFor="context-textarea" className="block text-sm font-medium text-slate-700 mb-2">
                                    {STRINGS.LABEL_DOC_CONTEXT}
                                </label>
                                <textarea
                                    id="context-textarea"
                                    value={context}
                                    onChange={(e) => setContext(e.target.value)}
                                    className="w-full h-24 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 text-slate-900"
                                    aria-label="Document context input"
                                    placeholder={STRINGS.PLACEHOLDER_DOC_CONTEXT}
                                />
                            </div>
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
                                onClick={handleProceed}
                                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {STRINGS.BUTTON_CREATE_PROJECT}
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