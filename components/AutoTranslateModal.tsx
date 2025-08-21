import React, { useState, useEffect } from 'react';
import { BoundingBox } from './BoundingBox';
import { STRINGS } from '../strings';

interface AutoTranslateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (endSegmentNumber: number) => void;
    isTranslating: boolean;
    totalSegments: number;
    activeSegmentNumber: number;
}

export const AutoTranslateModal: React.FC<AutoTranslateModalProps> = ({ isOpen, onClose, onConfirm, isTranslating, totalSegments, activeSegmentNumber }) => {
    const [endSegment, setEndSegment] = useState(totalSegments);

    useEffect(() => {
        if (isOpen) {
            setEndSegment(totalSegments);
        }
    }, [isOpen, totalSegments]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (endSegment >= activeSegmentNumber && endSegment <= totalSegments) {
            onConfirm(endSegment);
        } else {
            alert(STRINGS.AUTOTRANSLATE_INVALID_NUMBER(totalSegments));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 animate-fade-in-fast" onMouseDown={onClose}>
            <BoundingBox name="auto-translate modal" className="!m-0 max-w-md w-full">
                <div className="bg-white rounded-lg shadow-2xl w-full" onMouseDown={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800">{STRINGS.AUTOTRANSLATE_MODAL_TITLE}</h2>
                        <p className="text-sm text-slate-500 mt-1">{STRINGS.AUTOTRANSLATE_MODAL_DESC}</p>
                    </div>
                    
                    <div className="p-6">
                        <label htmlFor="segment-number-input" className="block text-sm font-medium text-slate-700 mb-2">
                            {STRINGS.AUTOTRANSLATE_MODAL_PROMPT}
                        </label>
                        <input
                            id="segment-number-input"
                            type="number"
                            value={endSegment}
                            onChange={(e) => setEndSegment(parseInt(e.target.value, 10))}
                            min={activeSegmentNumber}
                            max={totalSegments}
                            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-slate-50 text-center text-slate-900"
                        />
                         <p className="text-xs text-slate-500 mt-2">
                            Current segment is #{activeSegmentNumber}. Total segments: {totalSegments}.
                         </p>
                    </div>
                    
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={isTranslating}
                            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {STRINGS.BUTTON_CANCEL}
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isTranslating}
                            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                        >
                            {isTranslating ? STRINGS.AUTOTRANSLATING_BUTTON : STRINGS.AUTOTRANSLATE_MODAL_BUTTON}
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