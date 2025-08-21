import React from 'react';

interface WidgetProps {
    title: string;
    children: React.ReactNode;
    onDock: () => void;
    onDragStart?: (e: React.DragEvent) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    draggable?: boolean;
}

const DockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h11a2 2 0 012 2v7M3 10l4-4m-4 4l4 4" transform="rotate(90 12 12)" />
    </svg>
);

const DragHandleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 cursor-grab" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

export const Widget: React.FC<WidgetProps> = ({ title, children, onDock, onDragStart, onDragEnd, draggable }) => {
    return (
        <div className="bg-white rounded-lg shadow-md flex flex-col h-full overflow-hidden border border-slate-200">
            <header 
                className="flex items-center justify-between p-2 bg-slate-100 border-b border-slate-200"
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                draggable={draggable}
            >
                <div className="flex items-center gap-2 cursor-grab">
                    <div title="Drag to reorder">
                        <DragHandleIcon />
                    </div>
                    <h3 className="font-semibold text-sm text-slate-700 select-none">{title}</h3>
                </div>
                <button
                    onClick={onDock}
                    title="Dock to bottom panel"
                    className="p-1 rounded-md text-slate-500 hover:bg-slate-300 hover:text-slate-800"
                >
                    <DockIcon />
                </button>
            </header>
            <div className="flex-grow p-1 overflow-y-auto">
                {children}
            </div>
        </div>
    );
};