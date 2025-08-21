



import React from 'react';
import { BoundingBox } from './BoundingBox';
import { STRINGS } from '../strings';

interface ContextMenuProps {
    x: number;
    y: number;
    onJoin: () => void;
    onNewTerm: (term: string) => void;
    onShowDefinition: (term: string) => void;
    onTranslateSelection: (text: string) => void;
    onSplit: () => void;
    isLastSegment: boolean;
    selectionText: string;
}

const JoinDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-slate-500 group-hover:text-indigo-500 group-disabled:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-1v8m-4-6V3a1 1 0 011-1h4a1 1 0 011 1v8M4 17h16" />
  </svg>
)

const SplitIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-slate-500 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121M3 21l6.879-6.879" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 14.828L12 12m2.828-2.828L12 12M9.172 9.172L12 12m2.828 2.828L12 12m-2.828 2.828L12 12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l-2 2m14 14l2-2" />
    </svg>
)

const NewTermIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-slate-500 group-hover:text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const DefinitionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-slate-500 group-hover:text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
    </svg>
);

const TranslateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-slate-500 group-hover:text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 4h3v2H5V4zm0 3h3v2H5V7zm0 3h3v2H5v-2zm3 0h3v2H8v-2zm3 0h3v2h-3v-2zm0-3h3v2h-3V7zm0-3h3v2h-3V4zm3 3h3v2h-3V7zm3-3h3v2h-3V4zm-2 13v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1zm-1-4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zM3 8a1 1 0 011-1h2a1 1 0 110 2H4a1 1 0 01-1-1z" />
    </svg>
);

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onJoin, onSplit, isLastSegment, selectionText, onNewTerm, onShowDefinition, onTranslateSelection }) => {
    const style = {
        top: y,
        left: x,
    };

    return (
        <div
            style={style}
            className="fixed z-50"
            onClick={e => e.stopPropagation()} // Stop click from closing menu immediately
        >
            <BoundingBox name="context menu">
                <div
                    className="bg-white rounded-md shadow-lg py-1 w-56 border border-slate-200 animate-fade-in-fast"
                >
                    <ul role="menu">
                         {selectionText && (
                            <>
                                <li>
                                    <button
                                        role="menuitem"
                                        onClick={() => onTranslateSelection(selectionText)}
                                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center group transition-colors duration-150 truncate"
                                    >
                                        <TranslateIcon />
                                        {STRINGS.MENU_TRANSLATE_SELECTION}: "{selectionText}"
                                    </button>
                                </li>
                                <li>
                                    <button
                                        role="menuitem"
                                        onClick={() => onNewTerm(selectionText)}
                                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center group transition-colors duration-150 truncate"
                                    >
                                        <NewTermIcon />
                                        {STRINGS.MENU_NEW_TERM}: "{selectionText}"
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => onShowDefinition(selectionText)} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center group transition-colors duration-150 truncate">
                                        <DefinitionIcon />
                                        Define: "{selectionText}"
                                    </button>
                                </li>
                                <hr className="my-1 border-slate-100" />
                            </>
                        )}
                        <li>
                            <button
                                role="menuitem"
                                onClick={onJoin}
                                disabled={isLastSegment}
                                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 disabled:bg-transparent disabled:text-slate-400 disabled:cursor-not-allowed flex items-center group transition-colors duration-150"
                            >
                                <JoinDownIcon />
                                {STRINGS.MENU_JOIN_SEGMENT}
                            </button>
                        </li>
                        <li>
                             <button
                                role="menuitem"
                                onClick={onSplit}
                                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center group transition-colors duration-150"
                            >
                                <SplitIcon />
                                {STRINGS.MENU_SPLIT_SEGMENT}
                            </button>
                        </li>
                    </ul>
                </div>
            </BoundingBox>
            {/* Animation styles scoped to this component */}
            <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-fast {
                    animation: fade-in-fast 0.1s ease-out forwards;
                }
            `}</style>
        </div>
    );
};