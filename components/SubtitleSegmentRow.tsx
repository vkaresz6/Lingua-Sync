import React, { useState, useEffect, useRef } from 'react';
import { Segment } from '../types';
import { stripHtml } from '../utils/fileHandlers';
import { STRINGS } from '../strings';

interface SubtitleSegmentRowProps {
    segment: Segment;
    onFocus: () => void;
    onTargetChange: (newText: string) => void;
    onTimeChange: (segmentId: number, start: number, end: number) => void;
    onComplete: (segmentId: number) => void;
    isActive: boolean;
    evaluatingSegmentId: number | null;
}

const getIndicatorColor = (score: number | null): string => {
  if (score === null) return 'bg-slate-300'; // Default, not evaluated
  if (score <= 1.5) return 'bg-red-500';     // Major errors
  if (score <= 2.5) return 'bg-orange-500'; // Significant errors
  if (score <= 3.5) return 'bg-yellow-400'; // Minor errors
  if (score <= 4.5) return 'bg-lime-400';    // Almost perfect
  return 'bg-green-500';                     // Perfect
};

const TinySpinner: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin h-5 w-5 ${className || 'text-indigo-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    const ms = Math.round((seconds - Math.floor(seconds)) * 1000).toString().padStart(3, '0');
    return `${h}:${m}:${s},${ms}`;
};

const parseTime = (timeStr: string): number => {
    const parts = timeStr.replace(',', ':').split(':');
    if (parts.length !== 4) return NaN;
    const [h, m, s, ms] = parts.map(p => parseInt(p, 10));
    return (h * 3600) + (m * 60) + s + (ms / 1000);
};

export const SubtitleSegmentRow: React.FC<SubtitleSegmentRowProps> = ({ segment, onFocus, onTargetChange, onTimeChange, onComplete, isActive, evaluatingSegmentId }) => {
    const [startStr, setStartStr] = useState(formatTime(segment.startTime || 0));
    const [endStr, setEndStr] = useState(formatTime(segment.endTime || 0));
    const contentRef = useRef<HTMLDivElement>(null);
    const isInternalUpdate = useRef(false);
    
    useEffect(() => {
        setStartStr(formatTime(segment.startTime || 0));
        setEndStr(formatTime(segment.endTime || 0));
    }, [segment.startTime, segment.endTime]);

    useEffect(() => {
        if (contentRef.current && !isInternalUpdate.current && contentRef.current.innerHTML !== segment.target) {
            contentRef.current.innerHTML = segment.target;
        }
        isInternalUpdate.current = false;
    }, [segment.target]);

    const handleTimeBlur = (field: 'start' | 'end') => {
        const timeStr = field === 'start' ? startStr : endStr;
        const newTime = parseTime(timeStr);
        
        if (!isNaN(newTime)) {
            const newStart = field === 'start' ? newTime : (segment.startTime || 0);
            const newEnd = field === 'end' ? newTime : (segment.endTime || 0);
            if (newStart < newEnd) {
                 onTimeChange(segment.id, newStart, newEnd);
            }
        } else {
            // Revert to original time if invalid
            setStartStr(formatTime(segment.startTime || 0));
            setEndStr(formatTime(segment.endTime || 0));
        }
    };
    
    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        isInternalUpdate.current = true;
        onTargetChange(e.currentTarget.innerHTML);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onComplete(segment.id);
        }
    };

    const duration = (segment.endTime || 0) - (segment.startTime || 0);
    const charCount = stripHtml(segment.target).length;
    const cps = duration > 0 ? charCount / duration : 0;
    const cpsColor = cps > 25 ? 'cps-bad' : cps > 17 ? 'cps-warn' : 'cps-good';

    return (
        <div className={`flex gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-indigo-100' : 'bg-slate-50'}`}>
            <div className="flex-shrink-0 w-24 text-center">
                <input 
                    type="text"
                    value={startStr}
                    onChange={e => setStartStr(e.target.value)}
                    onBlur={() => handleTimeBlur('start')}
                    className="w-full text-center bg-transparent font-mono text-xs rounded-sm p-1 focus:bg-white focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                />
                <input
                    type="text"
                    value={endStr}
                    onChange={e => setEndStr(e.target.value)}
                    onBlur={() => handleTimeBlur('end')}
                    className="w-full text-center bg-transparent font-mono text-xs text-slate-500 rounded-sm p-1 focus:bg-white focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                />
            </div>

            <div className="flex-grow flex flex-col">
                <div className="text-sm text-slate-600 mb-2 p-2 border-b border-slate-200" dangerouslySetInnerHTML={{ __html: segment.source }} />
                <div
                    ref={contentRef}
                    contentEditable
                    onFocus={onFocus}
                    onInput={handleInput}
                    onBlur={() => onComplete(segment.id)}
                    onKeyDown={handleKeyDown}
                    className="flex-grow p-2 focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded-md bg-transparent"
                    spellCheck={false}
                />
            </div>
            
            <div className="flex-shrink-0 w-16 text-center text-xs space-y-2">
                <div>
                    <div className="font-bold">{charCount}</div>
                    <div className="text-slate-500">chars</div>
                </div>
                 <div>
                    <div className={`font-bold ${cpsColor}`}>{cps.toFixed(1)}</div>
                    <div className="text-slate-500">cps</div>
                </div>
                <div>
                    <div className="w-full h-5 flex items-center justify-center">
                         {segment.id === evaluatingSegmentId ? (
                            <TinySpinner className="text-indigo-500 h-4 w-4" />
                        ) : (
                            <div
                                className={`w-3 h-3 rounded-sm ring-1 ring-white/50 ${getIndicatorColor(segment.evaluation?.rating ?? null)}`}
                                title={segment.evaluation?.rating != null ? STRINGS.QUALITY_SCORE_TOOLTIP(String(segment.evaluation.rating)) : STRINGS.QUALITY_SCORE_UNEVALUATED}
                            ></div>
                        )}
                    </div>
                    <div className="text-slate-500 -mt-1">Quality</div>
                </div>
            </div>
        </div>
    );
};
