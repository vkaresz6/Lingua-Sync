

import React from 'react';
import { BoundingBox } from '../BoundingBox';
import { STRINGS } from '../../strings';
import { SourceError } from '../../types';

interface EvaluationPaneProps {
    evaluation: string;
    onCorrectPunctuation: () => void;
    isActionDisabled: boolean;
    errors: SourceError[];
    onApplyCorrection: (error: SourceError) => void;
}

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-red-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);


export const EvaluationPane: React.FC<EvaluationPaneProps> = ({ evaluation, onCorrectPunctuation, isActionDisabled, errors, onApplyCorrection }) => {
    return (
        <BoundingBox name="evaluation panel" className="flex flex-col h-full">
            <div className="flex-grow flex flex-col min-h-0">
                <label htmlFor="evaluation-textarea" className="text-xs font-bold uppercase text-slate-500 mb-1 px-1">Evaluation Feedback</label>
                <textarea
                    id="evaluation-textarea"
                    value={evaluation}
                    readOnly
                    className="w-full flex-grow bg-white border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-400 focus:outline-none resize-none text-slate-800 placeholder-slate-500 text-sm"
                    placeholder={STRINGS.EVALUATION_PLACEHOLDER}
                />
            </div>
            
            {errors && errors.length > 0 && (
                <div className="py-2 flex-shrink-0 min-h-0">
                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-1 px-1">Grammar & Spelling</h4>
                    <div className="p-2 bg-white border border-slate-300 rounded-md max-h-32 overflow-y-auto">
                        <ul className="space-y-2">
                            {errors.map((error, index) => (
                                <li key={index} className="text-xs">
                                    <div className="flex">
                                        <ErrorIcon/>
                                        <p className="text-slate-700">
                                            <span className="font-semibold text-red-700 line-through">{error.error}</span> → 
                                            <button 
                                                onClick={() => onApplyCorrection(error)}
                                                className="font-semibold text-green-700 bg-green-100 hover:bg-green-200 px-1 rounded-sm ml-1 transition-colors"
                                                title="Apply this correction"
                                            >
                                                {error.correction}
                                            </button>
                                        </p>
                                    </div>
                                    <p className="text-slate-500 italic pl-[22px]">{error.explanation}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            
            <div className="pt-2 mt-auto flex-shrink-0">
                <button
                    onClick={onCorrectPunctuation}
                    disabled={isActionDisabled}
                    className="w-full px-3 py-1.5 bg-sky-600 text-white text-sm font-semibold rounded-md hover:bg-sky-700 disabled:bg-sky-300 disabled:cursor-not-allowed transition-colors"
                >
                    {STRINGS.BUTTON_CORRECT_PUNCTUATION}
                </button>
            </div>
        </BoundingBox>
    );
};