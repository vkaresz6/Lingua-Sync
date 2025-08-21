# LinguaSync - User Manual

## 1. Introduction

Welcome to **LinguaSync**, your AI-powered Computer-Assisted Translation (CAT) Tool! This application is designed to help you translate documents efficiently by leveraging the power of Google's Gemini AI. It segments your text, evaluates your translations, and helps you spot grammatical errors.

## 2. Getting Started

### Opening a Document
1.  On the project list screen, click **Create from File**.
2.  Select a supported file from your computer. Supported formats are:
    *   `.docx` (Microsoft Word) - For starting a new translation.
    *   `.pdf` (Portable Document Format) - For starting a new translation.
    *   `.lingua` (LinguaSync Project) - For resuming a previous session.
3.  If you are opening a `.docx` or `.pdf` file, a **New Project Setup** popup will appear.

### Document Context
This is a crucial step for high-quality AI assistance. In the text box, describe the document you are translating. For example:
*   *“This is a marketing brochure for a new tech product aimed at a general audience. The tone should be enthusiastic and not overly technical.”*
*   *“This is a legal contract. The language must be precise and formal.”*

This context helps Gemini provide more accurate evaluations. Click **Create Project** to proceed. If you open a `.lingua` file, you will bypass this step and your project will load instantly.

## 3. Saving & Managing Your Work

### Saving a Project
- **Local Projects**: Your work is automatically saved to your browser's local storage every 30 seconds. You can also manually save by downloading a `.lingua` project file.
- **GitHub Projects**: To save, you must "Sync with GitHub" via the button in the header. This commits your changes to the repository.

### Exporting Your Translation
When your translation is complete, you can export it as a clean document.
1.  Select the **File** tab in the header. Click your desired export button:
    *   **Export as DOCX**: Creates a document containing only your translated text.
    *   **Export as PDF**: Creates a PDF document containing only your translated text.
    *   **Export as SRT**: (For subtitle projects) Creates a `.srt` subtitle file.

## 4. The Main Interface

The interface is divided into three main parts:

1.  **Header**: Contains panes for actions like opening, saving, exporting, and changing settings. You can switch between **File**, **Edit**, and **GitHub** toolbars.
2.  **Segment Table**: The main workspace where you see the source text and write your translation.
3.  **Side and Bottom Panels**: Show AI-powered feedback, machine translation options, and other tools.

## 5. Translating a Document

### The Segment Table
*   **Source Column**: Displays the original text, one segment (usually a sentence) per row.
*   **Target Column**: This is where you type your translation for the corresponding source segment.

### The Translation Workflow
1.  Click on a target cell to start typing. The active row will be highlighted.
2.  Once you are finished with a segment, press **Ctrl+Enter** (or **Cmd+Enter** on Mac). This does two things:
    *   It triggers an AI evaluation of your translation.
    *   It automatically moves your cursor to the next segment.
3.  After evaluation, you will see a colored quality indicator in the target cell and feedback in the **Evaluation** panel.

### Text Formatting
1.  In the header, click the **Edit** tab to show the formatting toolbar.
2.  In an active target segment, select the text you want to format.
3.  Click the desired formatting button on the toolbar (e.g., **B** for bold, **I** for italic).

**Note:** Formatting is preserved when exporting to DOCX and PDF.

### Understanding Feedback
*   **Quality Indicator**: A small square in the top-right of the target cell. Its color indicates quality (Green = Perfect, Yellow/Orange = Minor Errors, Red = Major Errors).
*   **Grammar Errors**: Any detected errors in the target text will be highlighted with a red wavy underline. Hover your mouse over the red text to see the suggested correction and an explanation.
*   **Evaluation Panel**: Provides detailed textual feedback on your translation's quality after you complete a segment.

## 6. Advanced Features

### Joining & Splitting Segments
If you find that the text was segmented incorrectly, you can fix it.
*   **Join**: **Right-click** on the segment you want to join with the one below it and select **Join with Segment Below**.
*   **Split**: Place your cursor in the target cell where you want to split the segment, **right-click**, and select **Split Segment**.

### Settings
In the **File** tab, click the **Settings** button (sliders icon). This opens the prompt settings, where you can customize the instructions given to Gemini. This is for advanced users who want to fine-tune the AI's behavior.

### Toggling Bounding Boxes
In the **View** pane in the header, click the **Toggle Developer View** button (layout icon) to show or hide the blue-dashed bounding boxes. These are a visual aid for developers.

## 7. Usage Stats
In the bottom-right corner of the bottom panel, you can find counters for API calls and tokens used, helping you monitor your usage.
