import { ProjectState } from '../types';
import { stripHtml } from './fileHandlers';

const countWords = (html: string): number => {
    if (!html) return 0;
    const text = stripHtml(html).trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
};

const countChars = (html: string): number => {
    if (!html) return 0;
    return stripHtml(html).length;
};

const countTags = (html: string): number => {
    if (!html) return 0;
    return (html.match(/<[^>]+>/g) || []).length;
};

interface CountRow {
    type: string;
    segments: number;
    sourceWords: number;
    sourceChars: number;
    sourceTags: number;
    percentage: number;
    targetWords: number;
    targetChars: number;
    targetTags: number;
}

interface AnalysisRow {
    type: string;
    segments: number;
    sourceWords: number;
    weightedWords: number;
    sourceChars: number;
    weightedChars: number;
    sourceTags: number;
    percentage: number;
}

const newCountRow = (type: string): CountRow => ({
    type, segments: 0, sourceWords: 0, sourceChars: 0, sourceTags: 0,
    percentage: 0, targetWords: 0, targetChars: 0, targetTags: 0,
});

const newAnalysisRow = (type: string): AnalysisRow => ({
    type, segments: 0, sourceWords: 0, weightedWords: 0, sourceChars: 0,
    weightedChars: 0, sourceTags: 0, percentage: 0,
});


