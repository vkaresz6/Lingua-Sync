

import React, { useState } from 'react';
import { BoundingBox } from './BoundingBox';
import { PaneId } from '../types';
import { STRINGS } from '../strings';
import { useSession } from './contexts/SessionContext';


interface BottomPanelProps {
    height: number;
    wordCount: number;
    charCount: number; // without spaces
    charCountWithSpaces: number;
    terminologyHits: number;
    tmHitsFuzzy: number;
    tmHits100: number;
    panes: PaneId[];
    getPaneTitle: (paneId: PaneId) => string;
    renderPane: (paneId: PaneId) => React.ReactNode;
    onDockPane: (paneId: PaneId) => void;
    onDropPane: (paneId: PaneId) => void;
}

const WordCountIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

const CharCountIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-2.25 3h5.25" />
    </svg>
);

const CharCountWithSpacesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
);

const TerminologyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);
const TmIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
);


const InputTokenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
);

const OutputTokenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
       <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const ApiIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
);

const DockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h11a2 2 0 012 2v7M3 10l4-4m-4 4l4 4" transform="rotate(-90 12 12)" />
    </svg>
);

const TabButton: React.FC<{ tabName: PaneId; activeTab: PaneId; onClick: (tab: PaneId) => void; onDragStart: (e: React.DragEvent) => void; onDragEnd: (e: React.DragEvent) => void; children: React.ReactNode; onDock: () => void; }> = ({ tabName, activeTab, onClick, onDragStart, onDragEnd, children, onDock }) => (
    <div 
        className={`flex items-center px-4 py-2 text-sm font-medium transition-colors focus:outline-none rounded-t-md border-t border-l border-r ${
            activeTab === tabName
                ? 'bg-white border-slate-300 text-indigo-600'
                : 'bg-slate-100 border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200 cursor-grab'
        }`}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        draggable
    >
        <button
            onClick={() => onClick(tabName)}
            className="flex-grow text-left"
            role="tab"
            aria-selected={activeTab === tabName}
        >
            {children}
        </button>
        <button 
            onClick={onDock}
            title="Dock to sidebar"
            className="ml-2 p-1 rounded-full text-slate-500 hover:bg-slate-300"
        >
            <DockIcon />
        </button>
    </div>
);


export const BottomPanel: React.FC<BottomPanelProps> = (props) => {
    const { height, wordCount, charCount, charCountWithSpaces, terminologyHits, tmHitsFuzzy, tmHits100, panes, getPaneTitle, renderPane, onDockPane, onDropPane } = props;
    const { inputTokenCount, outputTokenCount, apiCallCount } = useSession();
    const [activeTab, setActiveTab] = useState<PaneId | null>(panes[0] || null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    React.useEffect(() => {
        if (!panes.includes(activeTab as PaneId) && panes.length > 0) {
            setActiveTab(panes[0]);
        } else if (panes.length === 0) {
            setActiveTab(null);
        }
    }, [panes, activeTab]);
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        const paneId = e.dataTransfer.getData('paneId');
        if (paneId) { // Only show drop effect if a pane is being dragged
            e.dataTransfer.dropEffect = "move";
            setIsDraggingOver(true);
        }
    };

    const handleDragLeave = () => setIsDraggingOver(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const paneId = e.dataTransfer.getData('paneId') as PaneId;
        if (paneId) onDropPane(paneId);
        setIsDraggingOver(false);
    };
    
    if (panes.length === 0) {
        return (
            <div 
                className={`flex-shrink-0 h-8 bg-white border-t border-slate-300 flex items-center justify-center text-sm text-slate-400 transition-colors ${isDraggingOver ? 'bg-indigo-100 border-indigo-400 border-dashed border-2 -m-px' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                Drop a pane here to view it in the bottom panel.
            </div>
        );
    }
    
    return (
        <BoundingBox name="bottom panel" className="!m-0 !p-0">
            <div 
                style={{ height: `${height}px` }}
                className="flex-shrink-0 bg-white border-t border-slate-300 shadow-inner p-4 flex flex-col" 
                role="region" 
                aria-labelledby="bottom-panels-heading"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="flex justify-between items-end">
                    <div role="tablist" className="flex -mb-px">
                        {panes.map(paneId => (
                            <TabButton 
                                key={paneId}
                                tabName={paneId} 
                                activeTab={activeTab!} 
                                onClick={setActiveTab}
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('paneId', paneId);
                                    e.dataTransfer.effectAllowed = 'move';
                                    (e.currentTarget as HTMLElement).classList.add('drag-ghost');
                                }}
                                onDragEnd={(e) => {
                                    (e.currentTarget as HTMLElement).classList.remove('drag-ghost');
                                }}
                                onDock={() => onDockPane(paneId)}
                            >
                                {getPaneTitle(paneId)}
                            </TabButton>
                        ))}
                    </div>
                    <BoundingBox name="usage stats">
                        <div className="flex items-center text-xs text-slate-500 font-medium gap-x-3 mb-1">
                             {/* Text Stats */}
                            <div className="flex items-center" title={`Words: ${wordCount.toLocaleString()}`}>
                                <WordCountIcon />
                                <span>{wordCount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center" title={`Characters (with spaces): ${charCountWithSpaces.toLocaleString()}`}>
                                <CharCountWithSpacesIcon />
                                <span>{charCountWithSpaces.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center" title={`Characters (no spaces): ${charCount.toLocaleString()}`}>
                                <CharCountIcon />
                                <span>{charCount.toLocaleString()}</span>
                            </div>

                            <div className="h-4 w-px bg-slate-200 mx-1"></div>

                            {/* Invoice Stats */}
                            <div className="flex items-center" title={`Terminology hits in target text: ${terminologyHits.toLocaleString()}`}>
                                <TerminologyIcon />
                                <span>{terminologyHits.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center" title={`TM hits - 100%: ${tmHits100.toLocaleString()} | Fuzzy (70-99%): ${tmHitsFuzzy.toLocaleString()}`}>
                                <TmIcon />
                                <span>{tmHits100 + tmHitsFuzzy}</span>
                            </div>

                            <div className="h-4 w-px bg-slate-200 mx-1"></div>
                            
                            {/* API Stats */}
                            <div className="flex items-center" title="API calls this session">
                                <ApiIcon />
                                <span>{apiCallCount}</span>
                            </div>
                            <div className="flex items-center" title={`Input Tokens (session): ${inputTokenCount.toLocaleString()}`}>
                                <InputTokenIcon />
                                <span >{inputTokenCount.toLocaleString()}</span>
                            </div>
                             <div className="flex items-center" title={`Output Tokens (session): ${outputTokenCount.toLocaleString()}`}>
                                <OutputTokenIcon />
                                <span >{outputTokenCount.toLocaleString()}</span>
                            </div>
                        </div>
                    </BoundingBox>
                </div>

                <div className={`flex-grow mt-px pt-4 border-t border-slate-300 bg-white relative transition-colors ${isDraggingOver ? 'bg-indigo-50' : ''}`}>
                   {activeTab && renderPane(activeTab)}
                </div>
            </div>
        </BoundingBox>
    );
};