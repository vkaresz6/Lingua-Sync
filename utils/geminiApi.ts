
import { GoogleGenAI, Type } from '@google/genai';
import { Segment, EvaluationResult, SourceError, Term, TermUnit, ProjectState, AiQaIssueType } from '../types';
import { STRINGS, DEFAULT_PROMPTS } from '../strings';
import { stripHtml } from './fileHandlers';

export interface ApiResponse<T> {
    data: T;
    inputTokens: number;
    outputTokens: number;
    apiCalls: number;
}

// Helper to construct model configuration, applying special settings for certain models.
const getRequestConfig = (model: string, baseConfig: any): any => {
    // The 'lite' model might not be as reliable with forced JSON output via schema.
    // For this model, we'll remove the schema and rely solely on prompt instructions
    // to generate the JSON, which can be more robust for simpler models.
    if (model === 'gemini-2.5-flash-lite') {
        const liteConfig = { ...baseConfig };
        delete liteConfig.responseMimeType;
        delete liteConfig.responseSchema;
        return liteConfig;
    }
    // For other models like gemini-2.5-flash, using the schema is more reliable.
    return baseConfig;
};

const _fallbackSegmentText = (text: string): string[] => {
    if (!text) return [];
    
    const sentences = text
        .replace(/(\r\n|\n|\r)/gm, " ")
        .replace(/\s+/g, ' ')
        .trim()
        .split(/(?<=[.?!])\s+/);

    return sentences.filter(s => s.trim().length > 0);
};

export interface AiQaIssue {
    segmentIndex: number;
    type: AiQaIssueType;
    description: string;
}

export const segmentText = async (text: string, promptTemplate: string, model: string): Promise<ApiResponse<string[]>> => {
    if (!text || text.trim().length === 0) {
        return { data: [], inputTokens: 0, outputTokens: 0, apiCalls: 0 };
    }
    
    try {
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
        const prompt = promptTemplate.replace(/\${text}/g, text);

        const countInput = await ai.models.countTokens({ model, contents: prompt });
        
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: getRequestConfig(model, {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { sentences: { type: Type.ARRAY, items: { type: Type.STRING } } },
                    required: ["sentences"]
                },
                temperature: 0.0,
            })
        });

        const jsonString = response.text.trim();
        const countOutput = await ai.models.countTokens({ model, contents: jsonString });
        
        const result = JSON.parse(jsonString);
        const segments = (result?.sentences || []).filter((s: unknown) => typeof s === 'string' && s.trim().length > 0);
        
        return { data: segments, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (error) {
        console.error(STRINGS.GEMINI_SEGMENTATION_ERROR, error);
        return { data: _fallbackSegmentText(text), inputTokens: 0, outputTokens: 0, apiCalls: 1 }; // Still counts as an attempt
    }
};

export const batchSegmentTimedText = async (
    timedChunks: { text: string; start: number; end: number }[],
    promptTemplate: string,
    model: string
): Promise<ApiResponse<{ text: string; start: number; end: number }[]>> => {
    if (timedChunks.length === 0) {
        return { data: [], inputTokens: 0, outputTokens: 0, apiCalls: 0 };
    }

    try {
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
        const prompt = promptTemplate.replace(/\${timedChunksJson}/g, JSON.stringify(timedChunks));

        const countInput = await ai.models.countTokens({ model, contents: prompt });

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: getRequestConfig(model, {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        segments: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    text: { type: Type.STRING },
                                    start: { type: Type.NUMBER },
                                    end: { type: Type.NUMBER }
                                },
                                required: ["text", "start", "end"]
                            }
                        }
                    },
                    required: ["segments"]
                },
                temperature: 0.1,
            })
        });

        const jsonString = response.text.trim();
        const countOutput = await ai.models.countTokens({ model, contents: jsonString });

        const result = JSON.parse(jsonString);
        const segments = (result?.segments || []).filter((s: any) => s && typeof s.text === 'string' && typeof s.start === 'number' && typeof s.end === 'number');

        return { data: segments, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (error) {
        console.error("Batch timed segmentation failed:", error);
        // Fallback or rethrow depending on desired behavior
        throw new Error("Failed to process timed transcript with AI.");
    }
};

