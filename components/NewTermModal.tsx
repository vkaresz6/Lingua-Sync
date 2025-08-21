
import React, { useState, useEffect, useCallback } from 'react';
import { BoundingBox } from './BoundingBox';
import { STRINGS } from '../strings';
import { TermUnit } from '../types';

interface NewTermModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (term: TermUnit) => void;
    sourceTerm: string;
    onFetchSuggestions: (sourceTerm: string) => Promise<{ target: string; definition: string }>;
}

const Spinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export const NewTermModal: React.FC<NewTermModalProps> = ({ isOpen, onClose, onSave, sourceTerm, onFetchSuggestions }) => {
    const [target, setTarget] = useState('');
    const [definition, setDefinition] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const getSuggestions = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const { target: suggTarget, definition: suggDef } = await onFetchSuggestions(sourceTerm);
            setTarget(suggTarget);
            setDefinition(suggDef);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get suggestions.');
        } finally {
            setIsLoading(false);
        }
    }, [sourceTerm, onFetchSuggestions]);
    
    useEffect(() => {
        if (isOpen) {
            setTarget('');
            setDefinition('');
            getSuggestions();
        }
    }, [isOpen, getSuggestions]);


    if (!isOpen) return null;

    const handleSave = () => {
        if (sourceTerm.trim() && target.trim()) {
            onSave({
                source: sourceTerm.trim(),
                target: target.trim(),
                definition: definition.trim() || undefined
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 animate-fade-in-fast" onMouseDown={onClose}>
            <BoundingBox name="new term modal" className="!m-0 max-w-lg w-full">
                <div className="bg-white rounded-lg shadow-2xl w-full" onMouseDown={e => e.stopPropagation()}>
                    <div className="p-5 border-b border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800">{STRINGS.NEW_TERM_MODAL_TITLE}</h2>
                        <p className="text-sm text-slate-500 mt-1">{STRINGS.NEW_TERM_MODAL_DESC}</p>
                    </div>
                    
                    <div className="p-5 space-y-4">
                        <div>
                            <label htmlFor="source-term-input" className="block text-sm font-medium text-slate-700 mb-1">{STRINGS.LABEL_SOURCE_TERM}</label>
                            <input id="source-term-input" type="text" value={sourceTerm} readOnly className="w-full p-2 border border-slate-300 rounded-md bg-slate-100 text-slate-600 cursor-not-allowed"/>
                        </div>
                        <div>
                            <label htmlFor="target-term-input" className="block text-sm font-medium text-slate-700 mb-1">{STRINGS.LABEL_TARGET_TERM}</label>
                            <input id="target-term-input" type="text" value={target} onChange={e => setTarget(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                        <div>
                            <label htmlFor="definition-input" className="block text-sm font-medium text-slate-700 mb-1">{STRINGS.LABEL_DEFINITION_OPTIONAL}</label>
                            <textarea id="definition-input" value={definition} onChange={e => setDefinition(e.target.value)} rows={3} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                        {isLoading && (
                            <div className="flex items-center justify-center gap-2 text-slate-500">
                                <Spinner />
                                <span>Getting AI suggestions...</span>
                            </div>
                        )}
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                    
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {STRINGS.BUTTON_CANCEL}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!target.trim()}
                            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                        >
                           {STRINGS.BUTTON_ADD_TERM}
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