
import React, { useState, useMemo } from 'react';
import { Term, Segment } from '../../types';
import { BoundingBox } from '../BoundingBox';
import { STRINGS } from '../../strings';
import { stripHtml } from '../../utils/fileHandlers';
import { useSession } from '../contexts/SessionContext';

interface TermDbPaneProps {
    terms: Term[];
    segments: Segment[];
    onTermsChange: (newTerms: Term[]) => void;
    handleExtractTerms: () => void;
    isExtracting: boolean;
}

const AddIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const ExtractIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 3.5a1.5 1.5 0 011.478 1.837l-4.11 8.22a1.5 1.5 0 01-2.736 0l-4.11-8.22A1.5 1.5 0 012 3.5h8zm0 2.15L8.382 8.5h3.236L10 5.65z" />
        <path d="M13.236 10.5H2.764l5.236 6.981 5.236-6.981z" opacity="0.5"/>
    </svg>
);

const TinySpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const TermDbPane: React.FC<TermDbPaneProps> = ({ terms, onTermsChange, handleExtractTerms, isExtracting, segments }) => {
    const { activeSegmentId } = useSession();
    const [newSource, setNewSource] = useState('');
    const [newTarget, setNewTarget] = useState('');
    const [newDef, setNewDef] = useState('');

    const activeSegment = useMemo(() => segments.find(s => s.id === activeSegmentId), [segments, activeSegmentId]);

    const relevantTerms = useMemo(() => {
        if (!activeSegment) return [];
        const sourceText = stripHtml(activeSegment.source).toLowerCase();
        return terms.filter(term => sourceText.includes(term.source.toLowerCase()));
    }, [activeSegment, terms]);

    const handleAddTerm = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSource.trim() && newTarget.trim()) {
            const newTerm: Term = {
                id: Date.now(),
                source: newSource.trim(),
                target: newTarget.trim(),
                definition: newDef.trim() || undefined,
            };
            onTermsChange([...terms, newTerm]);
            setNewSource(''); setNewTarget(''); setNewDef('');
        }
    };

    const handleDeleteTerm = (termId: number) => {
        onTermsChange(terms.filter(t => t.id !== termId));
    };
    
    return (
        <BoundingBox name="term db pane" className="h-full w-full flex flex-col bg-slate-50 border border-slate-300 rounded-md">
            <div className="flex-grow p-1 overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-100 sticky top-0">
                        <tr>
                            <th className="p-2">{STRINGS.TERMDB_HEADER_SOURCE}</th>
                            <th className="p-2">{STRINGS.TERMDB_HEADER_TARGET}</th>
                            <th className="p-2">{STRINGS.TERMDB_HEADER_DEFINITION}</th>
                            <th className="p-2 w-8"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {terms.length === 0 ? (
                            <tr><td colSpan={4} className="text-center p-4 text-slate-400">{STRINGS.TERMDB_EMPTY}</td></tr>
                        ) : (relevantTerms.length > 0 ? relevantTerms : terms).map(term => (
                             <tr key={term.id} className={`border-b border-slate-100 ${relevantTerms.includes(term) ? 'bg-indigo-50' : ''}`}>
                                <td className="p-2 font-medium text-slate-700">{term.source}</td>
                                <td className="p-2 text-slate-700">{term.target}</td>
                                <td className="p-2 text-slate-500 italic truncate" title={term.definition}>{term.definition}</td>
                                <td className="p-2">
                                    <button onClick={() => handleDeleteTerm(term.id)} title={STRINGS.BUTTON_DELETE_TERM_TITLE} className="text-slate-400 hover:text-red-500"><DeleteIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex-shrink-0 p-2 border-t border-slate-200 space-y-2">
                 <form onSubmit={handleAddTerm} className="grid grid-cols-12 gap-2 items-center">
                    <input type="text" value={newSource} onChange={e => setNewSource(e.target.value)} placeholder={STRINGS.PLACEHOLDER_NEW_SOURCE_TERM} className="col-span-3 p-1.5 text-xs border border-slate-300 rounded-md" />
                    <input type="text" value={newTarget} onChange={e => setNewTarget(e.target.value)} placeholder={STRINGS.PLACEHOLDER_NEW_TARGET_TERM} className="col-span-3 p-1.5 text-xs border border-slate-300 rounded-md" />
                    <input type="text" value={newDef} onChange={e => setNewDef(e.target.value)} placeholder={STRINGS.PLACEHOLDER_NEW_DEFINITION} className="col-span-5 p-1.5 text-xs border border-slate-300 rounded-md" />
                    <button type="submit" title={STRINGS.BUTTON_ADD_TERM_TITLE} className="p-1.5 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"><AddIcon /></button>
                </form>
                <button onClick={handleExtractTerms} disabled={isExtracting} className="w-full flex items-center justify-center gap-2 p-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 disabled:bg-purple-400 transition-colors">
                    {isExtracting ? <TinySpinner/> : <ExtractIcon/>}
                    {isExtracting ? STRINGS.BUTTON_EXTRACTING_TERMS : 'Extract Terms with AI'}
                </button>
            </div>
        </BoundingBox>
    );
};