export const extractTerms = async (fullText: string, documentContext: string, promptTemplate: string, sourceLanguage: string, targetLanguage: string, model: string): Promise<ApiResponse<TermUnit[]>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = promptTemplate
      .replace(/\${documentContext}/g, documentContext || 'General translation.')
      .replace(/\${text}/g, fullText)
      .replace(/\${sourceLanguage}/g, sourceLanguage || "the source language")
      .replace(/\${targetLanguage}/g, targetLanguage || "the target language");
      
    const countInput = await ai.models.countTokens({ model, contents: prompt });
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { 
                    terms: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT,
                            properties: {
                                source: { type: Type.STRING },
                                target: { type: Type.STRING },
                                definition: { type: Type.STRING, description: "A concise definition of the source term in context." }
                            },
                            required: ["source", "target"]
                        } 
                    } 
                },
                required: ["terms"]
            }
        })
    });
    
    const jsonString = response.text.trim();
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        return { data: result.terms || [], inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse terms from Gemini", e, jsonString);
        return { data: [], inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    }
};

export const getDefinition = async (word: string, sourceLanguage: string, targetLanguage: string, promptTemplate: string, model: string): Promise<ApiResponse<string>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = promptTemplate
        .replace(/\${word}/g, word)
        .replace(/\${sourceLanguage}/g, sourceLanguage || "the source language")
        .replace(/\${targetLanguage}/g, targetLanguage || "the target language");
    
    const countInput = await ai.models.countTokens({ model, contents: prompt });
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { definition: { type: Type.STRING } },
                required: ["definition"]
            }
        })
    });
    
    const jsonString = response.text.trim();
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        return { data: result.definition || STRINGS.NO_DEFINITION_FOUND, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse definition from Gemini", e, jsonString);
        return { data: STRINGS.NO_DEFINITION_FOUND, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    }
};

export const getTermSuggestion = async (
    sourceTerm: string,
    documentContext: string,
    sourceLanguage: string,
    targetLanguage: string,
    promptTemplate: string,
    model: string
): Promise<ApiResponse<{ target: string; definition: string }>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = promptTemplate
        .replace(/\${sourceTerm}/g, sourceTerm)
        .replace(/\${sourceLanguage}/g, sourceLanguage || 'the source language')
        .replace(/\${targetLanguage}/g, targetLanguage || 'the target language')
        .replace(/\${documentContext}/g, documentContext || 'general context');

    const countInput = await ai.models.countTokens({ model, contents: prompt });
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    target: { type: Type.STRING },
                    definition: { type: Type.STRING }
                },
                required: ["target", "definition"]
            }
        })
    });
    
    const jsonString = response.text.trim();
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        return { data: result, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse term suggestion from Gemini", e, jsonString);
        return { data: { target: '', definition: '' }, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    }
};

export const getTranslation = async (
    sourceText: string,
    documentContext: string,
    sourceLanguage: string,
    targetLanguage: string,
    promptTemplate: string,
    model: string
): Promise<ApiResponse<string[]>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = promptTemplate
        .replace(/\${sourceLanguage}/g, sourceLanguage || 'the source language')
        .replace(/\${targetLanguage}/g, targetLanguage || 'the target language')
        .replace(/\${documentContext}/g, documentContext || 'general context')
        .replace(/\${sourceText}/g, sourceText);

    const countInput = await ai.models.countTokens({ model, contents: prompt });

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    translations: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ["translations"]
            }
        })
    });
    
    const jsonString = response.text.trim();
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        const translations = result.translations || [];
        return { data: translations, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse translations from Gemini", e, jsonString);
        return { data: [], inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    }
};

