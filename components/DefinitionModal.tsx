


import React, { useState, useEffect, useRef } from 'react';
import { BoundingBox } from './BoundingBox';
import { STRINGS } from '../strings';

interface DefinitionModalProps {
    isOpen: boolean;
    word: string;
    position: { x: number; y: number };
    onClose: () => void;
    onFetchDefinition: (word: string) => Promise<string>;
}

const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-4">
        <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

export const DefinitionModal: React.FC<DefinitionModalProps> = ({ isOpen, word, position, onClose, onFetchDefinition }) => {
    const [definition, setDefinition] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        
        let isCancelled = false;
        const fetchDefinition = async () => {
            setIsLoading(true);
            setError('');
            try {
                const data = await onFetchDefinition(word);
                if (!isCancelled) {
                    setDefinition(data);
                }
            } catch (e) {
                if (!isCancelled) {
                    setError(STRINGS.DEFINITION_MODAL_ERROR);
                    console.error(e);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };
        fetchDefinition();
        return () => { isCancelled = true; };
    }, [word, onFetchDefinition, isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, isOpen]);
    
    if (!isOpen) return null;

    const style = {
        top: position.y + 10,
        left: position.x + 10,
    };

    return (
        <div ref={modalRef} style={style} className="fixed z-50 max-w-sm">
            <BoundingBox name="definition modal">
                <div className="bg-white rounded-lg shadow-xl p-4 w-full border border-slate-200 animate-fade-in-fast flex flex-col">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                        <h3 className="text-lg font-bold text-slate-800 break-all">{word}</h3>
                        <button 
                            onClick={onClose} 
                            className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            aria-label={STRINGS.ARIA_LABEL_CLOSE_DEFINITION}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="text-sm text-slate-700 flex-grow min-h-[50px]">
                        {isLoading && <LoadingSpinner />}
                        {error && <p className="text-red-500">{error}</p>}
                        {!isLoading && !error && <p>{definition}</p>}
                    </div>
                </div>
            </BoundingBox>
            <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-fast {
                    animation: fade-in-fast 0.1s ease-out forwards;
                }
            `}</style>
        </div>
    );
};