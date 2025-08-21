import React from 'react';

interface TermTooltipProps {
    content: string;
    position: { x: number; y: number };
}

export const TermTooltip: React.FC<TermTooltipProps> = ({ content, position }) => {
    const style = {
        top: position.y + 15,
        left: position.x + 15,
        transform: 'translate(-50%, 0)', // Center it horizontally relative to the cursor
    };

    return (
        <div style={style} className="fixed z-50 pointer-events-none">
            <div
                className="bg-slate-800 text-white text-sm font-semibold rounded-md shadow-lg px-3 py-1.5 animate-fade-in-fast"
            >
                {content}
            </div>
             <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; transform: translate(-50%, -10px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .animate-fade-in-fast {
                    animation: fade-in-fast 0.1s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