export const batchTranslateSegments = async (
    sourceTexts: string[],
    documentContext: string,
    sourceLanguage: string,
    targetLanguage: string,
    promptTemplate: string,
    model: string
): Promise<ApiResponse<string[]>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = promptTemplate
        .replace(/\${sourceLanguage}/g, sourceLanguage || 'the source language')
        .replace(/\${targetLanguage}/g, targetLanguage || 'the target language')
        .replace(/\${documentContext}/g, documentContext || 'general context')
        .replace(/\${sourceTextsJson}/g, JSON.stringify(sourceTexts));

    const countInput = await ai.models.countTokens({ model, contents: prompt });

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.2, // Lower temp for more predictable translations
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    translations: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ["translations"]
            }
        })
    });
    
    const jsonString = response.text.trim();
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        const translations = result.translations || [];
        if (translations.length !== sourceTexts.length) {
            throw new Error(`API returned ${translations.length} translations, but ${sourceTexts.length} were expected.`);
        }
        return { data: translations, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse batch translations from Gemini", e, jsonString);
        // Throw the error up so the UI can handle it
        throw e;
    }
};

export const getQuickTranslation = async (
    text: string, 
    context: string,
    sourceLanguage: string, 
    targetLanguage: string, 
    promptTemplate: string, 
    model: string
): Promise<ApiResponse<string>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = promptTemplate
        .replace(/\${text}/g, text)
        .replace(/\${context}/g, context)
        .replace(/\${sourceLanguage}/g, sourceLanguage || "the source language")
        .replace(/\${targetLanguage}/g, targetLanguage || "the target language");
    
    const countInput = await ai.models.countTokens({ model, contents: prompt });
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { translation: { type: Type.STRING } },
                required: ["translation"]
            }
        })
    });
    
    const jsonString = response.text.trim();
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        return { data: result.translation || "Translation not found.", inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse translation from Gemini", e, jsonString);
        return { data: "Translation failed.", inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    }
};

export const getEvaluationAndGrammar = async (
    sourceText: string,
    targetText: string,
    documentContext: string,
    previousContext: string,
    sourceLanguage: string,
    targetLanguage: string,
    promptTemplate: string,
    model: string
): Promise<ApiResponse<{ evaluation: EvaluationResult, errors: SourceError[] }>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = promptTemplate
        .replace(/\${sourceLanguage}/g, sourceLanguage || 'the source language')
        .replace(/\${targetLanguage}/g, targetLanguage || 'the target language')
        .replace(/\${documentContext}/g, documentContext || 'general context')
        .replace(/\${context}/g, previousContext || 'No previous segments.')
        .replace(/\${sourceText}/g, sourceText)
        .replace(/\${targetText}/g, targetText);

    const countInput = await ai.models.countTokens({ model, contents: prompt });
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    evaluation: {
                        type: Type.OBJECT,
                        properties: {
                            rating: { type: Type.NUMBER, description: "A score from 1-5 for quality" },
                            consistency: { type: Type.NUMBER, description: "A score from 1-5 for consistency" },
                            feedback: { type: Type.STRING, description: "Textual feedback" }
                        },
                        required: ["rating", "feedback", "consistency"]
                    },
                    errors: {
                        type: Type.ARRAY,
                        description: "Grammatical or spelling errors found in the translation.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                error: { type: Type.STRING, description: "The incorrect phrase" },
                                correction: { type: Type.STRING, description: "The suggested fix" },
                                explanation: { type: Type.STRING, description: "Why it was an error" }
                            },
                            required: ["error", "correction", "explanation"]
                        }
                    }
                },
                required: ["evaluation", "errors"]
            }
        })
    });
    
    const jsonString = response.text.trim();
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        const data = {
            evaluation: result.evaluation || { rating: 0, feedback: "Invalid response from AI." },
            errors: result.errors || []
        };
        return { data, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse evaluation from Gemini", e, jsonString);
        throw new Error("Failed to parse evaluation response from AI.");
    }
};

