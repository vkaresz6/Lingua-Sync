
import React, { useState, useEffect } from 'react';
import { GeminiPrompts, ProjectSettings } from '../types';
import { BoundingBox } from './BoundingBox';
import { DEFAULT_PROMPTS, STRINGS } from '../strings';
import { useProject } from './contexts/ProjectContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newSettings: ProjectSettings) => void;
}

type PromptCategory = keyof GeminiPrompts;
type ViewCategory = 'general' | PromptCategory;

const getCategoryLabel = (category: ViewCategory) => {
    if (category === 'general') return STRINGS.LABEL_GENERAL;
    const labels: Record<PromptCategory, string> = {
        segmentation: STRINGS.LABEL_SEGMENTATION,
        translation: STRINGS.LABEL_TRANSLATION,
        evaluation: STRINGS.LABEL_EVALUATION,
        grammar: STRINGS.LABEL_GRAMMAR,
        termExtraction: STRINGS.LABEL_TERM_EXTRACTION,
        definition: STRINGS.LABEL_DEFINITION,
        inflection: STRINGS.LABEL_INFLECTION,
        structureAnalysis: STRINGS.LABEL_STRUCTURE_ANALYSIS,
        punctuationCorrection: STRINGS.LABEL_PUNCTUATION_CORRECTION,
        dateAnalysis: STRINGS.LABEL_DATE_ANALYSIS,
        chatSystemInstruction: STRINGS.LABEL_CHAT_SYSTEM_INSTRUCTION,
        chatToolInstruction: STRINGS.LABEL_CHAT_TOOL_INSTRUCTION,
        grammarCorrectionHtml: "Grammar Correction (HTML)",
        batchTranslation: STRINGS.LABEL_BATCH_TRANSLATION,
        batchTimedSegmentation: "Batch Timed Segmentation",
        syncFormatting: STRINGS.LABEL_SYNC_FORMATTING,
        batchSyncFormatting: STRINGS.LABEL_BATCH_SYNC_FORMATTING,
        splitSegment: STRINGS.LABEL_SPLIT_SEGMENT,
        transcriptionCorrection: STRINGS.LABEL_TRANSCRIPTION_CORRECTION,
        termSuggestion: STRINGS.LABEL_TERM_SUGGESTION,
        quickTranslate: "Quick Translate",
        rebuildTranslation: "Rebuild Translation",
        aiQaCheck: "AI QA Check",
        batchEvaluation: "Batch Evaluation",
    };
    return labels[category as PromptCategory] || STRINGS.LABEL_UNKNOWN;
}

const promptCategories = Object.keys(DEFAULT_PROMPTS) as PromptCategory[];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
    const { settings } = useProject();
    const [activeView, setActiveView] = useState<ViewCategory>('general');
    const [editedSettings, setEditedSettings] = useState<ProjectSettings>(settings);

    useEffect(() => {
        setEditedSettings(settings);
    }, [settings, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(editedSettings);
        onClose();
    };

    const handleResetPrompt = (category: PromptCategory) => {
        setEditedSettings(prev => ({
            ...prev,
            prompts: {
                ...prev.prompts,
                [category]: DEFAULT_PROMPTS[category]
            }
        }));
    };
    
    const handlePromptChange = (category: PromptCategory, value: string) => {
        setEditedSettings(prev => ({ 
            ...prev, 
            prompts: { ...prev.prompts, [category]: value } 
        }));
    };

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setEditedSettings(prev => ({ ...prev, model: e.target.value }));
    };

    const NavButton: React.FC<{ viewName: ViewCategory; }> = ({ viewName }) => (
        <button
            onClick={() => setActiveView(viewName)}
            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none ${
                activeView === viewName
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'
            }`}
        >
            {getCategoryLabel(viewName)}
        </button>
    );

    const renderContent = () => {
        if (activeView === 'general') {
            return (
                <BoundingBox name="general settings">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">{STRINGS.SETTINGS_GENERAL_TITLE}</h3>
                    <div>
                        <label htmlFor="model-select" className="block text-sm font-medium text-slate-700 mb-2">
                            {STRINGS.SETTINGS_LABEL_MODEL}
                        </label>
                        <select
                            id="model-select"
                            value={editedSettings.model}
                            onChange={handleModelChange}
                            className="w-full max-w-xs p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white text-slate-900"
                        >
                            <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                            <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
                        </select>
                        <p className="mt-2 text-xs text-slate-500">
                           {STRINGS.SETTINGS_MODEL_HELP_TEXT}
                        </p>
                    </div>
                </BoundingBox>
            );
        }

        const promptCategory = activeView as PromptCategory;
        const currentPrompt = editedSettings.prompts[promptCategory];

        return (
             <BoundingBox name="prompt editor">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-slate-800">{getCategoryLabel(promptCategory)} Prompt</h3>
                    <button
                        onClick={() => handleResetPrompt(promptCategory)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                        {STRINGS.SETTINGS_RESET_PROMPT}
                    </button>
                </div>
                <textarea
                    id={`prompt-textarea-${promptCategory}`}
                    value={currentPrompt}
                    onChange={(e) => handlePromptChange(promptCategory, e.target.value)}
                    className="w-full h-96 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono bg-slate-50 text-slate-900"
                    aria-label={`Prompt for ${getCategoryLabel(promptCategory)}`}
                />
                <p className="mt-2 text-xs text-slate-500">
                    {STRINGS.SETTINGS_PROMPT_HELP_TEXT}
                </p>
            </BoundingBox>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 animate-fade-in-fast" onMouseDown={onClose}>
            <BoundingBox name="settings modal" className="!m-0 max-w-5xl w-full">
                <div className="bg-white rounded-lg shadow-2xl w-full max-h-[90vh] flex flex-col" onMouseDown={e => e.stopPropagation()}>
                    <BoundingBox name="modal header">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-2xl font-bold text-slate-800">{STRINGS.SETTINGS_MODAL_TITLE}</h2>
                            <p className="text-sm text-slate-500 mt-1">{STRINGS.SETTINGS_MODAL_DESC}</p>
                        </div>
                    </BoundingBox>
                    
                    <div className="flex flex-grow overflow-hidden">
                        <BoundingBox name="settings nav" className="w-1/4 !p-0">
                            <nav className="h-full p-4 border-r border-slate-200 bg-slate-50 overflow-y-auto">
                                <ul className="space-y-1">
                                    <li><NavButton viewName="general" /></li>
                                    <li>
                                        <h3 className="px-3 pt-4 pb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">{STRINGS.SETTINGS_LABEL_PROMPTS}</h3>
                                    </li>
                                    {promptCategories.map(cat => <li key={cat}><NavButton viewName={cat} /></li>)}
                                </ul>
                            </nav>
                        </BoundingBox>
                        
                        <BoundingBox name="settings content" className="w-3/4 !p-0">
                            <div className="p-6 h-full overflow-y-auto">
                                {renderContent()}
                            </div>
                        </BoundingBox>
                    </div>
                    
                    <BoundingBox name="modal footer">
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {STRINGS.BUTTON_CANCEL}
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {STRINGS.SETTINGS_BUTTON_SAVE}
                            </button>
                        </div>
                    </BoundingBox>
                </div>
            </BoundingBox>
             {/* Animation styles scoped to this component */}
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
