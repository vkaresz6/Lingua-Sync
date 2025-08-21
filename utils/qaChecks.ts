


import { Segment, Term, QaIssue } from '../types';
import { stripHtml } from './fileHandlers';

const findNumbers = (text: string): string[] => {
    return text.match(/\d+(\.\d+)?/g) || [];
};

const findTags = (html: string): string[] => {
    return html.match(/<[^>]+>/g) || [];
}

export const runQaChecks = (segments: Segment[], terms: Term[]): QaIssue[] => {
    const issues: QaIssue[] = [];
    const translationMap = new Map<string, string[]>(); // source -> list of targets

    // First pass: populate map for inconsistency checks
    segments.forEach(seg => {
        const sourceText = stripHtml(seg.source);
        const targetText = stripHtml(seg.target);
        if (sourceText && targetText) {
            if (!translationMap.has(sourceText)) {
                translationMap.set(sourceText, []);
            }
            translationMap.get(sourceText)!.push(targetText);
        }
    });

    segments.forEach((segment, index) => {
        const sourceText = stripHtml(segment.source);
        const targetText = stripHtml(segment.target);

        // 1. Empty Translation Check
        if (sourceText.trim() && !targetText.trim()) {
            issues.push({
                segmentId: segment.id,
                type: 'EMPTY_TRANSLATION',
                description: 'The target segment is empty.',
                source: segment.source,
                target: segment.target,
            });
        }

        if (!targetText.trim()) return; // Skip other checks if target is empty

        // 2. Inconsistent Translation Check
        const translationsForSource = translationMap.get(sourceText);
        if (translationsForSource && new Set(translationsForSource).size > 1) {
            const isDuplicate = issues.some(i => i.type === 'INCONSISTENT_TRANSLATION' && stripHtml(i.source) === sourceText);
            if (!isDuplicate) {
                 issues.push({
                    segmentId: segment.id,
                    type: 'INCONSISTENT_TRANSLATION',
                    description: `The source segment is translated inconsistently across the document. Found translations: [${[...new Set(translationsForSource)].join(' | ')}]`,
                    source: segment.source,
                    target: segment.target,
                });
            }
        }

        // 3. Terminology Mismatch Check
        terms.forEach(term => {
            const sourceLower = sourceText.toLowerCase();
            const targetLower = targetText.toLowerCase();
            const termSourceLower = term.source.toLowerCase();
            const termTargetLower = term.target.toLowerCase();

            if (sourceLower.includes(termSourceLower) && !targetLower.includes(termTargetLower)) {
                 issues.push({
                    segmentId: segment.id,
                    type: 'TERM_MISMATCH',
                    description: `The source term "${term.source}" was found, but the target term "${term.target}" is missing in the translation.`,
                    source: segment.source,
                    target: segment.target,
                    suggestion: `Ensure "${term.target}" is used.`
                });
            }
        });

        // 4. Tag Mismatch Check (REMOVED AS PER REQUEST)
        // const sourceTags = findTags(segment.source);
        // const targetTags = findTags(segment.target);
        // if (sourceTags.length !== targetTags.length) {
        //     issues.push({
        //         segmentId: segment.id,
        //         type: 'TAG_MISMATCH',
        //         description: `Tag mismatch: Source has ${sourceTags.length} tags, but target has ${targetTags.length} tags.`,
        //         source: segment.source,
        //         target: segment.target,
        //         suggestion: 'Check for missing or extra formatting tags.'
        //     });
        // }

        // 5. Number Mismatch Check
        const sourceNumbers = findNumbers(sourceText);
        const targetNumbers = findNumbers(targetText);
        if (sourceNumbers.length > 0 && sourceNumbers.join(',') !== targetNumbers.join(',')) {
             issues.push({
                segmentId: segment.id,
                type: 'NUMBER_MISMATCH',
                description: `Number mismatch: Source numbers (${sourceNumbers.join(', ')}) do not match target numbers (${targetNumbers.join(', ')}).`,
                source: segment.source,
                target: segment.target,
            });
        }
        
        // 6. Spacing Error Check
        if (targetText) {
            const cleanText = targetText.trim();
            const hasLeadingOrTrailingSpace = targetText.length > cleanText.length;
            const hasInternalDoubleSpaces = /\s{2,}/.test(cleanText);
    
            if (hasLeadingOrTrailingSpace || hasInternalDoubleSpaces) {
                let descriptions = [];
                if (hasLeadingOrTrailingSpace) descriptions.push('leading/trailing spaces');
                if (hasInternalDoubleSpaces) descriptions.push('double spaces');
                
                const description = `Spacing issue found: ${descriptions.join(' and ')}.`;
                const suggestedFix = `<p>${targetText.trim().replace(/\s{2,}/g, ' ')}</p>`;
                
                issues.push({
                    segmentId: segment.id,
                    type: 'SPACING_ERROR',
                    description: description,
                    source: segment.source,
                    target: segment.target,
                    suggestion: 'Remove extra whitespace.',
                    suggestedFix: suggestedFix,
                });
            }
        }
    });

    return issues;
};