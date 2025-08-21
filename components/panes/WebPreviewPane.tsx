import React, { useMemo } from 'react';
import { Segment } from '../../types';
import { BoundingBox } from '../BoundingBox';
import { useProject } from '../contexts/ProjectContext';
import { getReconstructedBodyHtml, b64DecodeUnicode } from '../../utils/fileHandlers';

interface WebPreviewPaneProps {
    segments: Segment[];
}

export const WebPreviewPane: React.FC<WebPreviewPaneProps> = ({ segments }) => {
    const { sourceDocumentHtml, project, sourceFile } = useProject();

    const finalHtml = useMemo(() => {
        const reconstructedBodyHtml = getReconstructedBodyHtml(sourceDocumentHtml, segments);
        
        if (sourceFile?.content && sourceFile.content.startsWith('data:text/html;base64,')) {
            try {
                const base64Content = sourceFile.content.split(',')[1];
                const originalHtmlString = b64DecodeUnicode(base64Content);
                const originalDoc = new DOMParser().parseFromString(originalHtmlString, 'text/html');
                
                // Add or replace base tag to handle relative paths correctly in the iframe
                const baseUrl = project.webpageUrl || '';
                let head = originalDoc.head;
                let base = head.querySelector('base');
                if (!base) {
                    base = originalDoc.createElement('base');
                    head.prepend(base);
                }
                base.href = baseUrl;

                originalDoc.body.innerHTML = reconstructedBodyHtml;
                
                return `<!DOCTYPE html>\n` + originalDoc.documentElement.outerHTML;

            } catch (e) {
                console.error("Failed to reconstruct full HTML for preview:", e);
                // Fallback to just the body
            }
        }

        // Fallback for safety or if source file is missing
        return `<!DOCTYPE html><html><head><base href="${project.webpageUrl || ''}"></head><body>${reconstructedBodyHtml}</body></html>`;

    }, [sourceDocumentHtml, segments, project.webpageUrl, sourceFile]);

    return (
        <BoundingBox name="web preview pane" className="h-full w-full bg-white border border-slate-300 rounded-md overflow-hidden">
            <iframe
                title="Web Preview"
                srcDoc={finalHtml}
                sandbox="allow-scripts allow-same-origin"
                className="w-full h-full border-0"
            />
        </BoundingBox>
    );
};