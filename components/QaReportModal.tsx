import React from 'react';
import { QaIssue, AllQaIssueType } from '../types';
import { BoundingBox } from './BoundingBox';
import { STRINGS } from '../strings';
import { stripHtml } from '../utils/fileHandlers';

interface QaReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    issues: QaIssue[];
    onGoToSegment: (segmentId: number) => void;
    onRunAgain: () => void;
    isLoading: boolean;
    onApplySuggestion: (segmentId: number, newTarget: string) => void;
}

const getIssueTypeLabel = (type: AllQaIssueType) => {
    const labels: Record<AllQaIssueType, string> = {
        EMPTY_TRANSLATION: 'Empty Translation',
        INCONSISTENT_TRANSLATION: 'Inconsistent Translation',
        TERM_MISMATCH: 'Terminology Mismatch',
        TAG_MISMATCH: 'Tag Mismatch',
        NUMBER_MISMATCH: 'Number Mismatch',
        SPACING_ERROR: 'Spacing Error',
        TONAL_INCONSISTENCY: 'Tonal Inconsistency',
        FORMALITY_MISMATCH: 'Formality Mismatch',
        CULTURAL_RED_FLAG: 'Cultural Red Flag',
        READABILITY_ISSUE: 'Readability Issue',
        TRANSLATION_INCONSISTENCY: 'Translation Inconsistency',
    };
    return labels[type];
};

const getIssueTypeColor = (type: AllQaIssueType) => {
    const colors: Record<AllQaIssueType, string> = {
        EMPTY_TRANSLATION: 'bg-yellow-100 text-yellow-800',
        INCONSISTENT_TRANSLATION: 'bg-orange-100 text-orange-800',
        TERM_MISMATCH: 'bg-red-100 text-red-800',
        TAG_MISMATCH: 'bg-purple-100 text-purple-800',
        NUMBER_MISMATCH: 'bg-sky-100 text-sky-800',
        SPACING_ERROR: 'bg-slate-200 text-slate-800',
        TONAL_INCONSISTENCY: 'bg-teal-100 text-teal-800',
        FORMALITY_MISMATCH: 'bg-cyan-100 text-cyan-800',
        CULTURAL_RED_FLAG: 'bg-rose-100 text-rose-800',
        READABILITY_ISSUE: 'bg-lime-100 text-lime-800',
        TRANSLATION_INCONSISTENCY: 'bg-indigo-100 text-indigo-800',
    };
    return colors[type];
}

export const QaReportModal: React.FC<QaReportModalProps> = ({ isOpen, onClose, issues, onGoToSegment, onRunAgain, isLoading, onApplySuggestion }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 animate-fade-in-fast" onMouseDown={onClose}>
            <BoundingBox name="qa report modal" className="!m-0 max-w-4xl w-full">
                <div className="bg-white rounded-lg shadow-2xl w-full flex flex-col max-h-[90vh]" onMouseDown={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-800">{STRINGS.QA_REPORT_TITLE}</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {issues.length > 0 ? `Found ${issues.length} potential issue(s). It's recommended to resolve these before exporting.` : 'No issues found.'}
                        </p>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-6 bg-slate-50 space-y-3">
                        {isLoading && issues.length === 0 ? (
                            <div className="text-center py-16">
                                <svg className="animate-spin mx-auto h-12 w-12 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <h3 className="mt-4 text-xl font-semibold text-slate-700">Running AI Analysis...</h3>
                                <p className="mt-1 text-sm text-slate-500">This may take a moment.</p>
                            </div>
                        ) : issues.length > 0 ? (
                            issues.map((issue, index) => (
                                <div key={index} className="bg-white border border-slate-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getIssueTypeColor(issue.type)}`}>
                                                {getIssueTypeLabel(issue.type)}
                                            </span>
                                            <p className="text-sm font-semibold text-slate-700 mt-2">{issue.description}</p>
                                        </div>
                                        <button 
                                            onClick={() => onGoToSegment(issue.segmentId)}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                                        >
                                            Go to Segment
                                        </button>
                                    </div>
                                    <div className="space-y-2 text-xs border-t border-slate-100 pt-2 mt-2">
                                        <p><strong className="text-slate-500">Source:</strong> <span className="text-slate-600" dangerouslySetInnerHTML={{ __html: issue.source }} /></p>
                                        <p><strong className="text-slate-500">Target:</strong> <span className="text-slate-600" dangerouslySetInnerHTML={{ __html: issue.target || '<i class="text-slate-400">[Empty]</i>' }} /></p>
                                        {issue.suggestion && (
                                            <div className="flex items-center gap-2">
                                                <strong className="text-green-600">Suggestion:</strong> 
                                                <span className="text-green-700">{issue.suggestion}</span>
                                                {issue.suggestedFix && (
                                                    <button 
                                                        onClick={() => onApplySuggestion(issue.segmentId, issue.suggestedFix!)} 
                                                        className="px-2 py-0.5 bg-green-100 hover:bg-green-200 text-green-800 rounded text-xs font-semibold"
                                                    >
                                                        Apply Fix
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-16">
                                <h3 className="text-xl font-semibold text-slate-700">All Clear!</h3>
                                <p className="mt-1 text-sm text-slate-500">The QA check found no issues.</p>
                            </div>
                        )}
                        {isLoading && issues.length > 0 && (
                             <div className="flex items-center justify-center gap-2 text-slate-500 text-sm p-2">
                                 <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                 <span>Running AI analysis...</span>
                             </div>
                        )}
                    </div>
                    
                    <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between">
                         <button
                            onClick={onRunAgain}
                            disabled={isLoading}
                            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
                        >
                            Run Again
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </BoundingBox>
            <style>{`
                @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};