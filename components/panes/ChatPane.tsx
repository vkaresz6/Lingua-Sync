
import React, { useState, useRef, useEffect } from 'react';
import { BoundingBox } from '../BoundingBox';
import { ChatMessage } from '../../types';
import { STRINGS } from '../../strings';

interface ChatPaneProps {
    messages: ChatMessage[];
    isLoading: boolean;
    handleSendMessage: (message: string) => void;
}

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);

const LoadingSpinner = () => (
    <div className="flex gap-2 items-center">
        <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm text-slate-500">{STRINGS.CHAT_THINKING}</span>
    </div>
);

export const ChatPane: React.FC<ChatPaneProps> = ({ messages, isLoading, handleSendMessage }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = () => {
        if (input.trim()) {
            handleSendMessage(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <BoundingBox name="chat pane" className="h-full w-full flex flex-col bg-slate-50 border border-slate-300 rounded-md overflow-hidden">
            <div className="flex-grow p-3 space-y-4 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-xs md:max-w-sm lg:max-w-md rounded-lg px-3 py-2 text-sm ${
                                msg.role === 'user'
                                    ? 'bg-indigo-600 text-white'
                                    : msg.role === 'system'
                                    ? 'bg-slate-200 text-slate-600 italic'
                                    : 'bg-white text-slate-800 border border-slate-200'
                            }`}
                        >
                            {msg.parts.map((part, i) => <p key={i}>{part.text}</p>)}
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                        <div className="bg-white text-slate-800 border border-slate-200 rounded-lg px-3 py-2">
                             <LoadingSpinner />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-2 border-t border-slate-200 bg-white">
                <div className="flex items-center gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={STRINGS.CHAT_PLACEHOLDER}
                        className="flex-grow resize-none border border-slate-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        rows={1}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
                        title={STRINGS.CHAT_SEND_BUTTON_TITLE}
                    >
                        <SendIcon />
                    </button>
                </div>
            </div>
        </BoundingBox>
    );
};