export const batchEvaluateSegments = async (
    segmentsToEvaluate: { id: number, sourceText: string, targetText: string }[],
    documentContext: string,
    sourceLanguage: string,
    targetLanguage: string,
    promptTemplate: string,
    model: string
): Promise<ApiResponse<{ id: number; evaluation: EvaluationResult; errors: SourceError[] }[]>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = promptTemplate
        .replace(/\${sourceLanguage}/g, sourceLanguage || 'the source language')
        .replace(/\${targetLanguage}/g, targetLanguage || 'the target language')
        .replace(/\${documentContext}/g, documentContext || 'general context')
        .replace(/\${segmentsJson}/g, JSON.stringify(segmentsToEvaluate));

    const countInput = await ai.models.countTokens({ model, contents: prompt });

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    evaluations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.NUMBER },
                                evaluation: {
                                    type: Type.OBJECT,
                                    properties: {
                                        rating: { type: Type.NUMBER },
                                        consistency: { type: Type.NUMBER },
                                        feedback: { type: Type.STRING }
                                    },
                                    required: ["rating", "consistency", "feedback"]
                                },
                                errors: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            error: { type: Type.STRING },
                                            correction: { type: Type.STRING },
                                            explanation: { type: Type.STRING }
                                        },
                                        required: ["error", "correction", "explanation"]
                                    }
                                }
                            },
                            required: ["id", "evaluation", "errors"]
                        }
                    }
                },
                required: ["evaluations"]
            }
        })
    });
    
    const jsonString = response.text.trim();
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        return { data: result.evaluations || [], inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse batch evaluations from Gemini", e, jsonString);
        throw e;
    }
};

export const getRebuiltDocumentXml = async (
    originalDocumentXml: string,
    translationsJson: string,
    promptTemplate: string,
    model: string
): Promise<ApiResponse<{ rebuiltXml: string, rawResponse: string }>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = (promptTemplate || '')
        .replace(/\${originalDocumentXml}/g, originalDocumentXml)
        .replace(/\${translationsJson}/g, translationsJson);

    const countInput = await ai.models.countTokens({ model, contents: prompt });

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.0,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { rebuiltXml: { type: Type.STRING } },
                required: ["rebuiltXml"]
            }
        })
    });

    let jsonString = response.text.trim();
    if (jsonString.startsWith('```json')) {
        jsonString = jsonString.substring(7, jsonString.length - 3).trim();
    } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.substring(3, jsonString.length - 3).trim();
    }
    
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        let rebuiltXml = result.rebuiltXml || originalDocumentXml;
        
        // Also clean the XML string itself for markdown
        if (rebuiltXml.startsWith('```xml')) {
            rebuiltXml = rebuiltXml.substring(7, rebuiltXml.length - 3).trim();
        } else if (rebuiltXml.startsWith('```')) {
            rebuiltXml = rebuiltXml.substring(3, rebuiltXml.length - 3).trim();
        }

        return { data: { rebuiltXml, rawResponse: jsonString }, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse rebuilt document XML from Gemini", e, jsonString);
        // Fallback to original XML to avoid breaking the document
        return { data: { rebuiltXml: originalDocumentXml, rawResponse: `ERROR: ${e}` }, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    }
};

