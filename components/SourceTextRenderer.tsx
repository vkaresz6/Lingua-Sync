
import React, { useMemo } from 'react';
import { Term, Segment } from '../types';

interface SourceTextRendererProps {
  segment: Segment;
  termBase?: Term[];
  onInsertTag: (tag: string) => void;
}

// Utility to escape strings for regex
const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const SourceTextRenderer: React.FC<SourceTextRendererProps> = ({ segment, termBase, onInsertTag }) => {
  const { 
      source, 
      isStructureVisible, 
      structuredSourceHtml,
      isDateHighlightVisible,
      dateHighlightHtml,
    } = segment;

  // --- Priority rendering for analysis views ---
  if (isStructureVisible && structuredSourceHtml) {
    return <div dangerouslySetInnerHTML={{ __html: structuredSourceHtml }} />;
  }
  if (isDateHighlightVisible && dateHighlightHtml) {
      return <div dangerouslySetInnerHTML={{ __html: dateHighlightHtml }} />;
  }
  
  // Memoized function to render text parts with term highlights
  const renderTextWithHighlights = useMemo(() => (text: string, keyPrefix: string) => {
    if (!termBase || termBase.length === 0) {
      return text;
    }
    const regex = new RegExp(`\\b(${termBase.map(t => escapeRegex(t.source)).join('|')})\\b`, 'gi');
    const parts = text.split(regex);
    const termMap = new Map(termBase.map(t => [t.source.toLowerCase(), t]));

    return parts.map((part, index) => {
      const term = termMap.get(part.toLowerCase());
      if (term) {
        return (
          <span
            key={`${keyPrefix}-${index}`}
            className="term-highlight font-semibold text-indigo-600 bg-indigo-100 rounded-sm px-1 py-0.5 cursor-pointer"
            data-source-term={term.source}
            data-target-term={term.target}
          >
            {part}
          </span>
        );
      }
      return <React.Fragment key={`${keyPrefix}-${index}`}>{part}</React.Fragment>;
    });
  }, [termBase]);


  const memoizedElements = useMemo(() => {
    const parts = source.split(/(<[^>]+>)/).filter(Boolean);

    return (
      <div className="leading-relaxed">
        {parts.map((part, index) => {
          if (part.startsWith('<') && part.endsWith('>')) {
            // This is a tag
            return (
              <button
                key={index}
                onClick={(e) => {
                    e.stopPropagation(); // Prevent focusing the whole cell
                    onInsertTag(part);
                }}
                title={`Click to insert tag: ${part}`}
                className="inline-block bg-slate-200 text-slate-700 font-mono text-xs px-2 py-1 rounded-md mx-0.5 my-0.5 hover:bg-indigo-200 cursor-pointer transition-colors"
              >
                {part}
              </button>
            );
          } else {
            // This is text content.
            return <span key={index}>{renderTextWithHighlights(part, String(index))}</span>;
          }
        })}
      </div>
    );
  }, [source, onInsertTag, renderTextWithHighlights]);


  return memoizedElements;
};