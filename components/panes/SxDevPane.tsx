
import React, { useState } from 'react';
import { BoundingBox } from '../BoundingBox';
import { DocxInterpreter } from '../DocxInterpreter';

interface SxDevPaneProps {
    xmlContent: string;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean; }> = ({ active, onClick, children, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            active
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-600 hover:text-white'
        }`}
    >
        {children}
    </button>
);


export const SxDevPane: React.FC<SxDevPaneProps> = ({ xmlContent }) => {
    const [view, setView] = useState<'raw' | 'interpreted'>('raw');

    const renderContent = () => {
        if (!xmlContent) {
            return (
                <div className="flex-grow h-full w-full flex items-center justify-center p-4">
                    <p className="text-gray-400 text-center">Click the "View DOCX XML" button in the header's 'Dev' tab to load source document XML here.</p>
                </div>
            );
        }

        if (view === 'interpreted') {
            return (
                <div className="flex-grow h-full w-full overflow-auto bg-gray-100">
                    <DocxInterpreter xmlString={xmlContent} />
                </div>
            );
        }
        
        // Default to raw view
        return (
            <pre className="flex-grow h-full w-full overflow-auto p-4 whitespace-pre-wrap break-all">
                <code>
                    {xmlContent}
                </code>
            </pre>
        );
    };

    return (
        <BoundingBox name="sxDev pane" className="h-full w-full flex flex-col bg-gray-800 text-gray-200 font-mono text-xs rounded-md overflow-hidden">
            <div className="flex-shrink-0 p-2 bg-gray-900 border-b border-gray-700 flex items-center gap-2">
                <TabButton active={view === 'raw'} onClick={() => setView('raw')}>
                    Raw XML
                </TabButton>
                <TabButton active={view === 'interpreted'} onClick={() => setView('interpreted')} disabled={!xmlContent}>
                    Interpreter
                </TabButton>
            </div>
            {renderContent()}
        </BoundingBox>
    );
};
