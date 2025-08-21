import React, { useRef, useEffect } from 'react';
import { STRINGS } from '../strings';
import { SegmentStatus } from '../types';

interface EditableCellProps {
  value: string; // Now contains HTML
  onChange: (newValue: string) => void;
  onFocus: () => void;
  onSegmentComplete: () => void;
  onEnterPress: () => void;
  onCopySource: () => void;
  onCopyFormatting: () => void;
  setRef?: (element: HTMLDivElement | null) => void;
  tmMatch?: { source: string; target: string; score: number; };
  onApplyTmMatch?: () => void;
  translationSource?: 'tm-100' | 'user';
  wasJustUpdated: boolean;
  onUpdateProcessed: () => void;
  isReadOnly?: boolean;
  status: SegmentStatus;
}

export const EditableCell: React.FC<EditableCellProps> = ({ 
    value, onChange, onFocus, onSegmentComplete, onEnterPress, 
    onCopySource, onCopyFormatting, setRef, tmMatch, onApplyTmMatch, 
    translationSource, wasJustUpdated, onUpdateProcessed, isReadOnly = false, status
}) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  // This ref tracks if the content is being changed by this component's onInput handler.
  const isInternalUpdate = useRef(false);
  
  useEffect(() => {
    if (contentRef.current && !isInternalUpdate.current && contentRef.current.innerHTML !== value) {
      contentRef.current.innerHTML = value;
    }
    
    if (wasJustUpdated) {
        if (contentRef.current && !isReadOnly) {
            contentRef.current.focus();
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(contentRef.current);
            range.collapse(false); // false to collapse to the end
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
        onUpdateProcessed();
    }
    isInternalUpdate.current = false;
  }, [value, wasJustUpdated, onUpdateProcessed, isReadOnly]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    isInternalUpdate.current = true;
    const newHtml = e.currentTarget.innerHTML;
    onChange(newHtml);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onEnterPress();
    } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onCopySource();
    } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onCopyFormatting();
    }
  };

  const handleBlur = () => {
    onSegmentComplete();
  };
  
  const isFinalized = status === 'finalized';
  const isCellReadOnly = isReadOnly || isFinalized;

  return (
    <div className={`relative w-full h-full flex flex-col ${isCellReadOnly ? 'bg-slate-100' : 'bg-white'}`}>
      <div className="relative flex-grow">
        <div 
          className={`absolute top-0 left-0 bottom-0 w-1 rounded-l-md ${translationSource === 'tm-100' ? 'bg-green-500' : 'bg-transparent'}`}
          title={translationSource === 'tm-100' ? STRINGS.TM_PRETRANSLATED_100 : undefined}
        ></div>
        <div
          ref={el => {
            contentRef.current = el;
            if (setRef) {
              setRef(el);
            }
          }}
          contentEditable={!isCellReadOnly}
          onInput={handleInput}
          onFocus={onFocus}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={`w-full h-full p-3 pl-4 border-none resize-none leading-relaxed whitespace-pre-wrap break-words text-slate-700 caret-slate-800 min-h-[48px] ${
              isCellReadOnly
                ? 'focus:outline-none cursor-not-allowed'
                : 'focus:outline-none focus:ring-2 focus:ring-indigo-300'
          }`}
          aria-label={STRINGS.ARIA_LABEL_TARGET_EDITOR}
          spellCheck={false}
        />
      </div>
      {tmMatch && tmMatch.score >= 0.7 && (
        <div className="flex-shrink-0 p-2 border-t border-slate-200 bg-slate-50 text-xs">
          <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-indigo-700">TM Match</span>
              <span className="font-bold px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700">{(tmMatch.score * 100).toFixed(0)}%</span>
          </div>
          <p className="text-slate-500 truncate" title={tmMatch.source}>{tmMatch.source}</p>
          <p className="font-semibold text-slate-800 my-1">{tmMatch.target}</p>
          <button
              onClick={onApplyTmMatch}
              className="w-full text-center text-indigo-700 font-bold bg-indigo-100 hover:bg-indigo-200 rounded-md py-1 transition-colors"
          >
              Apply Match
          </button>
        </div>
      )}
    </div>
  );
};