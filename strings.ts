
import { GeminiPrompts } from './types';

export const STRINGS = {
    // App.tsx & projectManager
    LOADING_PROJECT: 'Loading project...',
    IMPORTING_TM: 'Importing Translation Memory...',
    CREATING_PROJECT: 'Creating new project...',
    CREATING_PROJECT_FROM_WEBPAGE: 'Fetching and processing webpage...',
    UNSUPPORTED_FILE_TYPE: 'Unsupported file type. Please select a .docx, .pdf, or .lingua file.',
    FAILED_LOAD_PROJECT: (error: string) => `Failed to load project file: ${error}`,
    FAILED_CREATE_PROJECT_YOUTUBE: (error: string) => `Failed to create project from transcript: ${error}`,
    YOUTUBE_TRANSCRIBING: 'Transcribing from YouTube...',
    YOUTUBE_SEGMENTING: 'Segmenting transcript...',
    YOUTUBE_NO_TRANSCRIPT_FOUND: 'Could not retrieve a transcript from the video. The video may not have captions available.',
    TRANSCRIPT_PARSE_ERROR: 'Could not parse the provided transcript. Please check the format.',
    CONNECT_GITHUB_FIRST: 'Please connect to GitHub first to manage Translation Memories.',
    NO_UNITS_IN_ARCHIVE: 'No valid translation units found in the archive.',
    SUCCESS_IMPORT_TM: (count: number, filename: string) => `Successfully imported ${count} units into ${filename} in your project's repository.`,
    FAILED_IMPORT_TM: (error: string) => `Failed to import TM archive: ${error}`,
    FAILED_CREATE_PROJECT: (error: string) => `Failed to create new project: ${error}`,
    GITHUB_TOKEN_NOT_FOUND: 'GitHub token not found. Please reconnect.',
    GITHUB_NOT_CONNECTED_OR_REPO_MISSING: 'GitHub not connected or repository information is missing.',
    LOADING_FROM_GITHUB: (repo: string) => `Loading from ${repo}...`,
    FAILED_OPEN_GITHUB: (error: string) => `Failed to open project from GitHub: ${error}`,
    NO_TRANSLATED_SEGMENTS_TO_UPLOAD: 'No translated segments to upload to Translation Memory.',
    SUCCESS_UPLOAD_TM: (filename: string) => `Successfully uploaded/updated translation memory: ${filename}`,
    FAILED_UPLOAD_TM: 'Failed to upload translation memory:',
    PROJECT_NOT_LINKED_TO_GITHUB: 'Project is not linked to GitHub.',
    NO_ACTIVE_PROJECT_TO_PUSH: 'No active project to push.',
    TERM_IMPORT_SUCCESS: (count: number) => `${count} new terms imported successfully.`,
    TERM_IMPORT_FAILED: 'Failed to import or parse the CSV file.',
    LOADING_INDICATOR_DEFAULT: 'Loading...',

    // Header.tsx
    TITLE_BACK_TO_PROJECTS: 'Back to Projects',
    TITLE_SAVE_BROWSER: 'Save Project to Browser',
    TITLE_PUSH_CHANGES_GITHUB: 'Push changes to GitHub',
    TITLE_PULL_GITHUB: 'Pull latest version from GitHub',
    TITLE_CONNECT_GITHUB: 'Connect to GitHub',
    TITLE_DISCONNECT_GITHUB: 'Disconnect from GitHub',
    TITLE_DOWNLOAD_PROJECT: 'Download Project File (.lingua)',
    TITLE_PUSH_GITHUB: 'Push project to a new GitHub repository',
    TITLE_MANAGE_TERMDBS: 'Manage Terminology Databases',
    TITLE_LOAD_TERMDBS: 'Load Terminology from Repository',
    TITLE_IMPORT_TM_ARCHIVE: 'Import Translation Memory from Archive (.mqxlz)',
    TITLE_MANAGE_TMS: 'Manage Translation Memories',
    TITLE_FIND_TM_MATCHES: 'Find all TM Matches',
    TITLE_EXPORT_DOCX: 'Export as DOCX',
    TITLE_EXPORT_PDF: 'Export as PDF',
    TITLE_EXPORT_SRT: 'Export as SRT Subtitles',
    TITLE_SETTINGS: 'Settings',
    TITLE_TOGGLE_DEV_VIEW: 'Toggle Developer View',
    TITLE_PULL_REQUESTS: 'View Pull Requests on GitHub',
    TITLE_MANAGE_USERS: 'Manage Users',
    TITLE_INVITE_CONTRIBUTOR: 'Invite a contributor to this project',
    TITLE_SYNC_FORMATTING: 'Sync Formatting with Source (Ctrl+Y)',
    TITLE_BATCH_SYNC_FORMATTING: 'Sync Formatting for All Translated Segments',
    TITLE_RESEGMENT: 'Resegment Document',
    TAB_FILE: 'File',
    TAB_EDIT: 'Edit',
    TAB_GITHUB: 'GitHub',
    LABEL_PROJECT_PREFIX: 'Project: ',
    QA_CHECK_TITLE: 'Run QA Checks',
    DEV_REBUILD_DOCX_TITLE: 'Rebuild DOCX from Source',
    DEV_REBUILD_DOCX_LOADING: 'Rebuilding DOCX...',
    RE_EVALUATE_ALL_BUTTON: 'Re-evaluate All Translated',
    
    // SegmentTable.tsx
    TABLE_HEADER_NUMBER: '#',
    TABLE_HEADER_SOURCE: 'Source',
    TABLE_HEADER_TARGET: 'Target',
    TITLE_HIDE_STRUCTURE: 'Hide logical structure',
    TITLE_SHOW_STRUCTURE: 'Highlight logical structure',
    TITLE_HIDE_DATES: 'Hide date formatting',
    TITLE_SHOW_DATES: 'Highlight dates',
    LAST_MODIFIED_BY: (username: string) => `Last modified by ${username}`,
    TIMESTAMP_TOOLTIP: 'Timestamp (start time) from source video',

    // EditableCell.tsx
    ARIA_LABEL_TARGET_EDITOR: 'Target segment editor',
    QUALITY_SCORE_TOOLTIP: (score: string) => `Quality Score: ${score}`,
    QUALITY_SCORE_UNEVALUATED: 'Not evaluated',
    BUTTON_AUTOCORRECT_TITLE: 'Autocorrect grammar and spelling',
    TM_APPLY_MATCH_TITLE: (score: string, source: string) => `Use this match from TM (${score}%)\nSource: ${source}`,
    TM_PRETRANSLATED_100: 'Pre-translated from TM (100% match)',

    // ContextMenu.tsx
    MENU_JOIN_SEGMENT: 'Join with Segment Below',
    MENU_SPLIT_SEGMENT: 'Split Segment',
    MENU_NEW_TERM: 'New Term',
    MENU_TRANSLATE_SELECTION: 'Translate',

    // SettingsModal.tsx
    SETTINGS_MODAL_TITLE: 'Settings',
    SETTINGS_MODAL_DESC: 'Customize the model and prompts used for AI tasks.',
    SETTINGS_GENERAL_TITLE: 'General Settings',
    SETTINGS_LABEL_MODEL: 'Language Model',
    SETTINGS_MODEL_HELP_TEXT: 'This model is used for all AI-powered tasks in the application.',
    SETTINGS_LABEL_PROMPTS: 'Prompts',
    SETTINGS_RESET_PROMPT: 'Reset to Default',
    SETTINGS_PROMPT_HELP_TEXT: 'Use placeholders like `${sourceText}`, `${targetText}`, etc. where applicable.',
    SETTINGS_BUTTON_CANCEL: 'Cancel',
    SETTINGS_BUTTON_SAVE: 'Save and Close',
    LABEL_GENERAL: 'General',
    LABEL_SEGMENTATION: 'Segmentation',
    LABEL_TRANSLATION: 'Translation',
    LABEL_EVALUATION: 'Evaluation',
    LABEL_GRAMMAR: 'Grammar',
    LABEL_TERM_EXTRACTION: 'Term Extraction',
    LABEL_DEFINITION: 'Definition',
    LABEL_INFLECTION: 'Inflection',
    LABEL_STRUCTURE_ANALYSIS: 'Structure Analysis',
    LABEL_PUNCTUATION_CORRECTION: 'Punctuation',
    LABEL_DATE_ANALYSIS: 'Date Analysis',
    LABEL_CHAT_SYSTEM_INSTRUCTION: 'Chat System Instruction',
    LABEL_CHAT_TOOL_INSTRUCTION: 'Chat Tool Instruction',
    LABEL_BATCH_TRANSLATION: 'Batch Translation',
    LABEL_SYNC_FORMATTING: 'Sync Formatting',
    LABEL_BATCH_SYNC_FORMATTING: 'Batch Sync Formatting',
    LABEL_SPLIT_SEGMENT: 'Split Segment',
    LABEL_TRANSCRIPTION_CORRECTION: "Transcription Correction",
    LABEL_TERM_SUGGESTION: 'Term Suggestion',
    LABEL_UNKNOWN: 'Unknown',
    
    // ImportContextModal.tsx
    IMPORT_MODAL_TITLE: 'New Project Setup',
    IMPORT_MODAL_DESC: 'Provide details for your new translation project.',
    IMPORT_MODAL_FILENAME_LABEL: (filename: string) => `You are importing: ${filename}`,
    LABEL_SOURCE_LANG: 'Source Language',
    LABEL_TARGET_LANG: 'Target Language',
    PLACEHOLDER_SOURCE_LANG: 'e.g., English',
    PLACEHOLDER_TARGET_LANG: 'e.g., Spanish',
    LABEL_DOC_CONTEXT: 'Document Context (for AI)',
    PLACEHOLDER_DOC_CONTEXT: 'e.g., A marketing brochure for a new tech product aimed at a general audience.',
    BUTTON_CREATE_PROJECT: 'Create Project',
    
    // WebpageImportModal.tsx
    WEBPAGE_IMPORT_MODAL_TITLE: 'Create Project from Webpage',
    WEBPAGE_IMPORT_MODAL_DESC: 'Enter a URL to fetch, segment, and translate a webpage.',
    LABEL_WEBPAGE_URL: 'Webpage URL',
    PLACEHOLDER_WEBPAGE_URL: 'https://example.com',


    // TimedTranscriptImportModal.tsx
    TRANSCRIPT_IMPORT_MODAL_TITLE: 'Create Project from Transcript',
    TRANSCRIPT_IMPORT_MODAL_DESC: 'Paste a timed transcript to create a subtitle project.',
    LABEL_TIMED_TRANSCRIPT: 'Timed Transcript (Format: MM:SS on one line, text on the next)',
    LABEL_YOUTUBE_URL_OPTIONAL: 'YouTube Video URL (Optional, for player)',
    PLACEHOLDER_YOUTUBE_URL: 'https://www.youtube.com/watch?v=...',

    // NewTermModal.tsx
    NEW_TERM_MODAL_TITLE: "Add New Term",
    NEW_TERM_MODAL_DESC: "Add a new term to the project's terminology database.",
    LABEL_SOURCE_TERM: "Source Term",
    LABEL_TARGET_TERM: "Target Term",
    LABEL_DEFINITION_OPTIONAL: "Definition (Optional)",
    BUTTON_GET_SUGGESTION: "Get AI Suggestion",
    BUTTON_ADDING_TERM: "Adding...",
    BUTTON_ADD_TERM: "Add Term",
    
    // ProjectListView.tsx
    TAB_LOCAL_PROJECTS: 'Local Projects',
    BUTTON_OPEN_PROJECT_FILE: 'From File',
    BUTTON_OPEN_PROJECT_WEBPAGE: 'From Webpage',
    BUTTON_OPEN_PROJECT_YOUTUBE: 'From Transcript',
    PROJECTS_TITLE: 'Your Projects',
    CARD_PROGRESS: 'Progress',
    CARD_LAST_SAVED: 'Last saved: ',
    CARD_LOCATION: 'Location: ',
    CARD_SEGMENTS_COUNT: (count: number) => `${count} segments`,
    CARD_LOCATION_GITHUB: 'GitHub',
    CARD_LOCATION_BROWSER: 'Browser Storage',
    CARD_DELETE_BUTTON: 'Delete',
    CARD_DELETE_CONFIRM: (name: string) => `Are you sure you want to delete "${name}"? This action cannot be undone.`,
    CARD_COMPLETION_TOOLTIP: (completed: number, total: number) => `${completed} of ${total} segments completed`,
    EMPTY_PROJECT_LIST_TITLE: 'No local projects yet',
    EMPTY_PROJECT_LIST_SUBTITLE: 'Click "Create from File" or "Create from Transcript" to start.',
    
    // GitHubPanel.tsx
    GITHUB_CONNECT_TITLE: 'Connect to GitHub',
    GITHUB_CONNECT_DESC: 'To access your repositories, please provide a GitHub Personal Access Token (PAT). This token will only be stored for your current session and will be cleared when you close this browser tab.',
    GITHUB_TOKEN_SCOPES: 'Your token needs the `repo` scope to access public and private repositories.',
    GITHUB_GENERATE_TOKEN_LINK: 'Generate a token here.',
    GITHUB_CONNECT_BUTTON: 'Connect',
    GITHUB_CONNECTING_BUTTON: 'Connecting...',
    GITHUB_DISCONNECT_BUTTON: 'Disconnect',
    GITHUB_REPOS_TITLE: 'Repositories',
    GITHUB_FETCH_REPOS_FAILED: 'Failed to fetch repositories.',
    GITHUB_FETCH_CONTENT_FAILED: (path: string) => `Failed to fetch content for: ${path || '/'}`,
    GITHUB_PATH_LABEL: (path: string) => `Current path: /${path}`,
    GITHUB_PATH_ROOT: 'root',
    GITHUB_BACK_BUTTON: 'Back',
    GITHUB_LOADING_REPOS: 'Loading repositories...',
    GITHUB_LOADING_FILES: 'Loading...',
    GITHUB_DIR_EMPTY: 'This directory is empty.',
    GITHUB_OPEN_DIR_TITLE: (name: string) => `Open directory: ${name}`,
    GITHUB_OPEN_PROJECT_TITLE: (name: string) => `Open project: ${name}`,
    GITHUB_UNSUPPORTED_FILE_TITLE: (name: string) => `File type not supported: ${name}`,
    
    // CommitMessageModal.tsx
    COMMIT_MODAL_TITLE: 'Push Changes to GitHub',
    COMMIT_MODAL_DESC: 'Enter a commit message for your changes.',
    LABEL_COMMIT_MESSAGE: 'Commit message',
    PLACEHOLDER_COMMIT_MESSAGE: 'e.g., Translate introduction section',
    BUTTON_PUSH_COMMIT: 'Commit and Push',
    BUTTON_PUSHING_COMMIT: 'Pushing...',
    
    // InviteContributorModal.tsx
    INVITE_MODAL_TITLE: 'Invite Contributor',
    INVITE_MODAL_DESC: 'Invite a user to collaborate on this project.',
    LABEL_GITHUB_USERNAME: 'GitHub Username',
    INVITE_MODAL_NOTE: 'Note: This only adds the user to the project file. You must also grant them access to the repository on GitHub.com.',
    BUTTON_INVITE: 'Invite',

    // GitHubPushModal.tsx
    PUSH_MODAL_TITLE: 'Push Project to GitHub',
    PUSH_MODAL_PROJECT_LABEL: (name: string) => `Pushing project: ${name}`,
    ACTION_CREATE_NEW_REPO: 'Create a New Repository',
    ACTION_PUSH_EXISTING_REPO: 'Push to an Existing Repository',
    LABEL_REPO_NAME: 'Repository Name',
    LABEL_REPO_DESC: 'Description (Optional)',
    LABEL_REPO_VISIBILITY_PRIVATE: 'Private',
    LABEL_REPO_VISIBILITY_PUBLIC: 'Public',
    LABEL_SEARCH_REPOS: 'Search Repositories',
    PLACEHOLDER_SEARCH: 'Search...',
    BUTTON_PUSH_GITHUB: 'Push to GitHub',
    BUTTON_PUSHING_GITHUB: 'Pushing to GitHub...',
    ERROR_COMMIT_MSG_EMPTY: 'Commit message cannot be empty.',
    ERROR_REPO_NAME_EMPTY: 'Repository name cannot be empty.',
    ERROR_NO_REPO_SELECTED: 'No valid repository selected.',

    // DefinitionModal.tsx
    DEFINITION_MODAL_ERROR: 'Could not retrieve definition.',
    ARIA_LABEL_CLOSE_DEFINITION: 'Close definition',

    // AutoTranslateModal
    AUTOTRANSLATE_MODAL_TITLE: 'Auto-translate Segments',
    AUTOTRANSLATE_MODAL_DESC: 'This will fill target segments with machine translations, starting from the currently active segment.',
    AUTOTRANSLATE_MODAL_PROMPT: 'Translate up to segment number:',
    AUTOTRANSLATE_MODAL_BUTTON: 'Translate',
    AUTOTRANSLATING_BUTTON: 'Translating...',
    AUTOTRANSLATE_HEADER_BUTTON_TITLE: 'Auto-translate segments',
    AUTOTRANSLATE_LOADING_MESSAGE: 'Auto-translating segments...',
    AUTOTRANSLATE_INVALID_NUMBER: (max: number) => `Please enter a valid number up to ${max}.`,

    // Panes
    PANE_TITLE_PREVIEW: 'Preview',
    PANE_TITLE_WEB_PREVIEW: 'Web Preview',
    PANE_TITLE_MT: 'Machine Translation',
    PANE_TITLE_TERMDB: 'Terminology',
    PANE_TITLE_EVALUATION: 'Evaluation',
    PANE_TITLE_TM_MATCHES: 'TM Matches',
    PANE_TITLE_YOUTUBE_PLAYER: 'Video Player',
    PANE_TITLE_CHAT: 'Chat',

    // EvaluationPane.tsx
    EVALUATION_PLACEHOLDER: 'Enter evaluation notes or see automated feedback here after completing a segment...',
    BUTTON_CORRECT_PUNCTUATION: 'Correct Punctuation',

    // MachineTranslationPane.tsx
    MT_PANE_GETTING_TRANSLATIONS: 'Getting translations...',
    MT_PANE_PLACEHOLDER: 'Click "Generate" to get machine translation suggestions.',
    BUTTON_GENERATING_TRANSLATIONS: 'Generating...',
    BUTTON_GENERATE_TRANSLATIONS: 'Generate Translations',
    MT_USE_TRANSLATION_TITLE: 'Click to use this translation',

    // TermDbPane.tsx
    TERMDB_HEADER_SOURCE: 'Source Term',
    TERMDB_HEADER_TARGET: 'Target Term',
    TERMDB_HEADER_DEFINITION: 'Definition',
    TERMDB_EMPTY: 'No terms in this database.',
    TERMDB_RELEVANT_EMPTY: 'No relevant terms found for this segment.',
    TERMDB_NO_SEGMENT: 'Select a segment to see relevant terms.',
    PLACEHOLDER_NEW_SOURCE_TERM: 'New source term',
    PLACEHOLDER_NEW_TARGET_TERM: 'New target term',
    PLACEHOLDER_NEW_DEFINITION: 'Optional definition',
    BUTTON_ADD_TERM_SHORT: 'Add',
    BUTTON_ADD_TERM_TITLE: 'Add term',
    BUTTON_DELETE_TERM_TITLE: 'Delete term',
    BUTTON_EXTRACT_TERMS: 'Extract',
    BUTTON_EXTRACTING_TERMS: 'Extracting...',
    BUTTON_EXTRACT_TERMS_TITLE: 'Extract terms from source text using AI',

    // TranslationMemoryPane.tsx
    TM_SEARCHING: 'Searching...',
    TM_EMPTY: 'Select a segment with a linked TM to see matches.',
    TM_USE_MATCH_TITLE: 'Click to use this translation',

    // PreviewPane.tsx
    PREVIEW_PANE_EMPTY: 'No content to preview.',
    
    // ChatPane.tsx
    CHAT_THINKING: 'Thinking...',
    CHAT_PLACEHOLDER: 'Ask a question or request a task...',
    CHAT_SEND_BUTTON_TITLE: 'Send message',

    // ManageTmsModal.tsx
    MANAGE_TMS_TITLE: 'Manage Translation Memories',
    MANAGE_TMS_DESC_PROJECT: 'Link TMs from this project\'s repository.',
    MANAGE_TMS_AVAILABLE_TMS_PROJECT: (repo: string) => `Available TMs in ${repo}`,
    MANAGE_TMS_UPLOAD_BUTTON: 'Upload New TM...',
    MANAGE_TMS_UPLOADING_BUTTON: 'Uploading...',
    MANAGE_TMS_FETCHING: 'Fetching TMs...',
    MANAGE_TMS_EMPTY_PROJECT: 'No translation memories found in this project.',
    MANAGE_TMS_SAVE_BUTTON: 'Save Changes',

    // ManageTermDbsModal.tsx
    MANAGE_TERMDBS_TITLE: 'Manage Terminology',
    MANAGE_TERMDBS_DESC_PROJECT: 'Link Terminology Databases from this project\'s repository.',
    MANAGE_TERMDBS_AVAILABLE_TERMDBS_PROJECT: (repo: string) => `Available TermDBs in ${repo}`,
    MANAGE_TERMDBS_UPLOAD_BUTTON: 'Upload New TermDB...',
    MANAGE_TERMDBS_UPLOADING_BUTTON: 'Uploading...',
    MANAGE_TERMDBS_FETCHING: 'Fetching TermDBs...',
    MANAGE_TERMDBS_EMPTY_PROJECT: 'No terminology databases found in this project.',
    MANAGE_TERMDBS_SAVE_BUTTON: 'Save Changes',

    // LoadTermDbModal.tsx
    LOAD_TERMDBS_MODAL_TITLE: 'Load Terminology Database',
    LOAD_TERMDBS_MODAL_DESC: 'Select a TermDB file from the project repository to load and merge its terms into your current session.',
    LOAD_TERMDBS_AVAILABLE_TERMDBS: (repo: string) => `Available TermDBs in ${repo}`,
    LOAD_TERMDBS_EMPTY_PROJECT: "No terminology databases found in this project's repository.",
    LOAD_TERMDBS_FETCHING: "Fetching TermDBs...",
    LOAD_TERMDBS_LOADING_FILE: "Loading...",

    // Sync Feature
    TITLE_SYNC_GITHUB: 'Sync with GitHub (Pull & Push)',
    SYNC_MODAL_TITLE: 'Resolve Sync Conflicts',
    SYNC_MODAL_DESC: 'The following segments were edited both locally and on GitHub. Please choose which version to keep for each conflict.',
    SYNC_CONFLICT_LOCAL: 'Your Version (Local)',
    SYNC_CONFLICT_REMOTE: 'Remote Version (GitHub)',
    SYNC_BUTTON_KEEP_LOCAL: 'Keep Yours',
    SYNC_BUTTON_USE_REMOTE: 'Use Remote',
    SYNC_BUTTON_RESOLVE_AND_PUSH: 'Resolve and Push',
    SYNC_BUTTON_RESOLVING: 'Resolving...',
    SYNC_CANCEL: 'Cancel Sync',
    SYNC_ALL_RESOLVED: 'All conflicts resolved. Ready to push.',
    SYNCING_PULLING: 'Pulling remote changes...',
    SYNCING_MERGING: 'Merging changes...',
    SYNCING_PUSHING: 'Pushing merged changes...',
    SYNC_SUCCESS: 'Sync successful. Project is up to date.',
    SYNC_UP_TO_DATE: 'Project is already up to date.',
    SYNC_PUSHING_LOCAL_CHANGES: 'No remote changes. Pushing local updates.',
    SYNC_CONFLICT_DETECTED: 'Sync conflict detected. Please resolve.',
    SYNC_FAILED: (error: string) => `Sync failed: ${error}`,

    // hooks/useCatTool.ts
    EVALUATING_TRANSLATION: 'Evaluating translation...',
    EVALUATION_FAILED: 'Evaluation failed. The AI response might be invalid.',
    COULD_NOT_INITIALIZE_CHAT: 'Could not initialize the AI chat session. Please check your API key and network connection. Some features may not work.',
    FAILED_TO_INFLECT_TERM: 'Failed to inflect term:',
    FAILED_TO_ANALYZE_STRUCTURE: 'Failed to analyze structure:',
    FAILED_TO_ANALYZE_DATES: 'Failed to analyze dates:',
    FAILED_TO_ANALYZE_ENTITIES: 'Failed to analyze entities:',
    FAILED_TO_SYNC_FORMATTING: 'Failed to sync formatting:',
    NO_SOURCE_TEXT_TO_ANALYZE: 'There is no source text to analyze.',
    EXTRACT_TERMS_SUCCESS: (count: number) => `Successfully extracted and added ${count} new terms.`,
    EXTRACT_TERMS_NO_NEW: 'No new terms were found.',
    EXTRACT_TERMS_FAILED: (error: string) => `Error: Failed to extract terms. ${error}`,
    CORRECT_PUNCTUATION_FAILED: 'Could not correct punctuation.',
    AUTOCORRECT_FAILED: 'Autocorrect failed.',
    GITHUB_NOT_CONNECTED: 'GitHub not connected.',
    NO_VALID_TM_UNITS_FOUND: 'No valid translation units found.',
    UPLOAD_FAILED: 'Upload failed.',
    SAVE_SUCCESS_MESSAGE: (name: string) => `Project "${name}" saved to browser.`,
    COMMIT_FAILED_MESSAGE: (error: string) => `Error: Failed to commit. ${error}`,
    PUSH_NEW_REPO_SUCCESS: (name: string) => `Pushed to new repo: ${name}. Translation memory created.`,
    PUSH_EXISTING_REPO_SUCCESS: (name: string) => `Pushed to repo: ${name}. Translation memory updated.`,
    PUSH_SUCCESS: 'Successfully pushed to GitHub.',
    PUSH_FAILED: (error: string) => `Failed to push to GitHub. ${error}`,
    PULL_SUCCESS: 'Successfully pulled latest version from GitHub.',
    PULL_FAILED: (error: string) => `Failed to pull from GitHub. ${error}`,
    PULL_CANCELLED: 'Pull cancelled.',
    PULL_CONFIRM: 'Pulling from GitHub will overwrite your local changes. Are you sure you want to continue?',
    RESEGMENT_CONFIRM: 'Are you sure you want to re-segment this document? All current translations and progress will be lost.',
    RESEGMENT_SUCCESS: 'Document successfully re-segmented.',
    RESEGMENT_FAILED: 'Resegmentation failed. Original document source not found or could not be parsed.',
    RESEGMENT_UNSUPPORTED: 'Resegmentation is not supported for this project type (e.g., transcript-based projects).',
    
    // utils/fileHandlers.ts
    ERROR_INVALID_PROJECT_FILE: 'Invalid or corrupted project file.',
    ERROR_FAILED_TO_PARSE_PROJECT_FILE: 'Failed to parse project file. It might be corrupted.',
    ERROR_FAILED_TO_READ_PROJECT_FILE: 'Error reading the project file.',
    ERROR_NO_CONTENT_TO_EXPORT: 'There is no content to export.',
    ERROR_EXPORT_FAILED: (format: string, error: string) => `Failed to export to ${format}. See console for details.`,

    // utils/importer.ts
    ERROR_NO_MQXLIFF_IN_ARCHIVE: 'No .mqxliff file found in the archive.',
    ERROR_XML_PARSING: (error: string) => `XML parsing error: ${error}`,
    
    // utils/geminiApi.ts
    GEMINI_SEGMENTATION_ERROR: 'Error during Gemini-powered segmentation:',
    NO_DEFINITION_FOUND: 'No definition found.',

    // Suggestions
    SUGGESTION_IS_TERM_TOOLTIP: 'Suggestion from Terminology Database',
    SUGGESTION_IS_AI_TOOLTIP: 'Suggestion from AI',
    SUGGESTION_FROM_TERMS: 'Suggestions from your terminology are shown.',
    SUGGESTION_AI_PLACEHOLDER: 'Click a segment to get AI-powered suggestions.',
    
    // QA
    QA_REPORT_TITLE: 'Quality Assurance Report',

    // Common
    BUTTON_CANCEL: 'Cancel',
    UNKNOWN_ERROR: 'Unknown error',
};

