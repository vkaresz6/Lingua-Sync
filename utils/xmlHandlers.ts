import { TermUnit, TranslationUnit } from '../types';

const escapeXml = (unsafe: string): string => {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
};

// --- TMX (Translation Memory) ---

export const serializeTmx = (units: TranslationUnit[], sourceLang: string, targetLang: string): string => {
    const tus = units.map(unit => `
    <tu>
      <tuv xml:lang="${escapeXml(sourceLang)}">
        <seg>${escapeXml(unit.source)}</seg>
      </tuv>
      <tuv xml:lang="${escapeXml(targetLang)}">
        <seg>${escapeXml(unit.target)}</seg>
      </tuv>
    </tu>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<tmx version="1.4">
  <header creationtool="LinguaSync" datatype="xml" segtype="sentence" adminlang="en" srclang="${escapeXml(sourceLang)}"/>
  <body>${tus}
  </body>
</tmx>`;
};

export const parseTmx = (xmlString: string): TranslationUnit[] => {
    const units: TranslationUnit[] = [];
    if (!xmlString.trim()) return units;
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    
    const tuNodes = doc.querySelectorAll('tu');
    tuNodes.forEach(tu => {
        const tuvs = tu.querySelectorAll('tuv');
        if (tuvs.length >= 2) {
            // A simple implementation assuming the first tuv is source and the second is target.
            const sourceSeg = tuvs[0].querySelector('seg');
            const targetSeg = tuvs[1].querySelector('seg');
            if (sourceSeg?.textContent && targetSeg?.textContent) {
                units.push({
                    source: sourceSeg.textContent,
                    target: targetSeg.textContent,
                });
            }
        }
    });
    return units;
};


// --- TBX (Terminology Base) ---

export const serializeTbx = (terms: TermUnit[], sourceLang: string, targetLang: string): string => {
    const termEntries = terms.map(term => {
        const definitionPart = term.definition ? `
    <descrip type="definition">${escapeXml(term.definition)}</descrip>` : '';
        return `
  <termEntry>
    <langSet xml:lang="${escapeXml(sourceLang)}">
      <tig><term>${escapeXml(term.source)}</term></tig>
    </langSet>
    <langSet xml:lang="${escapeXml(targetLang)}">
      <tig><term>${escapeXml(term.target)}</term></tig>
    </langSet>${definitionPart}
  </termEntry>`;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<martif type="TBX-Basic">
  <martifHeader>
    <fileDesc>
      <titleStmt><title>LinguaSync Terminology</title></titleStmt>
      <sourceDesc><p>Created with LinguaSync</p></sourceDesc>
    </fileDesc>
  </martifHeader>
  <text>
    <body>${termEntries}
    </body>
  </text>
</martif>`;
};

export const parseTbx = (xmlString: string): TermUnit[] => {
    const terms: TermUnit[] = [];
    if (!xmlString.trim()) return terms;
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');

    const termEntries = doc.querySelectorAll('termEntry');
    termEntries.forEach(entry => {
        const langSets = entry.querySelectorAll('langSet');
        const definitionNode = entry.querySelector('descrip[type="definition"]');
        
        if (langSets.length >= 2) {
            // A simple implementation assuming the first langSet is source and the second is target.
            const sourceTermNode = langSets[0].querySelector('term');
            const targetTermNode = langSets[1].querySelector('term');
            
            if (sourceTermNode?.textContent && targetTermNode?.textContent) {
                terms.push({
                    source: sourceTermNode.textContent,
                    target: targetTermNode.textContent,
                    definition: definitionNode?.textContent || undefined,
                });
            }
        }
    });
    return terms;
};
