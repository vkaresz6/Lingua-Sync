import React from 'react';
import { BoundingBox } from './BoundingBox';
import { STRINGS } from '../strings';

interface EditToolbarProps {
    isDisabled: boolean;
    onSyncFormatting: () => void;
    isSyncingFormatting: boolean;
    onBatchSyncFormatting: () => void;
    isBatchSyncingFormatting: boolean;
    onResegment: () => void;
}

const FormatButton: React.FC<{ onClick: () => void; title: string; children: React.ReactNode; isDisabled: boolean; }> = ({ onClick, title, children, isDisabled }) => (
    <button
        onClick={onClick}
        title={title}
        disabled={isDisabled}
        className="p-2 rounded-md text-slate-600 hover:bg-slate-300 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:text-slate-400 disabled:hover:bg-transparent transition-colors"
    >
        {children}
    </button>
);

const SyncFormatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
    </svg>
);

const BatchSyncFormatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      <path d="M5 3a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V4a1 1 0 00-1-1H5zM5 8a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V9a1 1 0 00-1-1H5zM5 13a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1v-1a1 1 0 00-1-1H5z" opacity="0.4"/>
    </svg>
);


const ResegmentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M14.5 5.5a.5.5 0 00-.5-.5h-2a.5.5 0 000 1h2a.5.5 0 00.5-.5z" clipRule="evenodd" />
      <path d="M3 8a1 1 0 011-1h4a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h4a1 1 0 110 2H4a1 1 0 01-1-1z" />
    </svg>
);


const TinySpinner = () => (
    <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export const EditToolbar: React.FC<EditToolbarProps> = ({ isDisabled, onSyncFormatting, isSyncingFormatting, onBatchSyncFormatting, isBatchSyncingFormatting, onResegment }) => {
    const formatDoc = (command: string) => {
        if (isDisabled) return;
        document.execCommand(command, false);
    };

    return (
        <BoundingBox name="edit pane">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                <FormatButton onClick={() => formatDoc('bold')} title="Bold (Ctrl+B)" isDisabled={isDisabled}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>
                </FormatButton>
                <FormatButton onClick={() => formatDoc('italic')} title="Italic (Ctrl+I)" isDisabled={isDisabled}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>
                </FormatButton>
                <FormatButton onClick={() => formatDoc('underline')} title="Underline (Ctrl+U)" isDisabled={isDisabled}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>
                </FormatButton>
                <div className="h-6 w-px bg-slate-300 mx-1"></div>
                <FormatButton onClick={() => formatDoc('superscript')} title="Superscript" isDisabled={isDisabled}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4h-4v2h2.59L10 12.59 5.41 8 4 9.41 10 15.41l8-8V10h2V4z"/></svg>
                </FormatButton>
                <FormatButton onClick={() => formatDoc('subscript')} title="Subscript" isDisabled={isDisabled}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="m18 16-4-4v2.59L16.59 17H14v2h6v-6h-2zM4 11.41 5.41 10 10 14.59 14.59 10l1.41 1.41L10 17.41 4 11.41z"/></svg>
                </FormatButton>
                <div className="h-6 w-px bg-slate-300 mx-1"></div>
                <FormatButton onClick={onSyncFormatting} title={STRINGS.TITLE_SYNC_FORMATTING} isDisabled={isDisabled || isSyncingFormatting}>
                    {isSyncingFormatting ? <TinySpinner /> : <SyncFormatIcon />}
                </FormatButton>
                <FormatButton onClick={onBatchSyncFormatting} title={STRINGS.TITLE_BATCH_SYNC_FORMATTING} isDisabled={isDisabled || isBatchSyncingFormatting}>
                    {isBatchSyncingFormatting ? <TinySpinner /> : <BatchSyncFormatIcon />}
                </FormatButton>
                <FormatButton onClick={onResegment} title={STRINGS.TITLE_RESEGMENT} isDisabled={isDisabled}>
                    <ResegmentIcon />
                </FormatButton>
            </div>
        </BoundingBox>
    );
};