export const DEFAULT_PROMPTS: GeminiPrompts = {
  segmentation: `You are an expert text segmentation engine. Your task is to break down the following text into an array of strings, where each string is a single, complete segment suitable for translation. The output MUST be a valid JSON object with a single key "sentences" which contains this array of strings.

Follow these rules STRICTLY:

1.  **Sentence-Based Segmentation**: Each segment must be a single, complete sentence. A new segment MUST begin after sentence-ending punctuation (. ? !).
2.  **No Merging**: NEVER merge multiple sentences into one segment, no matter how short they are.
3.  **Respect Line Breaks**: Treat every line break in the input text as a hard boundary. NEVER merge text from different lines into a single segment. Each heading, title, or list item must be its own segment.
4.  **Split Long Sentences**: If a single sentence is excessively long (over 40 words), you MUST split it at a logical point (like a conjunction or semicolon) into smaller, grammatically complete clauses. Each clause becomes a new segment.
5.  **Maintain Integrity**: Do not alter, add, or remove any text.

The output must be ONLY the JSON object.

Text to segment:
---
\${text}
---`,

  evaluation: `You are a translation quality evaluator and proofreader.
Analyze the following translation of a text segment. Consider grammatical accuracy, semantic equivalence, style, and consistency with the provided context.

General context of the document:
---
\${documentContext}
---

Translation details:
Translating from \${sourceLanguage} to \${targetLanguage}.
---

Context of the document (previous segments):
---
\${context}
---

Segment to evaluate:
Source: "\${sourceText}"
Translated: "\${targetText}"

Provide your evaluation in a JSON format with two keys:
1. "evaluation": An object with three sub-keys:
   - "rating": A numerical score from 1 to 5 for quality (1=poor, 5=perfect).
   - "consistency": A numerical score from 1 to 5 for consistency with the document context and previous segments (1=inconsistent, 5=very consistent).
   - "feedback": A concise, one or two-sentence explanation of the rating.
2. "errors": An array of objects for any grammatical/spelling errors found in the *Translated* text. Each object must have three keys: "error" (the incorrect phrase), "correction" (the suggested fix), and "explanation". If no errors, return an empty array.

Do not include any other text or explanation outside of the main JSON object.`,

  grammar: `You are an expert proofreader. Analyze the following text for grammatical errors, spelling mistakes, and typos.
Return your findings as a JSON object containing a single key "errors", which is an array of objects.
Each object in the array should represent a single error and must have three keys:
1. "error": The exact word or phrase from the text that is incorrect. This must be a verbatim substring from the original text.
2. "correction": A suggested replacement for the incorrect text.
3. "explanation": A brief, clear explanation of the mistake.

If there are no errors, return an empty "errors" array.
Do not include any other text or explanation outside of the main JSON object.

Text to analyze:
---
\${text}
---`,

  grammarCorrectionHtml: `You are a meticulous proofreader. Your task is to correct grammatical errors, spelling mistakes, and typos in the following text, which may contain HTML tags for formatting.
- Preserve all existing HTML tags (like <b>, <i>, <u>, <span>, etc.) and their positions relative to the text they wrap.
- Only correct the text content. Do not add, remove, or modify any HTML tags.
The output must be a JSON object with a single key "correctedHtml" which contains the full, corrected text with its original HTML tags intact.

Text to correct:
---
\${htmlText}
---`,

  translation: `You are an expert translator. Provide 3 high-quality, distinct translations from \${sourceLanguage} to \${targetLanguage} for the following source text.
The document context is: "\${documentContext}".
Consider different phrasing and tone where appropriate.
translations must be distinct in tone/word choice, not trivial rewordings.
Source text: "\${sourceText}"
Respond with a JSON object with a single key "translations", which is an array of 3 strings.
Do not include any other text, explanation, or markdown formatting.`,

  termExtraction: `You are a terminology expert processing a document for translation.
Analyze the following document text to identify all relevant medical terms (e.g., anatomical parts, procedures, conditions, medications, instruments).
For each term, provide a likely translation from \${sourceLanguage} to \${targetLanguage} and a concise, one-sentence definition of the source term in the context of the document.

Document Context: "\${documentContext}"

The output must be a JSON object with a single key "terms", which is an array of objects. Each object must have "source", "target", and an optional "definition" key.
Do not include any other text or explanation.

Document text to analyze:
---
\${text}
---`,

  definition: `You are a dictionary expert. Provide a concise definition for the word "\${word}" as used when translating from \${sourceLanguage} to \${targetLanguage}. The definition should be in English. 
If the word has multiple meanings, provide the most likely one given the context.
Respond with a JSON object with a single key "definition", which is a string containing the definition.
Do not include any other text, explanation, or markdown formatting.`,

  inflection: `You are a linguistic expert specializing in grammar and inflection. Your task is to correctly inflect a base translation term to fit grammatically into a target sentence. Use the source sentence for context.

- Source Sentence: "\${sourceSentence}"
- Target Sentence (in progress): "\${targetSentence}"
- Base Term Translation: "\${baseTranslation}"

Analyze the target sentence and provide the correctly inflected form of the base term. Respond with a JSON object containing a single key, "inflection", which is a string holding only the inflected word or phrase. Do not provide explanations.

Example:
- Source Sentence: "I saw two beautiful mice."
- Target Sentence (in progress): "Ich sah zwei schöne"
- Base Term Translation (German): "Maus"
- Your response: { "inflection": "Mäuse" }`,
  
  structureAnalysis: `You are an expert in linguistics, specializing in identifying semantic relationships in sentences. Your task is to analyze the provided sentence and identify which words or phrases (dependents) describe or modify other words or phrases (heads).

For each dependent you identify, wrap it in a span tag with the following attributes:
1.  A "class" attribute with the value "structure-highlight".
2.  A "data-title" attribute whose value is the exact text of the head word or phrase it refers to.

The goal is to show what each descriptive part of the sentence is connected to.

-   For an adjective (e.g., "rozoga" - clunky), the head is the noun it modifies (e.g., "autót" - car).
-   For an adverb of manner (e.g., "ügyesen" - skillfully), the head is the subject performing the action (e.g., "Karcsi").
-   For a subordinate clause describing a concurrent action (e.g., "miközben podcastet hallgat" - while listening to a podcast), the head is the subject performing that action (e.g., "Karcsi").

The final output must be a JSON object with a single key "html" containing the fully marked-up HTML string. Only wrap the dependent parts. Do not wrap the head words themselves.

Example:
- Input: "Karcsi ügyesen vezeti a rozoga autót, miközben podcastet hallgat."
- Output: { "html": "Karcsi <span class=\\"structure-highlight\\" data-title=\\"Karcsi\\">ügyesen</span> vezeti a <span class=\\"structure-highlight\\" data-title=\\"autót\\">rozoga</span> autót, <span class=\\"structure-highlight\\" data-title=\\"Karcsi\\">miközben podcastet hallgat</span>." }

Now, analyze the following sentence:
---
\${text}
---
`,

  punctuationCorrection: `You are a meticulous proofreader. Your task is to correct only the punctuation in the following text. Do not change any words, phrasing, or sentence structure.
The output must be a JSON object with a single key "correctedText" which contains the full, corrected text as a string.

Text to correct:
---
\${text}
---`,

  dateAnalysis: `You are an expert in cultural linguistics. Your task is to analyze the provided sentence, identify all dates, and format them for the specified target language culture.

For each date you identify, wrap it in a span tag with the following attributes:
1.  A "class" attribute with the value "date-highlight".
2.  A "data-title" attribute whose value is the date formatted appropriately for a user in \${targetLanguage}.

The final output must be a JSON object with a single key "html" containing the fully marked-up HTML string. Only wrap the identified dates.

Example:
- Input: "The meeting is on 12/10/2024."
- Target Language: "British English"
- Output: { "html": "The meeting is on <span class=\\"date-highlight\\" data-title=\\"12 October 2024\\">12/10/2024</span>." }

Now, analyze the following sentence:
---
\${text}
---`,

  chatSystemInstruction: `You are a helpful and expert translation assistant. The user is translating a document from \${sourceLanguage} to \${targetLanguage}. The context of the document is: "\${documentContext}".
The user will first provide you with the entire source document. If ypu received the document and ready to go Print "Ready"
After that, the user may ask you questions about the source text, ask for translation alternatives, or ask for general help. Provide clear, helpful, and concise answers.
Be conversational. Respond in plain text. The user may ask you offtpoic questions`,

  chatToolInstruction: `This is a placeholder for the chat tool instruction prompt. You can define how the AI should interpret and respond to specific tool-related commands from the user in the chat interface. For example, how to handle requests for terminology, context, or specific translation tasks.`,

  batchTranslation: `You are an expert translator from \${sourceLanguage} to \${targetLanguage}.
The document context is: "\${documentContext}".

You will be given a JSON array of source text segments. Translate each segment.
Your response MUST be a single JSON object with a key "translations", which is an array of strings.
This array MUST contain the same number of translated strings as the source array, in the same order.
Do not add any other text, explanation, or markdown formatting.

Source Segments:
\${sourceTextsJson}
`,

  batchTimedSegmentation: `You are a text processing expert specializing in subtitles. You will receive a JSON array of timed text chunks.
Your task is to break down the 'text' within each chunk into smaller, natural-sounding sentences or phrases suitable for subtitles.

Rules:
1. For each new segmented sentence, you must calculate and assign a logical 'start' and 'end' time.
2. The new time ranges must be contained within the original chunk's time range.
3. The new segments must be contiguous and should not overlap. The 'end' time of one segment should be the 'start' time of the next within the same original chunk.
4. Do not alter the text content itself, only segment it.

The output must be a single JSON object with a key "segments", which is an array of objects, each with "text" (string), "start" (number in seconds), and "end" (number in seconds) keys.

Input Chunks:
\${timedChunksJson}
`,

  syncFormatting: `You are an expert in HTML formatting. Your task is to apply the HTML structure from a source text to a target text.
The word count and order in the source and target might not match exactly, but you should intelligently map the formatting. For example, if the source is a heading, the target should be a heading. If a phrase is bold in the source, the corresponding phrase should be bold in the target. If the source is a table, the target text should be placed in a similar table structure.

Do not alter the target text content, only wrap it in the appropriate HTML tags from the source.

Source HTML:
\`\`\`html
\${sourceHtml}
\`\`\`

Target Text (plain text):
---
\${targetText}
---

Return a JSON object with a single key "formattedHtml" containing the target text with the source's HTML structure applied. Do not include any other text or explanation.`,
  
  splitSegment: `You are an expert in HTML and linguistics. Your task is to intelligently split a source HTML segment and its corresponding target HTML segment into two parts.

The split point in the source should be located near the text context provided. Find a natural breaking point (like the end of a clause or sentence) near that context. Then, perform a corresponding logical split on the target HTML.

Preserve all original HTML tags and structure in all four output segments. If the target is empty, return two empty strings for the target parts.

Context for split point in source: "\${contextPhrase}"

Source HTML:
---
\${sourceHtml}
---

Target HTML:
---
\${targetHtml}
---

Your response MUST be a single, valid JSON object with four keys: "sourceHtml1", "sourceHtml2", "targetHtml1", and "targetHtml2". Do not include any other text or explanations.`,
  batchSyncFormatting: `You are an expert in HTML formatting. You will receive a JSON array of objects, where each object has an 'id', 'sourceHtml', and 'targetText'. For each object, apply the HTML structure from its 'sourceHtml' to its corresponding 'targetText'.
The word count and order in the source and target might not match exactly, but you should intelligently map the formatting.

Your response MUST be a single JSON object with a key "results", which is an array of objects.
Each object in the "results" array must have two keys:
1. "id": The same unique identifier from the input object.
2. "formattedHtml": A string containing the target text with the source's HTML structure applied.

The "results" array must contain an object for every object in the input array, in the same order. Do not alter the target text content itself, only wrap it in the appropriate HTML tags.

Input Array:
\${batchDataJson}
`,
  transcriptionCorrection: `You are an expert proofreader and editor. A user is dictating text to append to an existing sentence. The speech-to-text is imperfect. Your task is to take the existing text and the new transcribed text, merge them, and correct the new part to make grammatical and contextual sense.

- The new text should be appended to the existing text, usually with a leading space.
- Correct spelling, grammar, and awkward phrasing in the *newly transcribed text* to fit the context of the *existing text*.
- Preserve the meaning of the transcription.
- The output must be a single JSON object with one key: "correctedText", containing the full, combined, and corrected text.

Existing Text:
---
\${existingText}
---

Newly Transcribed Text:
---
\${transcribedText}
---
`,
  termSuggestion: `You are a terminology expert. For the source term "\${sourceTerm}" from \${sourceLanguage}, provide a likely translation into \${targetLanguage} and a concise definition of the source term in English. The context is "\${documentContext}".
Respond with a JSON object with two keys: "target" (the translated term) and "definition" (the English definition).
Do not include any other text or explanation.`,
  quickTranslate: `You are a high-quality machine translation engine. Your task is to translate a short piece of text from \${sourceLanguage} to \${targetLanguage}, using the surrounding sentence as context.
The response must be a single JSON object with one key, "translation", which contains the translated text as a string. Do not include any other text or explanation.

- Surrounding Sentence (for context): "\${context}"
- Text to Translate: "\${text}"`,
  rebuildTranslation: `You are an expert in DOCX XML structure and translation alignment. Your task is to reconstruct a translated DOCX XML document.

You will be given:
1. The full original DOCX \`document.xml\` file (from the source DOCX).
2. A JSON object representing the full .lingua project file, which contains all the sentence-by-sentence translation data.

Your goal:
- Replace the source text inside <w:t> tags with the corresponding translations found in the .lingua JSON.
- STRICTLY preserve all original DOCX XML structure, including:
  - Paragraphs (<w:p>…</w:p>)
  - Run and paragraph properties (<w:rPr>, <w:pPr>, etc.)
  - Formatting (bold, italic, underline, superscript, subscript, styles, tables, numbering, etc.)
- Maintain alignment: the order of translations must match the order of source sentences in the XML.
- Handle merges/splits:
  - If a sentence in the source spans multiple <w:t> runs, distribute the translation text across them while preserving formatting.
  - If multiple consecutive runs in the XML have identical formatting, you may merge them for cleanliness, but only if safe.
- Preserve empty <w:t/> tags if they exist.
- Do not remove or alter any XML elements except replacing text content.
- Ensure the output is a valid DOCX XML file.

Output format:
- Respond with a JSON object containing a single key "rebuiltXml", whose value is the complete translated \`document.xml\` string.
- Do not include any other text, explanations, or formatting outside the JSON.

Input:
---
Original DOCX XML:
\${originalDocumentXml}
---
Translations JSON (.lingua file content):
\${translationsJson}
---`,
  aiQaCheck: `You are a professional translation reviewer and localization expert for the \${targetLanguage} market. Analyze the following source and target document pair. The overall document context is: "\${documentContext}".
Identify high-level issues that a simple check would miss. Your response must be a valid JSON object with a single key "issues".
The "issues" key should contain an array of objects, where each object represents a single issue you've found. Each issue object must have the following keys:
- "segmentIndex": The 1-based index of the segment where the issue occurs.
- "type": One of the following strings: 'TONAL_INCONSISTENCY', 'FORMALITY_MISMATCH', 'CULTURAL_RED_FLAG', 'READABILITY_ISSUE', 'TRANSLATION_INCONSISTENCY'.
- "description": A concise but clear explanation of the issue and why it's a problem.

Focus on these issue types:
1.  TONAL_INCONSISTENCY: Note any segments where the tone (e.g., formal, casual, technical) shifts inappropriately from the document's main context.
2.  FORMALITY_MISMATCH: Identify inconsistent use of formal/informal address (register). For example, mixing 'tú' and 'usted' in Spanish.
3.  CULTURAL_RED_FLAG: Flag any phrases that are grammatically correct but may be awkward, offensive, or culturally jarring for a native speaker of \${targetLanguage}.
4.  READABILITY_ISSUE: Point out sentences that are grammatically correct but are unnaturally long, convoluted, or difficult to read.
5.  TRANSLATION_INCONSISTENCY: Check for consistency. Identify when the same source term or phrase is translated differently in different segments without a good contextual reason. Also flag if a key term is not translated consistently.

If you find no issues, return an empty "issues" array.

Document Segments (from \${sourceLanguage} to \${targetLanguage}):
---
\${formattedSegments}
---`,
  batchEvaluation: `You are a translation quality evaluator. You will be given a JSON array of objects, each containing a segment's "id", "sourceText", and "targetText".
Evaluate each segment's translation from \${sourceLanguage} to \${targetLanguage} based on accuracy, fluency, and context. The document context is: "\${documentContext}".

Your response MUST be a single JSON object with a key "evaluations". This key should contain an array of objects.
Each object in the array must have:
1. "id": The same unique identifier from the input object.
2. "evaluation": An object with "rating" (1-5), "consistency" (1-5), and "feedback" (string).
3. "errors": An array of grammar/spelling error objects for the target text, each with "error", "correction", and "explanation".

The "evaluations" array must contain an object for every object in the input array, in the same order.

Input Segments:
\${segmentsJson}
`,
};
