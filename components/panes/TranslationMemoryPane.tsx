import React from 'react';
import { BoundingBox } from '../BoundingBox';
import { STRINGS } from '../../strings';

interface TmMatch {
    source: string;
    target: string;
    score: number;
}

interface TranslationMemoryPaneProps {
    matches: TmMatch[];
    isMatching: boolean;
    onMatchClick: (target: string) => void;
}

const LoadingSpinner = () => (
    <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-md backdrop-blur-sm z-10">
        <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

const getScoreColor = (score: number) => {
    if (score >= 1.0) return 'text-green-600 bg-green-100';
    if (score >= 0.9) return 'text-sky-600 bg-sky-100';
    if (score >= 0.8) return 'text-amber-600 bg-amber-100';
    return 'text-orange-600 bg-orange-100';
}

export const TranslationMemoryPane: React.FC<TranslationMemoryPaneProps> = ({ matches, isMatching, onMatchClick }) => {
    return (
        <BoundingBox name="tm matches display" className="w-full h-full flex flex-col relative bg-slate-50 border border-slate-300 rounded-md">
            <div className="w-full flex-grow p-2 overflow-y-auto space-y-2">
                {isMatching && matches.length === 0 && (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                        {STRINGS.TM_SEARCHING}
                    </div>
                )}
                {!isMatching && matches.length === 0 && (
                     <div className="flex items-center justify-center h-full text-slate-400 text-sm text-center px-4">
                        {STRINGS.TM_EMPTY}
                    </div>
                )}
                {matches.map((match, index) => (
                    <button
                        key={index}
                        onClick={() => onMatchClick(match.target)}
                        className="w-full p-2.5 rounded-md bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition-all text-left flex flex-col gap-1.5 group"
                        title={STRINGS.TM_USE_MATCH_TITLE}
                    >
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-slate-500 truncate" title={match.source}>{match.source}</p>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${getScoreColor(match.score)}`}>
                                {(match.score * 100).toFixed(0)}%
                            </span>
                        </div>
                        <p className="font-semibold text-slate-800 group-hover:text-indigo-800">{match.target}</p>
                    </button>
                ))}
            </div>
            {isMatching && <LoadingSpinner />}
        </BoundingBox>
    );
};