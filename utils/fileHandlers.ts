import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.mjs';
import saveAs from 'file-saver';
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import JSZip from 'jszip';
import { ProjectState, Segment, Term, TranslationUnit, TermUnit } from '../types';
import html2pdf from 'html2pdf.js';
import { STRINGS } from '../strings';
import { segmentText as apiSegmentText, getRebuiltDocumentXml, ApiResponse } from '../utils/geminiApi';


// Set worker source for pdf.js to work in a module environment
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs`;

// --- HELPERS ---
export const b64DecodeUnicode = (str: string): string => {
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

export const base64ToUint8Array = (base64: string) => {
    const byteString = atob(base64);
    const uint8Array = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
    }
    return uint8Array;
};

export const stripHtml = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
}

const secondsToSrtTime = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.round((timeInSeconds - Math.floor(timeInSeconds)) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
};

export const formatTimestamp = (totalSeconds: number): string => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00.0';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${seconds.toFixed(1).padStart(4, '0')}`;
};


// --- IMPORT FUNCTIONS ---

export const parseTimedTranscript = (transcriptText: string): { text: string, start: number, end: number }[] => {
    const lines = transcriptText.split('\n').filter(line => line.trim() !== '');
    const timedLines: { text: string; start: number }[] = [];
    let currentText = '';
    
    for (const line of lines) {
        const timestampMatch = line.trim().match(/^(\d{1,2}):(\d{2})$/);
        if (timestampMatch) {
            // If we have text buffered, the timestamp marks the end of it.
            // But in this format, the timestamp precedes the text.
            const minutes = parseInt(timestampMatch[1], 10);
            const seconds = parseInt(timestampMatch[2], 10);
            const timeInSeconds = minutes * 60 + seconds;
            
            // Start a new timed line
            timedLines.push({ text: '', start: timeInSeconds });
        } else if (timedLines.length > 0) {
            // Append text to the most recent timestamp
            const lastTimedLine = timedLines[timedLines.length - 1];
            lastTimedLine.text = (lastTimedLine.text + ' ' + line.trim()).trim();
        }
    }

    // Filter out any entries that didn't get text
    const validTimedLines = timedLines.filter(tl => tl.text.length > 0);

    // Calculate end times
    const chunks = validTimedLines.map((current, index) => {
        let end;
        if (index < validTimedLines.length - 1) {
            end = validTimedLines[index + 1].start;
        } else {
            // Estimate end time for the last chunk based on text length
            const duration = current.text.length / 15; // Rough estimate: 15 chars/sec
            end = current.start + Math.max(2, duration); // At least 2 seconds, or estimated duration
        }
        // Ensure end time is greater than start time
        if (end <= current.start) {
            end = current.start + 2;
        }
        return { ...current, end };
    });

    return chunks;
}


export const parsePdfToText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
        text += pageText + '\n';
    }
    return text;
};

export const parseHtmlForProject = async (
    htmlString: string,
    segmentationPrompt: string,
    model: string
): Promise<{ sourceDocumentHtml: string, segments: Segment[] }> => {
    const doc = new DOMParser().parseFromString(htmlString, 'text/html');
    
    // Remove script and style elements to avoid including their content in rawText
    doc.querySelectorAll('script, style').forEach(el => el.remove());

    const rawText = doc.body.textContent || '';
    
    let parsedSegments: string[] = [];
    if (rawText.trim()) {
        const { data: sentences } = await apiSegmentText(rawText, segmentationPrompt, model);
        parsedSegments = sentences;
    }

    // Build new segments and a new sourceDocumentHtml from the AI's response,
    // ensuring a clean, well-segmented structure for the editor.
    const tempDoc = document.createElement('body');
    const newSegments: Segment[] = parsedSegments.map((text, index) => {
        const id = Date.now() + index;
        const p = document.createElement('p');
        p.textContent = text.trim();
        const sourceHTML = p.outerHTML;
        p.setAttribute('data-lingua-id', String(id));
        tempDoc.appendChild(p);
        return {
            id,
            source: sourceHTML,
            target: '',
            status: 'draft' as const,
        };
    }).filter(segment => stripHtml(segment.source).trim() !== ''); // Ensure no empty segments
    
    const sourceDocumentHtml = tempDoc.innerHTML;

    return { sourceDocumentHtml, segments: newSegments };
};


