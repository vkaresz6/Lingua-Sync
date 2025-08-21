import JSZip, { type JSZipObject } from 'jszip';
import { TranslationUnit } from '../types';
import { STRINGS } from '../strings';

export const parseMqxlz = async (file: File): Promise<TranslationUnit[]> => {
    const jszip = new JSZip();
    const zip = await jszip.loadAsync(file);

    const mqxliffFile = (Object.values(zip.files) as JSZipObject[]).find(f => !f.dir && f.name.endsWith('.mqxliff'));
    if (!mqxliffFile) {
        throw new Error(STRINGS.ERROR_NO_MQXLIFF_IN_ARCHIVE);
    }

    const xmlText = await mqxliffFile.async('string');
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');

    const errorNode = doc.querySelector('parsererror');
    if (errorNode) {
        throw new Error(STRINGS.ERROR_XML_PARSING(errorNode.textContent || ''));
    }

    const units: TranslationUnit[] = [];
    const transUnits = doc.querySelectorAll('trans-unit');

    transUnits.forEach(unit => {
        const sourceNode = unit.querySelector('source');
        const targetNode = unit.querySelector('target');

        if (sourceNode && targetNode) {
            // Note: MemoQ can store complex HTML-like structures inside. For simplicity,
            // we'll extract text content. A more robust solution would parse these structures.
            const source = sourceNode.textContent?.trim() || '';
            const target = targetNode.textContent?.trim() || '';

            if (source && target) {
                units.push({ source, target });
            }
        }
    });

    return units;
};