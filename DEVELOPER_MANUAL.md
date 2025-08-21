# LinguaSync - Developer Manual

## 1. Project Overview

**LinguaSync** is a web-based Computer-Assisted Translation (CAT) tool built with a modern frontend stack. It leverages the Google Gemini API for its intelligent features, including text segmentation and quality evaluation. A key feature is the ability to save and load entire translation sessions as a single project file.

*   **Framework**: React 19
*   **Language**: TypeScript
*   **Styling**: TailwindCSS
*   **AI Backend**: Google Gemini API (`@google/genai`)
*   **Build/Module System**: ES Modules with `esm.sh` CDN (no local bundler needed)

## 2. Project Structure

The project follows a component-based architecture with a clear separation of concerns.

```
/
├── index.html            # HTML entry point, loads scripts and defines import map.
├── index.tsx             # React application root, mounts App component.
├── App.tsx               # Main component, manages views and high-level state.
├── constants.ts          # Default values and constants.
├── types.ts              # TypeScript type definitions (Segment, ProjectState, etc.).
│
├── components/           # Reusable React components (UI-focused).
│   ├── EditorView.tsx      # Main translation interface.
│   ├── EditableCell.tsx    # The rich-text enabled editor for target segments.
│   └── ... (other UI components)
├── hooks/                # Custom React hooks for state and logic management.
│   └── useCatTool.ts       # Central hook managing all editor state and logic.
└── utils/                # Utility functions.
    ├── fileHandlers.ts     # Logic for parsing/exporting documents and saving/loading projects.
    └── geminiApi.ts        # All communication logic with the Gemini API.
```

## 3. Core Concepts & Logic

### State Management (`hooks/useCatTool.ts`)
The application's logic and state for the editor view are centralized in the `useCatTool.ts` custom hook. This is the brain of the translation editor. It manages everything from the `segments` array to loading states and user interaction handlers. This encapsulation keeps `EditorView.tsx` clean and declarative.

### Project State and File Handling
*   **Project File**: LinguaSync uses a custom JSON-based file format with the extension `.lingua`. This file acts as a snapshot of the entire application state.
*   **State Definition**: The structure of this snapshot is defined by the `ProjectState` interface in `types.ts`. It includes project metadata, all segment data, session stats (token counts), and user settings (prompts).
*   **Save/Load Logic**: The `utils/fileHandlers.ts` module contains functions for handling files. Local project state is managed in `App.tsx` and passed down.

### Rich Text Editing (`components/EditableCell.tsx`)
The `EditableCell` uses a `contentEditable` `<div>` to support text formatting.
*   **State**: The `segment.target` property stores an HTML string.
*   **Bug Fix**: A common bug with `contentEditable` in React is the cursor jumping to the start on re-renders. This was solved by using a `useRef` hook (`isInternalUpdate`) inside `EditableCell`. A `useEffect` hook, responsible for applying external updates, now checks this ref. This allows it to ignore updates that originated from the user typing in that same cell, preventing the DOM from being unnecessarily rewritten and the cursor from being reset.

### Gemini API Integration (`utils/geminiApi.ts`)
This utility file is the single point of contact with the Google Gemini API.
*   **Abstraction**: It exports functions like `segmentText` and `getEvaluationAndGrammar`. These functions handle prompt construction, API calls, and JSON response parsing.
*   **API Key**: The API key is sourced from `process.env.API_KEY`. The application must not provide any UI for managing this key.
*   **Structured Output**: All calls request a JSON response from Gemini, ensuring predictable, machine-readable output.

### API Call Optimization
To reduce API calls, the app has been refactored:
1.  **No more timed calls**: The suggestion feature, which relied on a timer during typing, has been completely removed.
2.  **Deferred Evaluation**: The API call to evaluate a translation is only made once the user has completed a segment (e.g., on blur or by pressing Ctrl+Enter), not during typing.
3.  **Batch Processing**: When importing a timed transcript, the entire document is sent in a single API call for segmentation, rather than one call per line.

### Debugging with Bounding Boxes
The UI can be wrapped in named bounding boxes for debugging layout issues. This is controlled by `DisplayContext` and can be toggled via the "Toggle Developer View" button in the header's `View` pane. When off, the `BoundingBox` component renders nothing but its children, ensuring zero impact on the production layout.