export const parseDocxForProject = async (
    file: File,
    segmentationPrompt: string,
    model: string
): Promise<{ sourceDocumentHtml: string, segments: Segment[] }> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Extract raw text for AI segmentation
    const rawText = doc.body.textContent || '';
    
    let parsedSegments: string[] = [];
    if (rawText.trim()) {
        const { data: sentences } = await apiSegmentText(rawText, segmentationPrompt, model);
        parsedSegments = sentences;
    }

    // Build new segments and a new sourceDocumentHtml from the AI's response,
    // ensuring a clean, well-segmented structure.
    const tempDoc = document.createElement('body');
    const newSegments: Segment[] = parsedSegments.map((text, index) => {
        const id = Date.now() + index;
        const p = document.createElement('p');
        p.textContent = text.trim();
        const sourceHTML = p.outerHTML;
        p.setAttribute('data-lingua-id', String(id));
        tempDoc.appendChild(p);
        return {
            id,
            source: sourceHTML,
            target: '',
            status: 'draft' as const,
        };
    }).filter(segment => stripHtml(segment.source).trim() !== ''); // Ensure no empty segments
    
    const sourceDocumentHtml = tempDoc.innerHTML;

    return { sourceDocumentHtml, segments: newSegments };
};


export const parseTermDb = (jsonlText: string): TermUnit[] => {
    if (!jsonlText.trim()) return [];
    
    return jsonlText
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
};

export const loadProjectFile = (file: File): Promise<ProjectState> => {
    return new Promise((resolve, reject) => {
        if (!file.name.endsWith('.lingua')) {
            return reject(new Error(STRINGS.UNSUPPORTED_FILE_TYPE));
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const result = event.target?.result;
                if (typeof result !== 'string') {
                    return reject(new Error(STRINGS.ERROR_FAILED_TO_READ_PROJECT_FILE));
                }
                const projectState: ProjectState = JSON.parse(result);

                // --- Backwards Compatibility & Sanitization ---
                if (projectState.project && !projectState.project.translationMemories) {
                    projectState.project.translationMemories = [];
                }
                if (projectState.project && !projectState.project.termDatabases) {
                    projectState.project.termDatabases = [];
                }
                if (projectState.settings && !projectState.settings.model) {
                    projectState.settings.model = 'gemini-2.5-flash';
                }
                // @ts-ignore - Check for and remove obsolete termBase data
                if (projectState.data && projectState.data.termBase) {
                    // @ts-ignore
                    delete projectState.data.termBase;
                }

                // Basic validation to ensure it's a valid project file
                if (
                    projectState.version &&
                    projectState.appName === 'LinguaSync' &&
                    projectState.project &&
                    projectState.data &&
                    Array.isArray(projectState.data.segments) &&
                    projectState.session &&
                    projectState.settings &&
                    projectState.settings.prompts &&
                    projectState.settings.model
                ) {
                    resolve(projectState);
                } else {
                    reject(new Error(STRINGS.ERROR_INVALID_PROJECT_FILE));
                }
            } catch (error) {
                console.error("Error parsing project file:", error);
                reject(new Error(STRINGS.ERROR_FAILED_TO_PARSE_PROJECT_FILE));
            }
        };
        reader.onerror = () => {
            reject(new Error(STRINGS.ERROR_FAILED_TO_READ_PROJECT_FILE));
        };
        reader.readAsText(file);
    });
};


// --- EXPORT FUNCTIONS ---

const convertUnitsToJsonL = (units: TranslationUnit[] | TermUnit[]): string => {
    if (units.length === 0) {
        return '';
    }
    return units.map(unit => JSON.stringify(unit)).join('\n');
}

export const exportTermDb = (terms: Term[]): string => {
    const termUnits: TermUnit[] = terms.map(({ source, target, definition }) => ({
        source,
        target,
        ...(definition && { definition }),
    }));
    return convertUnitsToJsonL(termUnits);
};

