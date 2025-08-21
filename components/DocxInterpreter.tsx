

import React, { useMemo } from 'react';

interface DocxInterpreterProps {
    xmlString: string;
}

const parseRunProperties = (rPr: Element | null): React.CSSProperties => {
    const styles: React.CSSProperties = {};
    if (!rPr) return styles;

    if (rPr.querySelector('b')) styles.fontWeight = 'bold';
    if (rPr.querySelector('i')) styles.fontStyle = 'italic';
    if (rPr.querySelector('u')) {
        const u = rPr.querySelector('u');
        const val = u?.getAttribute('w:val');
        if (val && val !== 'none') {
             styles.textDecoration = 'underline';
        }
    }
    const color = rPr.querySelector('color');
    if (color) {
        const val = color.getAttribute('w:val');
        if (val && val !== 'auto') {
            styles.color = `#${val}`;
        }
    }
    
    return styles;
};

const parseParagraphProperties = (pPr: Element | null): { style: React.CSSProperties; as: keyof JSX.IntrinsicElements } => {
    const result: { style: React.CSSProperties; as: keyof JSX.IntrinsicElements } = { style: { margin: '0 0 1em 0' }, as: 'p' };
    if (!pPr) return result;

    const pStyle = pPr.querySelector('pStyle');
    const styleVal = pStyle?.getAttribute('w:val');
    if (styleVal?.toLowerCase().startsWith('heading')) {
        const level = parseInt(styleVal.replace(/heading/i, ''), 10);
        if (level >= 1 && level <= 6) {
            result.as = `h${level}` as keyof JSX.IntrinsicElements;
            if (level === 1) { result.style.fontSize = '2em'; result.style.fontWeight = 'bold'; }
            if (level === 2) { result.style.fontSize = '1.5em'; result.style.fontWeight = 'bold'; }
            if (level === 3) { result.style.fontSize = '1.17em'; result.style.fontWeight = 'bold'; }
            if (level === 4) { result.style.fontSize = '1em'; result.style.fontWeight = 'bold'; }
        }
    }

    const jc = pPr.querySelector('jc');
    const align = jc?.getAttribute('w:val');
    if (align) {
        result.style.textAlign = align as 'left' | 'right' | 'center' | 'justify';
    }

    return result;
};


const renderNode = (node: Node, key: string | number): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
    }

    const element = node as Element;
    const children = Array.from(element.childNodes).map((child, index) => renderNode(child, `${key}-${index}`));

    switch (element.nodeName) {
        case 'w:body':
            return <div key={key}>{children}</div>;
        case 'w:p': {
            const pPr = element.querySelector(':scope > pPr');
            const { style, as: As } = parseParagraphProperties(pPr);
            return <As key={key} style={style}>{children}</As>;
        }
        case 'w:r': {
            const rPr = element.querySelector(':scope > rPr');
            const style = parseRunProperties(rPr);
            return <span key={key} style={style}>{children}</span>;
        }
        case 'w:t':
            // preserve spaces
            const space = element.getAttribute('xml:space');
            if (space === 'preserve') {
                return <span key={key} style={{ whiteSpace: 'pre-wrap' }}>{children}</span>
            }
            return <React.Fragment key={key}>{children}</React.Fragment>;
        case 'w:tbl':
            return <table key={key} style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #ccc' }}><tbody>{children}</tbody></table>;
        case 'w:tr':
            return <tr key={key}>{children}</tr>;
        case 'w:tc':
            return <td key={key} style={{ border: '1px solid #ccc', padding: '8px' }}>{children}</td>;
        case 'w:br':
            return <br key={key} />;
        
        case 'w:pPr':
        case 'w:rPr':
             return null; // Properties are handled by parent.

        default:
            return <React.Fragment key={key}>{children}</React.Fragment>;
    }
};

export const DocxInterpreter: React.FC<DocxInterpreterProps> = ({ xmlString }) => {
    const interpretedContent = useMemo(() => {
        if (!xmlString || typeof DOMParser === 'undefined') {
            return null;
        }
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "application/xml");
            
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                console.error("XML Parse Error:", parseError.textContent);
                return <p className="text-red-500">Failed to parse document XML.</p>;
            }

            const body = xmlDoc.querySelector('body');
            if (!body) return <p>Could not find body tag in document.xml</p>;
            
            return renderNode(body, 'root');
        } catch (error) {
            console.error("Error interpreting DOCX XML:", error);
            return <p className="text-red-500">Error interpreting DOCX XML. See console for details.</p>;
        }
    }, [xmlString]);

    return (
        <div className="p-6 bg-white text-black font-serif text-base leading-relaxed doc-preview-interpreter">
            {interpretedContent}
            <style>{`
                .doc-preview-interpreter table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 1em;
                }
                .doc-preview-interpreter th, .doc-preview-interpreter td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                .doc-preview-interpreter th {
                    background-color: #f7f7f7;
                }
                .doc-preview-interpreter p, .doc-preview-interpreter h1, .doc-preview-interpreter h2, .doc-preview-interpreter h3, .doc-preview-interpreter h4 {
                    margin-bottom: 1em;
                }
            `}</style>
        </div>
    );
};