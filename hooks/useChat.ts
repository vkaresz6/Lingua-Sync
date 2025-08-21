
import { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { ChatMessage, Segment } from '../types';
import { useProject } from '../components/contexts/ProjectContext';
import { stripHtml } from '../utils/fileHandlers';
import { STRINGS } from '../strings';

export const useChat = (segments: Segment[]) => {
    const { project, settings } = useProject();
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isChatInitializing, setIsChatInitializing] = useState<boolean>(false);

    useEffect(() => {
        const initializeChat = async () => {
            setIsChatInitializing(true);
            try {
                const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
                const systemInstruction = settings.prompts.chatSystemInstruction
                    .replace(/\${sourceLanguage}/g, project.sourceLanguage || 'the source language')
                    .replace(/\${targetLanguage}/g, project.targetLanguage || 'the target language')
                    .replace(/\${documentContext}/g, project.context || 'general context');

                const newChat = ai.chats.create({
                    model: settings.model,
                    config: { systemInstruction },
                });
                setChat(newChat);

                const fullSourceText = segments.map(s => stripHtml(s.source)).join('\n\n');
                const initialUserMessage = `Here is the full source document I will be translating:\n\n---\n\n${fullSourceText}`;
                
                setMessages([{ role: 'user', parts: [{ text: initialUserMessage }], isPending: true }]);
                setIsLoading(true);

                const response = await newChat.sendMessage({ message: initialUserMessage });

                setMessages([
                    { role: 'user', parts: [{ text: initialUserMessage }] },
                    { role: 'model', parts: [{ text: response.text }] },
                ]);

            } catch (error) {
                console.error(STRINGS.COULD_NOT_INITIALIZE_CHAT, error);
                setMessages([{ role: 'system', parts: [{text: STRINGS.COULD_NOT_INITIALIZE_CHAT}] }]);
            } finally {
                setIsChatInitializing(false);
                setIsLoading(false);
            }
        };

        if (!chat && settings.prompts.chatSystemInstruction && segments.length > 0) {
            initializeChat();
        }
    }, [settings, project, segments, chat]);

    const handleSendMessage = useCallback(async (message: string) => {
        if (!chat || isLoading) return;
        
        const userMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await chat.sendMessage({ message });
            const modelMessage: ChatMessage = { role: 'model', parts: [{ text: response.text }] };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: ChatMessage = { role: 'system', parts: [{ text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}` }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [chat, isLoading]);

    return {
        messages,
        isLoading,
        isChatInitializing,
        handleSendMessage,
    };
};