export const runAiQaCheck = async (
    segments: Segment[],
    documentContext: string,
    sourceLanguage: string,
    targetLanguage: string,
    promptTemplate: string,
    model: string
): Promise<ApiResponse<AiQaIssue[]>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

    const formattedSegments = segments
        .map((seg, index) => `${index + 1}. Source: "${stripHtml(seg.source)}"\n   Target: "${stripHtml(seg.target)}"`)
        .join('\n');

    const finalPromptTemplate = promptTemplate || DEFAULT_PROMPTS.aiQaCheck;

    const prompt = finalPromptTemplate
        .replace(/\${targetLanguage}/g, targetLanguage)
        .replace(/\${sourceLanguage}/g, sourceLanguage)
        .replace(/\${documentContext}/g, documentContext || 'general context')
        .replace(/\${formattedSegments}/g, formattedSegments);

    const countInput = await ai.models.countTokens({ model, contents: prompt });

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    issues: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                segmentIndex: { type: Type.NUMBER, description: "The 1-based index of the segment with the issue." },
                                type: { type: Type.STRING, enum: ['TONAL_INCONSISTENCY', 'FORMALITY_MISMATCH', 'CULTURAL_RED_FLAG', 'READABILITY_ISSUE', 'TRANSLATION_INCONSISTENCY'] },
                                description: { type: Type.STRING, description: "A detailed description of the issue." }
                            },
                            required: ["segmentIndex", "type", "description"]
                        }
                    }
                },
                required: ["issues"]
            }
        })
    });
    
    const jsonString = response.text.trim();
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        return { data: result.issues || [], inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse AI QA check from Gemini", e, jsonString);
        throw new Error("Failed to parse AI QA check response.");
    }
};

export const inflectTerm = async (
    baseTerm: { source: string; target: string },
    sourceSentence: string,
    targetSentence: string,
    promptTemplate: string,
    model: string,
): Promise<ApiResponse<string>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = promptTemplate
        .replace(/\${sourceSentence}/g, sourceSentence)
        .replace(/\${targetSentence}/g, targetSentence)
        .replace(/\${baseTranslation}/g, baseTerm.target);
    
    const countInput = await ai.models.countTokens({ model, contents: prompt });
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { inflection: { type: Type.STRING } },
                required: ["inflection"]
            }
        })
    });

    const jsonString = response.text.trim();
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        return { data: result.inflection || baseTerm.target, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse inflection from Gemini", e, jsonString);
        return { data: baseTerm.target, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    }
};

export const analyzeStructure = async (text: string, promptTemplate: string, sourceLanguage: string, targetLanguage: string, model: string): Promise<ApiResponse<string>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = promptTemplate
        .replace(/\${text}/g, text)
        .replace(/\${sourceLanguage}/g, sourceLanguage || "the source language")
        .replace(/\${targetLanguage}/g, targetLanguage || "the target language");

    const countInput = await ai.models.countTokens({ model, contents: prompt });

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { html: { type: Type.STRING } },
                required: ["html"]
            }
        })
    });

    const jsonString = response.text.trim();
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        return { data: result.html || text, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse structure HTML from Gemini", e, jsonString);
        return { data: text, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    }
};

export const analyzeDates = async (text: string, promptTemplate: string, sourceLanguage: string, targetLanguage: string, model: string): Promise<ApiResponse<string>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = promptTemplate
        .replace(/\${text}/g, text)
        .replace(/\${sourceLanguage}/g, sourceLanguage || "the source language")
        .replace(/\${targetLanguage}/g, targetLanguage || "the target language");

    const countInput = await ai.models.countTokens({ model, contents: prompt });

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { html: { type: Type.STRING } },
                required: ["html"]
            }
        })
    });

    const jsonString = response.text.trim();
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        return { data: result.html || text, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse date HTML from Gemini", e, jsonString);
        return { data: text, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    }
};

export const correctPunctuation = async (text: string, promptTemplate: string, model: string): Promise<ApiResponse<string>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = promptTemplate.replace(/\${text}/g, text);

    const countInput = await ai.models.countTokens({ model, contents: prompt });

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { correctedText: { type: Type.STRING } },
                required: ["correctedText"]
            }
        })
    });

    const jsonString = response.text.trim();
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        return { data: result.correctedText || text, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse corrected punctuation from Gemini", e, jsonString);
        return { data: text, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    }
};

export const correctGrammarInHtml = async (htmlText: string, promptTemplate: string, model: string): Promise<ApiResponse<string>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = promptTemplate.replace(/\${htmlText}/g, htmlText);

    const countInput = await ai.models.countTokens({ model, contents: prompt });

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { correctedHtml: { type: Type.STRING } },
                required: ["correctedHtml"]
            }
        })
    });

    const jsonString = response.text.trim();
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        return { data: result.correctedHtml || htmlText, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse corrected HTML from Gemini", e, jsonString);
        return { data: htmlText, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    }
};

