import React, { useMemo } from 'react';
import { Segment, ProjectState } from '../../types';
import { BoundingBox } from '../BoundingBox';
import { stripHtml } from '../../utils/fileHandlers';
import { STRINGS } from '../../strings';
import { useProject } from '../contexts/ProjectContext';

interface PreviewPaneProps {
    segments: Segment[];
}

const getFinalHtmlForPreview = (sourceDocumentHtml: ProjectState['sourceDocumentHtml'], segments: Segment[]): string => {
    // If we have the structured HTML, use it for high-fidelity reconstruction.
    if (sourceDocumentHtml) {
        const doc = new DOMParser().parseFromString(sourceDocumentHtml, 'text/html');
        segments.forEach(segment => {
            const el = doc.querySelector(`[data-lingua-id="${segment.id}"]`);
            if (el) {
                if (stripHtml(segment.target).trim()) {
                    // Create a temporary element to parse the target HTML
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = segment.target;
                    // Replace the original element with the first child of the parsed target HTML
                    // This handles cases where segment.target is a full element like <p>...</p>
                    if (tempDiv.firstChild) {
                        el.replaceWith(tempDiv.firstChild);
                    }
                } else {
                    // If target is empty, we leave the source, but can add styling for preview
                    el.classList.add('untranslated-segment');
                }
            }
        });
        return doc.body.innerHTML;
    }

    // Fallback for older projects or non-DOCX files.
    return segments.map(s => {
         const hasTargetContent = stripHtml(s.target).trim() !== '';
         const isConfirmed = !!s.evaluation?.rating && s.evaluation.rating > 0;
         const content = hasTargetContent ? s.target : s.source;
         const className = hasTargetContent && !isConfirmed ? 'unconfirmed-segment' : hasTargetContent ? '' : 'untranslated-segment';
         return `<div class="${className}">${content}</div>`;
    }).join('');
};

export const PreviewPane: React.FC<PreviewPaneProps> = ({ segments }) => {
    const { sourceDocumentHtml } = useProject();
    const finalHtml = useMemo(() => getFinalHtmlForPreview(sourceDocumentHtml, segments), [sourceDocumentHtml, segments]);

    return (
        <BoundingBox name="preview pane" className="h-full w-full bg-slate-50 border border-slate-300 rounded-md overflow-hidden">
            <div className="p-6 h-full overflow-y-auto bg-white shadow-inner doc-preview">
                {segments.length === 0 ? (
                    <div className="text-slate-500 text-center py-10">{STRINGS.PREVIEW_PANE_EMPTY}</div>
                ) : (
                    <div dangerouslySetInnerHTML={{ __html: finalHtml }} />
                )}
                <style>{`
                    .doc-preview {
                        font-family: Georgia, serif;
                        line-height: 1.7;
                        color: #333;
                    }
                    .doc-preview .untranslated-segment, .doc-preview .unconfirmed-segment {
                         opacity: 0.5;
                    }
                    .doc-preview > div > div {
                        margin-bottom: 1em;
                    }
                    .doc-preview strong { font-weight: bold; }
                    .doc-preview em { font-style: italic; }
                    .doc-preview h1, .doc-preview h2, .doc-preview h3, .doc-preview h4, .doc-preview h5, .doc-preview h6 {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
                        font-weight: bold;
                        line-height: 1.3;
                        margin-top: 1.5em;
                        margin-bottom: 0.5em;
                    }
                    .doc-preview img {
                        max-width: 100%;
                        height: auto;
                        margin: 1.2em 0;
                        border-radius: 4px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        display: block;
                    }
                    .doc-preview ul, .doc-preview ol {
                        padding-left: 1.75em;
                        margin-bottom: 1em;
                    }
                    .doc-preview li {
                        margin-bottom: 0.3em;
                    }
                    .doc-preview blockquote {
                        border-left: 3px solid #ccc;
                        padding-left: 1em;
                        margin-left: 0;
                        font-style: italic;
                        color: #666;
                    }
                    .doc-preview table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 1em;
                    }
                    .doc-preview th, .doc-preview td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    .doc-preview th {
                        background-color: #f7f7f7;
                    }
                `}</style>
            </div>
        </BoundingBox>
    );
};
