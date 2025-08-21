


import React, { useState, useEffect } from 'react';
import { Segment, Term, SegmentStatus, UserRole } from '../types';
import { EditableCell } from './EditableCell';
import { ContextMenu } from './ContextMenu';
import { SourceTextRenderer } from './SourceTextRenderer';
import { BoundingBox } from './BoundingBox';
import { STRINGS } from '../strings';
import { formatTimestamp } from '../utils/fileHandlers';
import { useSession } from './contexts/SessionContext';
import { useProject } from './contexts/ProjectContext';
import { ModalType, ModalPayload } from './contexts/UIStateContext';

interface SegmentTableProps {
  segments: Segment[];
  onSegmentChange: (segmentId: number, newText: string) => void;
  onJoinSegments: (segmentId: number) => void;
  onSplitSegment: (segmentId: number) => void;
  onSegmentComplete: (segmentId: number) => void;
  onEnterPress: (segmentId: number) => void;
  onCopySource: (segmentId: number) => void;
  onCopyFormatting: (segmentId: number) => void;
  segmentRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
  sourceSegmentRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
  onShowDefinition: (word: string, x: number, y: number) => void;
  onTranslateSelection: (text: string) => void;
  termBase: Term[];
  onNewTerm: (sourceText: string) => void;
  onInsertTerm: (targetTerm: string) => void;
  onInsertTag: (tag: string, segmentId: number) => void;
  onInsertHighlight: (text: string) => void;
  onToggleStructure: (segmentId: number) => void;
  segmentsBeingStructured: number[];
  onToggleDateHighlight: (segmentId: number) => void;
  segmentsBeingDated: number[];
  onCorrectGrammar: (segmentId: number) => void;
  segmentsBeingCorrected: number[];
  evaluatingSegmentId: number | null;
  allTmMatches: Record<number, { source: string; target: string; score: number; }>;
  onApplyTmMatch: (segmentId: number, targetText: string) => void;
  lastUpdatedBySystem: number | null;
  onUpdateProcessed: () => void;
  openModal: (type: ModalType, payload?: ModalPayload) => void;
  isProofreaderMode: boolean;
  currentUser?: string;
  currentUserRoles?: UserRole[] | null;
  proofreader1?: string;
  proofreader2?: string;
  onApproveSegment: (segmentId: number) => void;
  onRejectSegment: (segmentId: number) => void;
}