export const correctTranscription = async (
    existingText: string,
    transcribedText: string,
    promptTemplate: string,
    model: string
): Promise<ApiResponse<string>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = promptTemplate
        .replace(/\${existingText}/g, existingText)
        .replace(/\${transcribedText}/g, transcribedText);

    const countInput = await ai.models.countTokens({ model, contents: prompt });

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { correctedText: { type: Type.STRING } },
                required: ["correctedText"]
            }
        })
    });

    const jsonString = response.text.trim();
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        return { data: result.correctedText || (existingText + ' ' + transcribedText), inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse corrected transcription from Gemini", e, jsonString);
        return { data: existingText + ' ' + transcribedText, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    }
};

export const syncFormatting = async (sourceHtml: string, targetText: string, promptTemplate: string, model: string): Promise<ApiResponse<string>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = promptTemplate
        .replace(/\${sourceHtml}/g, sourceHtml)
        .replace(/\${targetText}/g, targetText);

    const countInput = await ai.models.countTokens({ model, contents: prompt });

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { formattedHtml: { type: Type.STRING } },
                required: ["formattedHtml"]
            }
        })
    });

    const jsonString = response.text.trim();
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        return { data: result.formattedHtml || `<p>${targetText}</p>`, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse formatted HTML from Gemini", e, jsonString);
        return { data: `<p>${targetText}</p>`, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    }
};

export const batchSyncFormatting = async (
    segmentsToFormat: { id: number, sourceHtml: string, targetText: string }[],
    promptTemplate: string,
    model: string
): Promise<ApiResponse<{ id: number; formattedHtml: string; }[]>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = promptTemplate
        .replace(/\${batchDataJson}/g, JSON.stringify(segmentsToFormat));

    const countInput = await ai.models.countTokens({ model, contents: prompt });

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    results: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.NUMBER },
                                formattedHtml: { type: Type.STRING }
                            },
                            required: ["id", "formattedHtml"]
                        }
                    }
                },
                required: ["results"]
            }
        })
    });

    const jsonString = response.text.trim();
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        return { data: result.results || [], inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse batch formatted HTML from Gemini", e, jsonString);
        // Fallback: return original text wrapped in <p> tags
        const fallbackData = segmentsToFormat.map(s => ({ id: s.id, formattedHtml: `<p>${s.targetText}</p>` }));
        return { data: fallbackData, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    }
};

export const splitSegment = async (
    sourceHtml: string,
    targetHtml: string,
    contextPhrase: string,
    promptTemplate: string,
    model: string
): Promise<ApiResponse<{ sourceHtml1: string; sourceHtml2: string; targetHtml1: string; targetHtml2: string }>> => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = promptTemplate
        .replace(/\${sourceHtml}/g, sourceHtml)
        .replace(/\${targetHtml}/g, targetHtml || '') // Handle cases where target is null/undefined
        .replace(/\${contextPhrase}/g, contextPhrase);

    const countInput = await ai.models.countTokens({ model, contents: prompt });
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: getRequestConfig(model, {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    sourceHtml1: { type: Type.STRING },
                    sourceHtml2: { type: Type.STRING },
                    targetHtml1: { type: Type.STRING },
                    targetHtml2: { type: Type.STRING }
                },
                required: ["sourceHtml1", "sourceHtml2", "targetHtml1", "targetHtml2"]
            }
        })
    });
    
    const jsonString = response.text.trim();
    const countOutput = await ai.models.countTokens({ model, contents: jsonString });

    try {
        const result = JSON.parse(jsonString);
        return { data: result, inputTokens: countInput.totalTokens, outputTokens: countOutput.totalTokens, apiCalls: 1 };
    } catch (e) {
        console.error("Failed to parse split HTML from Gemini", e, jsonString);
        throw new Error("Failed to parse split HTML response from AI.");
    }
};
