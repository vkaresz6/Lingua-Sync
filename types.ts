

export interface EvaluationResult {
  rating: number; // A score from 1 to 5 for quality
  feedback: string; // Textual feedback from Gemini
  consistency?: number; // A score from 1 to 5 for consistency
}

export interface SourceError {
  error: string;      // The exact text with the error.
  correction: string; // The suggested correction.
  explanation: string;// A brief explanation of the error.
}

export type SegmentStatus = 'draft' | 'translated' | 'approved_by_p1' | 'approved_by_p2' | 'rejected' | 'finalized';

export interface Segment {
  id: number;
  source: string;
  target: string;
  translatorTarget?: string; // The translator's version before proofreading
  evaluation?: EvaluationResult;
  targetErrors?: SourceError[];
  isStructureVisible?: boolean;
  structuredSourceHtml?: string;
  isDateHighlightVisible?: boolean;
  dateHighlightHtml?: string;
  isDirty?: boolean;
  lastModifiedBy?: string; // GitHub username
  startTime?: number; // in seconds
  endTime?: number; // in seconds
  translationSource?: 'tm-100' | 'user';
  status: SegmentStatus;
  comments?: {
    author: string;      // GitHub username
    text: string;
    createdAt: string;   // ISO timestamp
    isResolved: boolean;
  }[];
}

export interface TranslationUnit {
  source: string;
  target: string;
}

export interface GeminiPrompts {
  segmentation: string;
  evaluation: string;
  grammar: string;
  translation: string;
  termExtraction: string;
  definition: string;
  inflection: string;
  structureAnalysis: string;
  punctuationCorrection: string;
  dateAnalysis: string;
  chatSystemInstruction: string;
  chatToolInstruction: string;
  grammarCorrectionHtml: string;
  batchTranslation: string;
  batchTimedSegmentation: string;
  syncFormatting: string;
  splitSegment: string;
  batchSyncFormatting: string;
  termSuggestion: string;
  quickTranslate: string;
  rebuildTranslation: string;
  aiQaCheck: string;
  transcriptionCorrection: string;
  batchEvaluation: string;
}

export interface ProjectSettings {
  prompts: GeminiPrompts;
  model: string;
}

// For file storage (JSONL)
export interface TermUnit {
  source: string;
  target: string;
  definition?: string;
}

// For runtime use in the app
export interface Term extends TermUnit {
  id: number;
}

export type PaneId = 'preview' | 'machine-translation' | 'term-db' | 'evaluation' | 'translation-memory' | 'chat' | 'sxDev' | 'youtube-player' | 'web-preview';

export interface PaneLayout {
  sidebar: PaneId[];
  bottom: PaneId[];
}

export type UserRole = 'Owner' | 'Project Leader' | 'Proofreader 1' | 'Proofreader 2' | 'Translator';

export interface Contributor {
  githubUsername: string;
  roles: UserRole[];
}

export interface Project {
  name: string;
  context: string;
  sourceLanguage: string;
  targetLanguage: string;
  translationMemories?: string[];
  termDatabases?: string[];
  contributors?: Contributor[];
  leader?: string; // GitHub username of the project leader
  youtubeUrl?: string;
  webpageUrl?: string;
  proofreader1?: string; // GitHub username
  proofreader2?: string; // GitHub username
}

export interface ProjectState {
  version: string;
  appName: string;
  createdAt: string;
  project: Project;
  data: {
    segments: Segment[];
  };
  session: {
    // Deprecated, but kept for backwards compatibility on loading old projects.
    tokenCount?: number;
    inputTokenCount: number;
    outputTokenCount: number;
    apiCallCount: number;
    activeSegmentId: number | null;
  };
  settings: ProjectSettings;
  sourceControl?: {
    provider: 'github';
    owner: string;
    repo: string;
    path: string; // path to .lingua file
    sha: string; // sha of .lingua file
  };
  sourceFile?: {
    name: string;
    content: string; // base64 encoded
  };
  sourceDocumentHtml?: string; // Full HTML of the source document for reconstruction
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  parts: { text: string }[];
  isPending?: boolean;
}

export interface Suggestion {
  text: string;
  isTerm: boolean;
}

export type QaIssueType = 'EMPTY_TRANSLATION' | 'INCONSISTENT_TRANSLATION' | 'TERM_MISMATCH' | 'TAG_MISMATCH' | 'NUMBER_MISMATCH' | 'SPACING_ERROR';
export type AiQaIssueType = 'TONAL_INCONSISTENCY' | 'FORMALITY_MISMATCH' | 'CULTURAL_RED_FLAG' | 'READABILITY_ISSUE' | 'TRANSLATION_INCONSISTENCY';
export type AllQaIssueType = QaIssueType | AiQaIssueType;


export interface QaIssue {
    segmentId: number;
    type: AllQaIssueType;
    description: string;
    source: string;
    target: string;
    suggestion?: string;
    suggestedFix?: string;
}