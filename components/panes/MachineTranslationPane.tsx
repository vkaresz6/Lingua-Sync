
import React from 'react';
import { BoundingBox } from '../BoundingBox';
import { STRINGS } from '../../strings';

interface MachineTranslationPaneProps {
    machineTranslations: string[];
    isTranslating: boolean;
    onMachineTranslationClick: (translation: string) => void;
    handleGenerateMachineTranslations: () => void;
    isSegmentActive: boolean;
}

const LoadingSpinner = () => (
    <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-md backdrop-blur-sm z-10">
        <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

export const MachineTranslationPane: React.FC<MachineTranslationPaneProps> = ({ machineTranslations, isTranslating, onMachineTranslationClick, handleGenerateMachineTranslations, isSegmentActive }) => {
    return (
        <BoundingBox name="machine translation display" className="w-full h-full flex flex-col relative bg-slate-50 border border-slate-300 rounded-md">
            <div
                id="mt-display"
                className="w-full flex-grow p-2 flex flex-col items-center justify-center overflow-y-auto"
                aria-live="polite"
            >
            {machineTranslations.length > 0 ? (
                <div className="flex flex-col gap-2 w-full">
                    {machineTranslations.map((translation, index) => (
                        <button
                            key={index}
                            onClick={() => onMachineTranslationClick(translation)}
                            className="w-full p-2 rounded-md bg-white hover:bg-indigo-100 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-slate-900 transition-all text-left"
                            title={STRINGS.MT_USE_TRANSLATION_TITLE}
                        >
                            {translation}
                        </button>
                    ))}
                </div>
            ) : (
                <span className="text-slate-400 font-normal text-sm text-center px-4">
                    {isTranslating ? STRINGS.MT_PANE_GETTING_TRANSLATIONS : STRINGS.MT_PANE_PLACEHOLDER}
                </span>
            )}
            </div>
             <div className="p-2 border-t border-slate-200">
                <button
                    onClick={handleGenerateMachineTranslations}
                    disabled={!isSegmentActive || isTranslating}
                    className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                >
                    {isTranslating ? STRINGS.BUTTON_GENERATING_TRANSLATIONS : STRINGS.BUTTON_GENERATE_TRANSLATIONS}
                </button>
            </div>
            {isTranslating && machineTranslations.length === 0 && <LoadingSpinner />}
        </BoundingBox>
    );
};