export const exportProjectFile = (state: ProjectState, fileName: string): void => {
    const stateToSave = JSON.parse(JSON.stringify(state));
    // Don't save the full base64 source file inside the project file if we have the structured HTML.
    if (stateToSave.sourceDocumentHtml) {
        delete stateToSave.sourceFile;
    }
    const projectJson = JSON.stringify(stateToSave, null, 2);
    const blob = new Blob([projectJson], { type: 'application/json;charset=utf-8' });
    saveAs(blob, fileName);
};

export const exportTranslationMemory = (segments: Segment[]): string => {
    const translationUnits = segments
        .filter(segment => stripHtml(segment.target).trim() !== '')
        .map(segment => ({
            source: stripHtml(segment.source),
            target: stripHtml(segment.target),
        }));
    return convertUnitsToJsonL(translationUnits);
};

export const exportTmUnits = (units: TranslationUnit[]): string => {
    return convertUnitsToJsonL(units);
};

export const exportTmUnitsToFile = (units: TranslationUnit[], fileName: string): void => {
    const content = exportTmUnits(units);
    const blob = new Blob([content], { type: 'application/jsonl;charset=utf-8' });
    saveAs(blob, fileName);
};

export const getDocxXmlContent = async (base64Docx: string): Promise<string> => {
    const zip = await new JSZip().loadAsync(base64Docx, { base64: true });
    
    const docFile = zip.file("word/document.xml");
    if (!docFile) {
        throw new Error("word/document.xml not found in the source docx file.");
    }

    const xmlString = await docFile.async("string");
    return xmlString;
};

export const downloadModifiedDocx = async (base64Docx: string, newXmlContent: string, newFileName: string): Promise<void> => {
    const zip = await new JSZip().loadAsync(base64Docx, { base64: true });
    zip.file("word/document.xml", newXmlContent);
    const blob = await zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    saveAs(blob, newFileName);
};

