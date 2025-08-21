

import React, { useState } from 'react';
import { BoundingBox } from './BoundingBox';
import { STRINGS } from '../strings';

interface CommitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCommit: (message: string) => void;
    isCommitting: boolean;
}

export const CommitModal: React.FC<CommitModalProps> = ({ isOpen, onClose, onCommit, isCommitting }) => {
    const [message, setMessage] = useState('Update translations');

    if (!isOpen) return null;

    const handleCommit = () => {
        if (message.trim()) {
            onCommit(message.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 animate-fade-in-fast" onMouseDown={onClose}>
            <BoundingBox name="commit modal" className="!m-0 max-w-lg w-full">
                <div className="bg-white rounded-lg shadow-2xl w-full" onMouseDown={e => e.stopPropagation()}>
                    <BoundingBox name="modal header">
                        <div className="p-5 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-800">{STRINGS.COMMIT_MODAL_TITLE}</h2>
                            <p className="text-sm text-slate-500 mt-1">{STRINGS.COMMIT_MODAL_DESC}</p>
                        </div>
                    </BoundingBox>
                    
                    <BoundingBox name="modal content">
                        <div className="p-5">
                            <label htmlFor="commit-message-textarea" className="block text-sm font-medium text-slate-700 mb-2">
                                {STRINGS.LABEL_COMMIT_MESSAGE}
                            </label>
                            <textarea
                                id="commit-message-textarea"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full h-24 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 text-slate-900"
                                placeholder={STRINGS.PLACEHOLDER_COMMIT_MESSAGE}
                            />
                        </div>
                    </BoundingBox>
                    
                    <BoundingBox name="modal footer">
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                disabled={isCommitting}
                                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {STRINGS.BUTTON_CANCEL}
                            </button>
                            <button
                                onClick={handleCommit}
                                disabled={!message.trim() || isCommitting}
                                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                            >
                                {isCommitting ? STRINGS.BUTTON_PUSHING_COMMIT : STRINGS.BUTTON_PUSH_COMMIT}
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
