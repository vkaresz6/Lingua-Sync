import React from 'react';
import { Segment } from '../types';
import { BoundingBox } from './BoundingBox';
import { stripHtml } from '../utils/fileHandlers';

interface PreviewPaneProps {
    segments: Segment[];
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({ segments }) => {
    return (
        <BoundingBox name="preview pane" className="h-full w-full bg-slate-50 border border-slate-300 rounded-md overflow-hidden">
            <div className="p-6 h-full overflow-y-auto bg-white shadow-inner doc-preview">
                {segments.map((segment) => {
                    const hasTargetContent = stripHtml(segment.target).trim() !== '';
                    const isConfirmed = !!segment.evaluation?.rating && segment.evaluation.rating > 0;

                    if (hasTargetContent) {
                        // Render the target. If it hasn't been confirmed (evaluated), show it with lower opacity.
                        return (
                            <div
                                key={segment.id}
                                className={isConfirmed ? '' : 'opacity-50'}
                                dangerouslySetInnerHTML={{ __html: segment.target }}
                            />
                        );
                    } else {
                        // This should only be for segments never focused. Render the source with low opacity.
                        return (
                             <div
                                key={segment.id}
                                className="opacity-50"
                                dangerouslySetInnerHTML={{ __html: segment.source }}
                            />
                        );
                    }
                })}
                {segments.length === 0 && (
                    <div className="text-slate-500 text-center py-10">No content to preview.</div>
                )}
                <style>{`
                    .doc-preview {
                        font-family: Georgia, serif;
                        line-height: 1.7;
                        color: #333;
                    }
                    .doc-preview > div {
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