export const rebuildDocx = async (
    base64Docx: string,
    projectState: ProjectState,
    onProgressUpdate: (message: string) => void,
    withApiTracking: <T>(apiCall: () => Promise<ApiResponse<T>>) => Promise<T>
): Promise<void> => {
    onProgressUpdate('Starting DOCX rebuild process...');
    
    const xmlString = await getDocxXmlContent(base64Docx);
    onProgressUpdate("Extracted original document.xml. Preparing data for AI...");

    const projectStateJson = JSON.stringify(projectState, null, 2);
    
    onProgressUpdate("Sending full document XML and translation data to Gemini...");

    const { rebuiltXml, rawResponse } = await withApiTracking(() => getRebuiltDocumentXml(
        xmlString,
        projectStateJson,
        projectState.settings.prompts.rebuildTranslation,
        projectState.settings.model
    ));

    onProgressUpdate("Received rebuilt XML from AI. Raw response logged below.");
    onProgressUpdate(rawResponse);

    const finalXml = rebuiltXml.startsWith('<?xml') ? rebuiltXml : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` + rebuiltXml;
    
    onProgressUpdate("Repackaging translated DOCX file...");
    const finalFileName = (projectState.project.name || 'document').replace(/\.docx$/, '_rebuilt.docx');
    await downloadModifiedDocx(base64Docx, finalXml, finalFileName);
    onProgressUpdate(`Download initiated as ${finalFileName}. Process complete.`);
};


// --- RENDER FINAL DOCUMENT ---
export const getReconstructedBodyHtml = (sourceDocumentHtml: string | undefined, segments: Segment[]): string => {
    if (!sourceDocumentHtml) {
        // Fallback for older projects, though web projects should always have this.
        return segments.map(s => (stripHtml(s.target).trim() ? s.target : s.source)).join('\n');
    }
    const doc = new DOMParser().parseFromString(sourceDocumentHtml, 'text/html');
    segments.forEach(segment => {
        const el = doc.querySelector(`[data-lingua-id="${segment.id}"]`);
        if (el) {
            if (stripHtml(segment.target).trim()) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = segment.target;
                if (tempDiv.firstChild) {
                    el.replaceWith(tempDiv.firstChild);
                }
            } else {
                // If target is empty, we leave the source, but need to remove the data-attribute for clean export.
                el.removeAttribute('data-lingua-id');
            }
        }
    });
    return doc.body.innerHTML;
};

const getFinalHtml = (state: ProjectState): string => {
    // If we have the structured HTML, use it for high-fidelity reconstruction.
    if (state.sourceDocumentHtml) {
        return getReconstructedBodyHtml(state.sourceDocumentHtml, state.data.segments);
    }

    // Fallback for older projects without structured HTML.
    return state.data.segments.map(s => (stripHtml(s.target).trim() ? s.target : s.source)).join('\n');
}


// --- DOCX EXPORT HELPERS ---

const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: 450, height: 300 }); // Fallback
        img.src = src;
    });
};

const parseNodeToRuns = async (node: Node, styles: any = {}): Promise<(TextRun | ImageRun)[]> => {
    const runs: (TextRun | ImageRun)[] = [];

    if (node.nodeType === Node.TEXT_NODE) {
        // Preserve whitespace nodes
        if (node.textContent) {
            runs.push(new TextRun({ ...styles, text: node.textContent }));
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const newStyles = { ...styles };

        switch (element.tagName.toLowerCase()) {
            case 'strong': case 'b': newStyles.bold = true; break;
            case 'em': case 'i': newStyles.italics = true; break;
            case 'u': newStyles.underline = {}; break;
            case 'sup': newStyles.superScript = true; break;
            case 'sub': newStyles.subScript = true; break;
            case 'br': runs.push(new TextRun({ break: 1 })); return runs;
            case 'img':
                const src = element.getAttribute('src');
                if (src && src.startsWith('data:image/')) {
                    const { width, height } = await getImageDimensions(src);
                    
                    const mimeTypeMatch = src.match(/^data:image\/(jpeg|png|gif|bmp|svg\+xml);base64,/);
                    const base64Data = src.split(',')[1];
            
                    if (base64Data && mimeTypeMatch) {
                        let imageType = mimeTypeMatch[1];
                        if (imageType === 'svg\+xml') {
                            imageType = 'svg';
                        }
                        if (imageType === 'jpeg') {
                            imageType = 'jpg';
                        }
            
                        const maxWidth = 450;
                        const finalWidth = Math.min(width, maxWidth);
                        const finalHeight = (finalWidth / width) * height;
            
                        if (imageType === 'svg') {
                            const svgContent = b64DecodeUnicode(base64Data);
                            // Provide a placeholder fallback for SVGs to satisfy the type.
                            // A 1x1 transparent PNG.
                            const fallbackPngB64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
                            const fallbackData = base64ToUint8Array(fallbackPngB64);

                            runs.push(new ImageRun({
                                type: "svg",
                                data: svgContent,
                                transformation: {
                                    width: finalWidth,
                                    height: finalHeight,
                                },
                                fallback: {
                                    data: fallbackData,
                                    transformation: {
                                        width: 1,
                                        height: 1,
                                    },
                                },
                            }));
                        } else {
                             runs.push(new ImageRun({
                                type: imageType as 'jpg' | 'png' | 'gif' | 'bmp',
                                data: base64ToUint8Array(base64Data),
                                transformation: {
                                    width: finalWidth,
                                    height: finalHeight,
                                },
                            }));
                        }
                    }
                }
                return runs;
        }

        for (const child of Array.from(element.childNodes)) {
            const childRuns = await parseNodeToRuns(child, newStyles);
            runs.push(...childRuns);
        }
    }
    return runs;
};

const parseHtmlToDocx = async (html: string): Promise<(Paragraph | Table)[]> => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const topElement = tempDiv.firstChild as HTMLElement;

    if (!topElement || topElement.nodeType !== Node.ELEMENT_NODE) {
        const runs = await parseNodeToRuns(tempDiv, {});
        return runs.length > 0 ? [new Paragraph({ children: runs, style: 'default' })] : [];
    }
    
    if (topElement.tagName.toLowerCase() === 'table') {
        const rows: TableRow[] = [];
        const htmlRows = Array.from(topElement.querySelectorAll('tr'));
        
        for (const htmlRow of htmlRows) {
            const cells: TableCell[] = [];
            const htmlCells = Array.from(htmlRow.querySelectorAll('td, th'));
            
            for (const htmlCell of htmlCells) {
                const cellParagraphs = await parseHtmlToDocx(htmlCell.innerHTML);
                cells.push(new TableCell({
                    children: cellParagraphs.length > 0 ? cellParagraphs : [new Paragraph('')],
                    shading: htmlCell.tagName === 'TH' ? { fill: "F2F2F2" } : undefined,
                }));
            }
            rows.push(new TableRow({ children: cells }));
        }
        return [new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }})];
    }

    let headingLevel;
    let bullet = undefined;
    
    switch (topElement.tagName.toLowerCase()) {
        case 'h1': headingLevel = HeadingLevel.HEADING_1; break;
        case 'h2': headingLevel = HeadingLevel.HEADING_2; break;
        case 'h3': headingLevel = HeadingLevel.HEADING_3; break;
        case 'h4': headingLevel = HeadingLevel.HEADING_4; break;
        case 'h5': headingLevel = HeadingLevel.HEADING_5; break;
        case 'h6': headingLevel = HeadingLevel.HEADING_6; break;
        case 'li': bullet = { level: 0 }; break;
    }

    const runs: (TextRun | ImageRun)[] = [];
    for(const child of Array.from(topElement.childNodes)) {
        const childRuns = await parseNodeToRuns(child, {});
        runs.push(...childRuns);
    }
    
    if (runs.some(r => r instanceof ImageRun) || (topElement.textContent && topElement.textContent.trim() !== '')) {
        return [new Paragraph({
            children: runs,
            heading: headingLevel,
            bullet: bullet,
            style: 'default'
        })];
    }

    return [];
};


export const exportToDocx = async (state: ProjectState, fileName: string, fullFileNameOverride?: string): Promise<void> => {
    const finalHtml = getFinalHtml(state);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = finalHtml;

    // Process all top-level nodes from the reconstructed HTML body, not just specific tags.
    const finalBodyNodes = Array.from(tempDiv.childNodes);

    const docxElementsNested = await Promise.all(finalBodyNodes.map(node => {
        let htmlContent = '';
        if (node.nodeType === Node.ELEMENT_NODE) {
            htmlContent = (node as HTMLElement).outerHTML;
        } else if (node.nodeType === Node.TEXT_NODE) {
            htmlContent = node.textContent || '';
        }

        // Only process nodes that have actual content.
        if (htmlContent.trim()) {
            return parseHtmlToDocx(htmlContent);
        }
        
        // For comments, empty text nodes, etc., return an empty array.
        return Promise.resolve([]);
    }));
    const docxElements = docxElementsNested.flat();

    const doc = new Document({
        styles: {
            paragraphStyles: [{
                id: 'default',
                name: 'Default',
                basedOn: 'Normal',
                next: 'Normal',
                run: { size: 24 },
            }],
        },
        sections: [{
            children: docxElements,
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, fullFileNameOverride || `${fileName}_translated.docx`);
};

export const exportToDocxAdvanced = async (base64Docx: string, segments: Segment[], fileName: string): Promise<void> => {
    const xmlString = await getDocxXmlContent(base64Docx);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");

    const paragraphs = Array.from(xmlDoc.getElementsByTagName('w:p'));
    
    const pMap = new Map<string, Element[]>();
    paragraphs.forEach(p => {
        const text = (p.textContent || "").trim().replace(/\s+/g, ' ');
        if (text) {
            if (!pMap.has(text)) {
                pMap.set(text, []);
            }
            pMap.get(text)!.push(p);
        }
    });

    for (const segment of segments) {
        const sourceText = stripHtml(segment.source).trim().replace(/\s+/g, ' ');
        const targetText = stripHtml(segment.target).trim();

        if (!targetText || !sourceText) continue;

        const matchingPs = pMap.get(sourceText);
        if (matchingPs && matchingPs.length > 0) {
            const pToModify = matchingPs.shift(); 
            
            if(pToModify) {
                const textNodes = Array.from(pToModify.getElementsByTagName('w:t'));
                if (textNodes.length > 0) {
                    textNodes[0].textContent = targetText;
                    for (let i = 1; i < textNodes.length; i++) {
                        textNodes[i].textContent = '';
                    }
                }
            }
        }
    }

    const serializer = new XMLSerializer();
    const newXmlString = serializer.serializeToString(xmlDoc.documentElement);
    const finalXml = newXmlString.startsWith('<?xml') ? newXmlString : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` + newXmlString;

    await downloadModifiedDocx(base64Docx, finalXml, fileName);
};

