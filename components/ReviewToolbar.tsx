
import React from 'react';
import { Contributor } from '../types';
import { STRINGS } from '../strings';

interface ReviewToolbarProps {
    isProofreaderMode: boolean;
    onToggleProofreaderMode: () => void;
    proofreader1?: string;
    proofreader2?: string;
    isLeader: boolean;
    onFinalizeProject: () => void;
    isFinalizeDisabled: boolean;
    onBatchReevaluate: () => void;
    isBatchEvaluating: boolean;
}

const FinalizeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
);

const ReevaluateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
    </svg>
);

const TinySpinner = () => (
    <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export const ReviewToolbar: React.FC<ReviewToolbarProps> = ({
    isProofreaderMode, onToggleProofreaderMode,
    proofreader1, proofreader2, isLeader,
    onFinalizeProject, isFinalizeDisabled,
    onBatchReevaluate, isBatchEvaluating
}) => {

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Proofreader Mode</span>
                <button
                    onClick={onToggleProofreaderMode}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        isProofreaderMode ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                >
                    <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isProofreaderMode ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                </button>
            </div>
            <div className="h-6 w-px bg-slate-300 mx-1"></div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-slate-700">Proofreader 1:</span>
                    <span className="font-semibold text-indigo-700 px-2 py-1 bg-indigo-50 rounded-md">{proofreader1 || 'Unassigned'}</span>
                </div>
                 <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-slate-700">Proofreader 2:</span>
                    <span className="font-semibold text-indigo-700 px-2 py-1 bg-indigo-50 rounded-md">{proofreader2 || 'Unassigned'}</span>
                </div>
            </div>
            <div className="h-6 w-px bg-slate-300 mx-1"></div>
            <button
                onClick={onFinalizeProject}
                disabled={isFinalizeDisabled}
                title="Finalize all proofread segments"
                className="p-2 rounded-md text-slate-600 hover:bg-slate-300 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:text-slate-400 disabled:hover:bg-transparent transition-colors"
            >
                <FinalizeIcon />
            </button>
             <button
                onClick={onBatchReevaluate}
                disabled={isBatchEvaluating}
                title={STRINGS.RE_EVALUATE_ALL_BUTTON}
                className="p-2 rounded-md text-slate-600 hover:bg-slate-300 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:text-slate-400 disabled:hover:bg-transparent transition-colors"
            >
                {isBatchEvaluating ? <TinySpinner/> : <ReevaluateIcon />}
            </button>
        </div>
    );
};