const WandIcon = ({ active }: { active: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${active ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69a.75.75 0 01.819.162l4.223 4.223a.75.75 0 01-1.06 1.06l-4.223-4.223a.75.75 0 01-.162-.819A8.97 8.97 0 0018 15a9 9 0 00-9-9 8.97 8.97 0 00-.69 3.463a.75.75 0 01-.819-.162L4.223 5.07a.75.75 0 011.06-1.06l4.246 4.246z" />
    </svg>
);

const CalendarIcon = ({ active }: { active: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${active ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const TinySpinner: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin h-5 w-5 ${className || 'text-indigo-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const AnalysisToggleButton: React.FC<{ isVisible: boolean; isLoading: boolean; onClick: () => void; title: string; children: React.ReactNode; }> = ({ isVisible, isLoading, onClick, title, children }) => (
    <button
        onClick={onClick}
        disabled={isLoading}
        className="p-1 rounded-md disabled:cursor-wait group"
        title={title}
    >
        {isLoading ? <TinySpinner /> : children}
    </button>
);

const getIndicatorColor = (score: number | null): string => {
  if (score === null) return 'bg-slate-300'; // Default, not evaluated
  if (score <= 1.5) return 'bg-red-500';     // Major errors
  if (score <= 2.5) return 'bg-orange-500'; // Significant errors
  if (score <= 3.5) return 'bg-yellow-400'; // Minor errors
  if (score <= 4.5) return 'bg-lime-400';    // Almost perfect
  return 'bg-green-500';                     // Perfect
};

const CorrectGrammarIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.375 3.375 0 0014 18.443V19.5a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-1.057a3.375 3.375 0 00-.96-2.192l-.548-.547z" />
    </svg>
);

const MicrophoneIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-slate-600`} viewBox="0 0 20 20" fill="currentColor">
      <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
      <path d="M5.5 4.5a.5.5 0 00-1 0v5.75a.5.5 0 00.5.5h1a.5.5 0 00.5-.5V4.5a.5.5 0 00-1 0z" />
      <path d="M10 12a4 4 0 00-4 4v.5a.5.5 0 00.5.5h7a.5.5 0 00.5-.5V16a4 4 0 00-4-4z" />
    </svg>
);

const StatusIcon: React.FC<{ status: SegmentStatus }> = ({ status }) => {
    const icons: Record<SegmentStatus, { icon: React.ReactNode; color: string; label: string }> = {
        draft: { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>, color: 'text-slate-400', label: 'Draft' },
        translated: { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>, color: 'text-sky-500', label: 'Translated' },
        approved_by_p1: { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>, color: 'text-yellow-500', label: 'Approved by Proofreader 1' },
        approved_by_p2: { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: 'text-green-500', label: 'Approved by Proofreader 2' },
        rejected: { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>, color: 'text-red-500', label: 'Rejected' },
        finalized: { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>, color: 'text-slate-700', label: 'Finalized' },
    };
    const { icon, color, label } = icons[status] || icons.draft;
    return <div className={`${color} flex justify-center`} title={label}>{icon}</div>;
};

export const SegmentTable: React.FC<SegmentTableProps> = ({
  segments,
  onSegmentChange,
  onJoinSegments,
  onSplitSegment,
  onSegmentComplete,
  onEnterPress,
  onCopySource,
  onCopyFormatting,
  segmentRefs,
  sourceSegmentRefs,
  onShowDefinition,
  onTranslateSelection,
  termBase,
  onNewTerm,
  onInsertTerm,
  onInsertTag,
  onInsertHighlight,
  onToggleStructure,
  segmentsBeingStructured,
  onToggleDateHighlight,
  segmentsBeingDated,
  onCorrectGrammar,
  segmentsBeingCorrected,
  evaluatingSegmentId,
  allTmMatches,
  onApplyTmMatch,
  lastUpdatedBySystem,
  onUpdateProcessed,
  openModal,
  isProofreaderMode,
  currentUser,
  currentUserRoles,
  proofreader1,
  proofreader2,
  onApproveSegment,
  onRejectSegment,
}) => {
  const { activeSegmentId: activeSegment, onSegmentFocus } = useSession();
  const { targetLanguage } = useProject();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    segmentId: number;
    selectionText: string;
  } | null>(null);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', closeMenu);
      document.addEventListener('scroll', closeMenu, { capture: true, once: true });
    }
    return () => {
      document.removeEventListener('click', closeMenu);
      document.removeEventListener('scroll', closeMenu, { capture: true });
    };
  }, [contextMenu]);

  const handleContextMenu = (event: React.MouseEvent, segmentId: number) => {
    event.preventDefault();
    const selection = window.getSelection()?.toString().trim() ?? '';
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      segmentId,
      selectionText: selection,
    });
  };

  const handleJoin = () => {
    if (contextMenu?.segmentId) {
      onJoinSegments(contextMenu.segmentId);
    }
    setContextMenu(null);
  };
  
  const handleSplit = () => {
    if (contextMenu?.segmentId) {
        onSplitSegment(contextMenu.segmentId);
    }
    setContextMenu(null);
  };

  const handleSourceCellInteraction = (e: React.MouseEvent, type: 'click' | 'hover') => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('term-highlight')) {
        const targetTerm = target.dataset.targetTerm;

        if (type === 'click' && targetTerm) {
            e.preventDefault();
            onInsertTerm(targetTerm);
        }
    } else if (target.classList.contains('date-highlight')) {
        const textToInsert = target.dataset.title;
        if (type === 'click' && textToInsert) {
            e.preventDefault();
            onInsertHighlight(textToInsert);
        }
    }
  };

  const handleShowDef = (term: string) => {
    if (!contextMenu) return;
    onShowDefinition(term, contextMenu.x, contextMenu.y);
  };
  
  return (
    <BoundingBox name="segment table container" className="!m-0 !p-0">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider">
              <tr>
                {isProofreaderMode && <th className="p-3 w-16 text-center font-semibold">Status</th>}
                <th className="p-3 w-28 text-center font-semibold">
                    <BoundingBox name="col header: #">{STRINGS.TABLE_HEADER_NUMBER}</BoundingBox>
                </th>
                <th className="p-3 text-left font-semibold">
                    <BoundingBox name="col header: source">{STRINGS.TABLE_HEADER_SOURCE}</BoundingBox>
                </th>
                <th className="p-3 w-16 text-center font-semibold">
                    {/* Actions */}
                </th>
                <th className="p-3 text-left font-semibold">
                    <BoundingBox name="col header: target">{STRINGS.TABLE_HEADER_TARGET}</BoundingBox>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {segments.map((segment, index) => {
                const isActive = segment.id === activeSegment;
                const tmMatch = allTmMatches[segment.id];
                const hasTimestamp = typeof segment.startTime === 'number' && typeof segment.endTime === 'number';

                const canP1Review = isProofreaderMode && currentUser === proofreader1 &&
                    ['translated', 'rejected'].includes(segment.status) &&
                    (currentUserRoles?.includes('Proofreader 1') || currentUserRoles?.includes('Project Leader') || currentUserRoles?.includes('Owner'));
                
                const canP2Review = isProofreaderMode && currentUser === proofreader2 &&
                    segment.status === 'approved_by_p1' &&
                    (currentUserRoles?.includes('Proofreader 2') || currentUserRoles?.includes('Project Leader') || currentUserRoles?.includes('Owner'));
                
                const showActionButtons = canP1Review || canP2Review;

                let isReadOnly = segment.status === 'finalized';
                if (!isReadOnly && currentUserRoles) {
                    if (currentUserRoles.includes('Owner') || currentUserRoles.includes('Project Leader')) {
                        isReadOnly = false;
                    } else {
                        const canEditAsP2 = currentUserRoles.includes('Proofreader 2') && segment.status === 'approved_by_p1';
                        const canEditAsP1 = currentUserRoles.includes('Proofreader 1') && ['translated', 'rejected'].includes(segment.status);
                        const canEditAsTranslator = currentUserRoles.includes('Translator') && ['draft', 'rejected'].includes(segment.status);
                        isReadOnly = !(canEditAsP2 || canEditAsP1 || canEditAsTranslator);
                    }
                } else if (!currentUserRoles) {
                    isReadOnly = true;
                }

                return (
                  <tr 
                    key={segment.id} 
                    className={`${isActive ? 'bg-indigo-50' : 'hover:bg-slate-50'} transition-colors duration-150`}
                  >
                    {isProofreaderMode && (
                      <td className="p-3 w-16 text-center align-middle">
                        <StatusIcon status={segment.status} />
                      </td>
                    )}
                    <td className={`p-3 w-28 text-center text-slate-500 align-top ${isActive ? 'text-indigo-600' : ''}`}>
                        <BoundingBox name={`row ${index + 1}: number`}>
                           <div className="flex flex-col items-center justify-center h-full">
                                <span className="font-bold text-lg">{index + 1}</span>
                                {hasTimestamp && (
                                    <span className="text-xs font-mono text-slate-400 mt-1" title={STRINGS.TIMESTAMP_TOOLTIP}>
                                        {formatTimestamp(segment.startTime!)}
                                    </span>
                                )}
                                {segment.lastModifiedBy && (
                                    <span className="text-xs text-slate-400 mt-1 truncate max-w-full" title={`Last modified by ${segment.lastModifiedBy}`}>
                                        {segment.lastModifiedBy}
                                    </span>
                                )}
                            </div>
                        </BoundingBox>
                    </td>
                    <td
                      className="p-3 text-slate-700 leading-relaxed align-top break-words"
                      onContextMenu={(e) => handleContextMenu(e, segment.id)}
                    >
                      <BoundingBox name={`row ${index + 1}: source`}>
                        <div
                          ref={(el) => {
                              if (sourceSegmentRefs.current) {
                                  sourceSegmentRefs.current[segment.id] = el;
                              }
                          }}
                          onClick={(e) => {
                              onSegmentFocus(segment.id);
                              handleSourceCellInteraction(e, 'click');
                          }}
                        >
                          <SourceTextRenderer
                            segment={segment}
                            termBase={termBase}
                            onInsertTag={(tag) => onInsertTag(tag, segment.id)}
                          />
                        </div>
                      </BoundingBox>
                    </td>
                    <td className="p-2 w-16 text-center align-middle">
                      <BoundingBox name={`row ${index + 1}: actions`}>
                           <div className="flex flex-col items-center justify-center h-full gap-2">
                                <div className="w-full flex items-center justify-center gap-1.5 h-4">
                                    {segment.id === evaluatingSegmentId ? (
                                        <TinySpinner className="text-indigo-500 h-4 w-4" />
                                    ) : (
                                        <>
                                            <div
                                                className={`w-3 h-3 rounded-sm ring-1 ring-white/50 ${getIndicatorColor(segment.evaluation?.rating ?? null)}`}
                                                title={segment.evaluation?.rating != null ? `Quality: ${segment.evaluation.rating.toFixed(1)}/5` : STRINGS.QUALITY_SCORE_UNEVALUATED}
                                            ></div>
                                            <div
                                                className={`w-3 h-3 rounded-sm ring-1 ring-white/50 ${getIndicatorColor(segment.evaluation?.consistency ?? null)}`}
                                                title={segment.evaluation?.consistency != null ? `Consistency: ${segment.evaluation.consistency.toFixed(1)}/5` : 'Consistency not evaluated'}
                                            ></div>
                                        </>
                                    )}
                                </div>
                                <button 
                                    onClick={() => openModal('dictation', { segmentId: segment.id, originalText: segment.target })}
                                    className={`p-1.5 rounded-full transition-colors disabled:opacity-50 bg-slate-200 text-slate-600 hover:bg-indigo-200 hover:text-indigo-800`}
                                    title="Dictate text"
                                    disabled={segmentsBeingCorrected.includes(segment.id)}
                                >
                                    <MicrophoneIcon />
                                </button>
                                <button 
                                    onClick={() => onCorrectGrammar(segment.id)} 
                                    disabled={segmentsBeingCorrected.includes(segment.id)}
                                    className="p-1.5 rounded-full bg-slate-200 text-slate-600 hover:bg-indigo-200 hover:text-indigo-800 transition-colors disabled:opacity-50"
                                    title={STRINGS.BUTTON_AUTOCORRECT_TITLE}
                                >
                                    {segmentsBeingCorrected.includes(segment.id) ? <TinySpinner className="text-slate-600 h-4 w-4" /> : <CorrectGrammarIcon />}
                                </button>
                                
                                <div className="w-full h-px bg-slate-200 my-1"></div>

                                <AnalysisToggleButton
                                  isVisible={!!segment.isStructureVisible}
                                  isLoading={segmentsBeingStructured.includes(segment.id)}
                                  onClick={() => onToggleStructure(segment.id)}
                                  title={segment.isStructureVisible ? STRINGS.TITLE_HIDE_STRUCTURE : STRINGS.TITLE_SHOW_STRUCTURE}
                                >
                                    <WandIcon active={!!segment.isStructureVisible} />
                                </AnalysisToggleButton>
                                <AnalysisToggleButton
                                  isVisible={!!segment.isDateHighlightVisible}
                                  isLoading={segmentsBeingDated.includes(segment.id)}
                                  onClick={() => onToggleDateHighlight(segment.id)}
                                  title={segment.isDateHighlightVisible ? STRINGS.TITLE_HIDE_DATES : STRINGS.TITLE_SHOW_DATES}
                                >
                                    <CalendarIcon active={!!segment.isDateHighlightVisible} />
                                </AnalysisToggleButton>
                           </div>
                      </BoundingBox>
                    </td>
                    <td className="p-0 align-top relative" onContextMenu={(e) => handleContextMenu(e, segment.id)}>
                      <BoundingBox name={`row ${index + 1}: target`} className="!m-0 !p-0">
                          <EditableCell
                            value={segment.target}
                            onChange={(newText) => onSegmentChange(segment.id, newText)}
                            onFocus={() => onSegmentFocus(segment.id)}
                            onSegmentComplete={() => onSegmentComplete(segment.id)}
                            onEnterPress={() => onEnterPress(segment.id)}
                            onCopySource={() => onCopySource(segment.id)}
                            onCopyFormatting={() => onCopyFormatting(segment.id)}
                            setRef={(el) => {
                              if (segmentRefs.current) {
                                  segmentRefs.current[segment.id] = el;
                              }
                            }}
                            tmMatch={tmMatch}
                            onApplyTmMatch={() => tmMatch && onApplyTmMatch(segment.id, tmMatch.target)}
                            wasJustUpdated={segment.id === lastUpdatedBySystem}
                            onUpdateProcessed={onUpdateProcessed}
                            status={segment.status}
                            isReadOnly={isReadOnly}
                          />
                           {showActionButtons && (
                            <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                <button
                                    onClick={() => onRejectSegment(segment.id)}
                                    className="p-1.5 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors shadow-sm"
                                    title="Reject"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => onApproveSegment(segment.id)}
                                    className="p-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors shadow-sm"
                                    title="Approve"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        )}
                      </BoundingBox>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
         {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onJoin={handleJoin}
            onSplit={handleSplit}
            onNewTerm={onNewTerm}
            onShowDefinition={handleShowDef}
            onTranslateSelection={onTranslateSelection}
            selectionText={contextMenu.selectionText}
            isLastSegment={segments.length > 0 && segments[segments.length - 1].id === contextMenu.segmentId}
          />
        )}
      </div>
    </BoundingBox>
  );
};