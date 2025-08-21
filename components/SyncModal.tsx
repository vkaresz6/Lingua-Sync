
import React, { useState } from 'react';
import { BoundingBox } from './BoundingBox';
import { STRINGS } from '../strings';

export interface SyncConflict {
    segmentId: number;
    source: string;
    localTarget: string;
    remoteTarget: string;
}

export type Resolutions = Record<number, 'local' | 'remote'>;

interface SyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    conflicts: SyncConflict[];
    onResolve: (resolutions: Resolutions) => void;
    isResolving: boolean;
}

// This component is now simpler, it doesn't need to know its resolved state.
const ConflictItem: React.FC<{
    conflict: SyncConflict;
    onSelect: (resolution: 'local' | 'remote') => void;
}> = ({ conflict, onSelect }) => {
    return (
        <div className="border border-slate-200 rounded-lg p-4 bg-white animate-fade-in-fast">
            <div className="mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase">Source</p>
                <p className="text-sm text-slate-700 mt-1" dangerouslySetInnerHTML={{ __html: conflict.source }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Local Version */}
                <div>
                    <h4 className="font-semibold text-slate-800 mb-2">{STRINGS.SYNC_CONFLICT_LOCAL}</h4>
                    <div className="p-2 rounded-md border-2 min-h-[60px] border-slate-300 bg-white">
                        <div className="text-sm text-slate-700 break-words" dangerouslySetInnerHTML={{ __html: conflict.localTarget || '<i class="text-slate-400">[Empty]</i>' }} />
                    </div>
                    <button
                        onClick={() => onSelect('local')}
                        className="mt-2 w-full text-sm font-semibold py-1.5 px-3 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
                    >
                        {STRINGS.SYNC_BUTTON_KEEP_LOCAL}
                    </button>
                </div>
                {/* Remote Version */}
                <div>
                    <h4 className="font-semibold text-slate-800 mb-2">{STRINGS.SYNC_CONFLICT_REMOTE}</h4>
                    <div className="p-2 rounded-md border-2 min-h-[60px] border-slate-300 bg-white">
                        <div className="text-sm text-slate-700 break-words" dangerouslySetInnerHTML={{ __html: conflict.remoteTarget || '<i class="text-slate-400">[Empty]</i>' }} />
                    </div>
                    <button
                        onClick={() => onSelect('remote')}
                        className="mt-2 w-full text-sm font-semibold py-1.5 px-3 rounded-md bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors"
                    >
                        {STRINGS.SYNC_BUTTON_USE_REMOTE}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, conflicts, onResolve, isResolving }) => {
    const [currentConflictIndex, setCurrentConflictIndex] = useState(0);
    const [resolutions, setResolutions] = useState<Resolutions>({});

    const allResolved = currentConflictIndex >= conflicts.length;
    const currentConflict = !allResolved ? conflicts[currentConflictIndex] : null;

    const handleSelect = (resolution: 'local' | 'remote') => {
        if (!currentConflict) return;
        const segmentId = currentConflict.segmentId;
        
        setResolutions(prev => ({ ...prev, [segmentId]: resolution }));
        
        // Move to the next conflict or to the final "all resolved" view.
        setCurrentConflictIndex(prev => prev + 1);
    };

    const handleResolve = () => {
        if (allResolved) {
            onResolve(resolutions);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 animate-fade-in-fast" onMouseDown={onClose}>
            <BoundingBox name="sync conflict modal" className="!m-0 max-w-4xl w-full">
                <div className="bg-white rounded-lg shadow-2xl w-full flex flex-col max-h-[90vh]" onMouseDown={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-800">{STRINGS.SYNC_MODAL_TITLE}</h2>
                        <p className="text-sm text-slate-500 mt-1">{STRINGS.SYNC_MODAL_DESC}</p>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-slate-50">
                       {currentConflict ? (
                            <ConflictItem
                                key={currentConflict.segmentId}
                                conflict={currentConflict}
                                onSelect={handleSelect}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-center p-8">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">{STRINGS.SYNC_ALL_RESOLVED}</h3>
                                    <p className="text-sm text-slate-500 mt-2">Click the button below to save your changes and push to GitHub.</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
                        <p className="text-sm font-medium text-slate-600">
                           {allResolved ? `All ${conflicts.length} conflicts resolved.` : `Resolving conflict ${currentConflictIndex + 1} of ${conflicts.length}`}
                        </p>
                        <div className="flex gap-3">
                             <button
                                onClick={onClose}
                                disabled={isResolving}
                                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
                            >
                                {STRINGS.SYNC_CANCEL}
                            </button>
                            <button
                                onClick={handleResolve}
                                disabled={!allResolved || isResolving}
                                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300"
                            >
                                {isResolving ? STRINGS.SYNC_BUTTON_RESOLVING : STRINGS.SYNC_BUTTON_RESOLVE_AND_PUSH}
                            </button>
                        </div>
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
