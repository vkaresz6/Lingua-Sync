import React from 'react';

export const Logo = () => (
    <div className="flex items-center gap-2" title="LinguaSync - AI CAT Tool">
        <svg role="img" aria-label="LinguaSync logo" className="h-7 w-7 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 4V15M8 15L5 12M8 15L11 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 20V9M16 9L13 12M16 9L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-xl font-bold text-slate-800 tracking-tight">LinguaSync</span>
    </div>
);
