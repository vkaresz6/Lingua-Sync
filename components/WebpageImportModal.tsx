import React, { useState } from 'react';
import { BoundingBox } from './BoundingBox';
import { STRINGS } from '../strings';

interface WebpageImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProceed: (url: string, context: string, sourceLang: string, targetLang: string) => void;
}

export const WebpageImportModal: React.FC<WebpageImportModalProps> = ({ isOpen, onClose, onProceed }) => {
    const [url, setUrl] = useState('');
    const [context, setContext] = useState('');
    const [sourceLang, setSourceLang] = useState('');
    const [targetLang, setTargetLang] = useState('');

    const handleProceed = () => {
        if (url.trim()) {
            onProceed(url, context, sourceLang, targetLang);
        } else {
            alert("Please enter a valid URL.");
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 animate-fade-in-fast" onMouseDown={onClose}>
            <BoundingBox name="webpage import modal" className="!m-0">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl" onMouseDown={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-800">{STRINGS.WEBPAGE_IMPORT_MODAL_TITLE}</h2>
                        <p className="text-sm text-slate-500 mt-1">{STRINGS.WEBPAGE_IMPORT_MODAL_DESC}</p>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="url-input" className="block text-sm font-medium text-slate-700 mb-2">
                                {STRINGS.LABEL_WEBPAGE_URL}
                            </label>
                            <input
                                id="url-input"
                                type="url"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 text-slate-900"
                                placeholder={STRINGS.PLACEHOLDER_WEBPAGE_URL}
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label htmlFor="source-lang-input-wp" className="block text-sm font-medium text-slate-700 mb-2">
                                    {STRINGS.LABEL_SOURCE_LANG}
                                </label>
                                <input
                                    id="source-lang-input-wp"
                                    type="text"
                                    value={sourceLang}
                                    onChange={e => setSourceLang(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 text-slate-900"
                                    placeholder={STRINGS.PLACEHOLDER_SOURCE_LANG}
                                />
                            </div>
                            <div className="w-1/2">
                                <label htmlFor="target-lang-input-wp" className="block text-sm font-medium text-slate-700 mb-2">
                                    {STRINGS.LABEL_TARGET_LANG}
                                </label>
                                <input
                                    id="target-lang-input-wp"
                                    type="text"
                                    value={targetLang}
                                    onChange={e => setTargetLang(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 text-slate-900"
                                    placeholder={STRINGS.PLACEHOLDER_TARGET_LANG}
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="context-textarea-wp" className="block text-sm font-medium text-slate-700 mb-2">
                                {STRINGS.LABEL_DOC_CONTEXT}
                            </label>
                            <textarea
                                id="context-textarea-wp"
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                className="w-full h-24 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 text-slate-900"
                                aria-label="Document context input"
                                placeholder={STRINGS.PLACEHOLDER_DOC_CONTEXT}
                            />
                        </div>
                    </div>
                    
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