export const exportToPdf = async (state: ProjectState, fileName:string): Promise<void> => {
    const fullHtml = getFinalHtml(state);

    const contentWrapper = document.createElement('div');
    contentWrapper.innerHTML = fullHtml;

    // Apply styles for a document-like appearance and hide it from view
    contentWrapper.style.position = 'fixed';
    contentWrapper.style.left = '-9999px';
    contentWrapper.style.top = '0';
    contentWrapper.style.zIndex = '-1';
    contentWrapper.style.fontFamily = 'Georgia, serif';
    contentWrapper.style.lineHeight = '1.7';
    contentWrapper.style.color = '#333';
    contentWrapper.style.width = '210mm';
    contentWrapper.style.padding = '20mm';
    contentWrapper.style.boxSizing = 'border-box';
    contentWrapper.style.background = 'white';

    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        h1, h2, h3, h4, h5, h6 {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-weight: bold; line-height: 1.3; margin-top: 1.5em; margin-bottom: 0.5em;
        }
        img { max-width: 100%; height: auto; margin: 1.2em 0; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 1em; page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f7f7f7; }
        ul, ol { page-break-before: auto; }
        li { page-break-inside: avoid; }
    `;
    contentWrapper.prepend(styleSheet);
    
    // Temporarily add to DOM for rendering, then generate PDF and remove it.
    document.body.appendChild(contentWrapper);

    try {
        await html2pdf().from(contentWrapper).set({
            margin: 0,
            filename: `${fileName}_translated.pdf`,
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).save();
    } catch (err) {
        console.error("Failed to generate PDF:", err);
        alert(STRINGS.ERROR_EXPORT_FAILED('PDF', err instanceof Error ? err.message : 'Unknown error'));
    } finally {
        if (document.body.contains(contentWrapper)) {
            document.body.removeChild(contentWrapper);
        }
    }
};

export const exportToSrt = (segments: Segment[], fileName: string): void => {
    const srtContent = segments
        .map((segment, index) => {
            const hasTimestamp = typeof segment.startTime === 'number' && typeof segment.endTime === 'number';
            if (!hasTimestamp) return null;

            const text = stripHtml(segment.target.trim() || segment.source.trim());
            if (!text) return null;

            const startTime = secondsToSrtTime(segment.startTime!);
            const endTime = secondsToSrtTime(segment.endTime!);
            
            return `${index + 1}\n${startTime} --> ${endTime}\n${text}\n`;
        })
        .filter(Boolean)
        .join('\n');

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${fileName}_translated.srt`);
};

export const exportToHtml = (state: ProjectState, fileName: string): void => {
    if (!state.sourceFile?.content || !state.sourceDocumentHtml) {
        throw new Error("Cannot export HTML: Original source file content or segmented document HTML is missing.");
    }
    
    // 1. Get original full HTML to extract head and html attributes
    const base64Content = state.sourceFile.content.split(',')[1];
    if (!base64Content) throw new Error("Invalid source file content format.");
    const originalHtmlString = b64DecodeUnicode(base64Content);
    const originalDoc = new DOMParser().parseFromString(originalHtmlString, 'text/html');

    // 2. Get the translated body content
    const translatedBodyHtml = getReconstructedBodyHtml(state.sourceDocumentHtml, state.data.segments);

    // 3. Reconstruct the full document
    originalDoc.body.innerHTML = translatedBodyHtml;
    
    // 4. Serialize and save
    const finalHtml = `<!DOCTYPE html>\n` + originalDoc.documentElement.outerHTML;
    const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `${fileName}_translated.html`);
};