export const generateStatisticsReport = (projectState: ProjectState, allTmMatches: Record<number, { score: number }>) => {
    const { segments } = projectState.data;

    // --- Counts Report ---
    const countsReport: Record<string, CountRow> = {
        'Total': newCountRow('Összes'),
        'Repetition': newCountRow('Ismétlődés'),
        'Pre-translated': newCountRow('Előfordított'), // Using this for 100% TM matches
        'Untranslated': newCountRow('Megkezdetlen'),
        'Edited': newCountRow('Szerkesztett'),
        'Translator approved': newCountRow('Fordító jóváhagyta'),
    };

    const sourceRepetitionMap = new Map<string, number[]>();
    segments.forEach(seg => {
        const sourceText = stripHtml(seg.source);
        if (!sourceRepetitionMap.has(sourceText)) {
            sourceRepetitionMap.set(sourceText, []);
        }
        sourceRepetitionMap.get(sourceText)!.push(seg.id);
    });

    segments.forEach(seg => {
        const sWords = countWords(seg.source);
        const sChars = countChars(seg.source);
        const sTags = countTags(seg.source);
        const tWords = countWords(seg.target);
        const tChars = countChars(seg.target);
        const tTags = countTags(seg.target);

        // Add to total
        countsReport['Total'].segments++;
        countsReport['Total'].sourceWords += sWords;
        countsReport['Total'].sourceChars += sChars;
        countsReport['Total'].sourceTags += sTags;
        countsReport['Total'].targetWords += tWords;
        countsReport['Total'].targetChars += tChars;
        countsReport['Total'].targetTags += tTags;

        // Categorize for Counts
        const sourceText = stripHtml(seg.source);
        if (sourceRepetitionMap.get(sourceText)!.length > 1) {
            countsReport['Repetition'].segments++;
            countsReport['Repetition'].sourceWords += sWords;
            countsReport['Repetition'].sourceChars += sChars;
            countsReport['Repetition'].sourceTags += sTags;
            countsReport['Repetition'].targetWords += tWords;
            countsReport['Repetition'].targetChars += tChars;
            countsReport['Repetition'].targetTags += tTags;
        }
        if (!stripHtml(seg.target).trim()) {
            countsReport['Untranslated'].segments++;
            countsReport['Untranslated'].sourceWords += sWords;
            countsReport['Untranslated'].sourceChars += sChars;
            countsReport['Untranslated'].sourceTags += sTags;
        } else {
            if (seg.translationSource === 'tm-100') {
                 countsReport['Pre-translated'].segments++;
                 countsReport['Pre-translated'].sourceWords += sWords;
                 countsReport['Pre-translated'].sourceChars += sChars;
                 countsReport['Pre-translated'].sourceTags += sTags;
                 countsReport['Pre-translated'].targetWords += tWords;
                 countsReport['Pre-translated'].targetChars += tChars;
                 countsReport['Pre-translated'].targetTags += tTags;
            } else if (seg.evaluation) { // Approved
                 countsReport['Translator approved'].segments++;
                 countsReport['Translator approved'].sourceWords += sWords;
                 countsReport['Translator approved'].sourceChars += sChars;
                 countsReport['Translator approved'].sourceTags += sTags;
                 countsReport['Translator approved'].targetWords += tWords;
                 countsReport['Translator approved'].targetChars += tChars;
                 countsReport['Translator approved'].targetTags += tTags;
            } else { // Edited but not yet approved
                 countsReport['Edited'].segments++;
                 countsReport['Edited'].sourceWords += sWords;
                 countsReport['Edited'].sourceChars += sChars;
                 countsReport['Edited'].sourceTags += sTags;
                 countsReport['Edited'].targetWords += tWords;
                 countsReport['Edited'].targetChars += tChars;
                 countsReport['Edited'].targetTags += tTags;
            }
        }
    });
    
    // --- Analysis Report ---
    const analysisReport: Record<string, AnalysisRow> = {
        'Total': newAnalysisRow('Összes'),
        'Repetition': newAnalysisRow('Ismétlődés'),
        '100%': newAnalysisRow('100%'),
        '95-99%': newAnalysisRow('95%-99%'),
        '85-94%': newAnalysisRow('85%-94%'),
        '75-84%': newAnalysisRow('75%-84%'),
        '50-74%': newAnalysisRow('50%-74%'),
        'No Match': newAnalysisRow('Nincs találat'),
    };
    
    segments.forEach(seg => {
        const sWords = countWords(seg.source);
        const sChars = countChars(seg.source);
        const sTags = countTags(seg.source);
        
        analysisReport['Total'].segments++;
        analysisReport['Total'].sourceWords += sWords;
        analysisReport['Total'].sourceChars += sChars;
        analysisReport['Total'].sourceTags += sTags;
        
        let category = 'No Match';
        let weight = 1.0;
        const match = allTmMatches[seg.id];

        if (sourceRepetitionMap.get(stripHtml(seg.source))!.length > 1) {
             category = 'Repetition';
             weight = 0.3;
        } else if (match) {
            const score = match.score;
            if (score === 1.0) { category = '100%'; weight = 0.3; }
            else if (score >= 0.95) { category = '95-99%'; weight = 0.5; }
            else if (score >= 0.85) { category = '85-94%'; weight = 0.8; }
            else if (score >= 0.75) { category = '75-84%'; weight = 0.8; }
            else if (score >= 0.50) { category = '50-74%'; weight = 1.0; }
        }

        analysisReport[category].segments++;
        analysisReport[category].sourceWords += sWords;
        analysisReport[category].sourceChars += sChars;
        analysisReport[category].sourceTags += sTags;
        analysisReport[category].weightedWords += sWords * weight;
        analysisReport[category].weightedChars += sChars * weight;
    });
    
    // Final calculations
    analysisReport['Total'].weightedWords = Object.values(analysisReport).reduce((acc, row) => acc + row.weightedWords, 0) - analysisReport['Total'].weightedWords;
    analysisReport['Total'].weightedChars = Object.values(analysisReport).reduce((acc, row) => acc + row.weightedChars, 0) - analysisReport['Total'].weightedChars;


    Object.values(countsReport).forEach(row => {
        if (countsReport['Total'].segments > 0) {
            row.percentage = (row.segments / countsReport['Total'].segments) * 100;
        }
    });

    Object.values(analysisReport).forEach(row => {
        if (analysisReport['Total'].segments > 0) {
            row.percentage = (row.segments / analysisReport['Total'].segments) * 100;
        }
    });


    return {
        countsReport: Object.values(countsReport),
        analysisReport: Object.values(analysisReport),
    };
};
