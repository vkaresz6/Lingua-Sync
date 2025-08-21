import React, { useState, useEffect, useRef } from 'react';

export interface InsertableItem {
    type: 'tag' | 'term' | 'date';
    display: string;
    value: string;
}

interface InsertionMenuProps {
    items: InsertableItem[];
    position: { top: number; left: number };
    onInsert: (value: string) => void;
    onClose: () => void;
}

const getItemIcon = (type: InsertableItem['type']) => {
    const iconStyles: React.CSSProperties = {
        width: '3.5rem',
        textAlign: 'center',
        padding: '0.125rem 0.25rem',
        borderRadius: '0.25rem',
        fontSize: '0.7rem',
        fontWeight: 600,
        color: '#fff',
        flexShrink: 0,
    };
    switch (type) {
        case 'tag':
            return <span style={{ ...iconStyles, backgroundColor: '#64748b' }}>TAG</span>;
        case 'term':
            return <span style={{ ...iconStyles, backgroundColor: '#4f46e5' }}>TERM</span>;
        case 'date':
            return <span style={{ ...iconStyles, backgroundColor: '#0ea5e9' }}>DATE</span>;
        default:
            return null;
    }
};

export const InsertionMenu: React.FC<InsertionMenuProps> = ({ items, position, onInsert, onClose }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % items.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (items[selectedIndex]) {
                    onInsert(items[selectedIndex].value);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [items, selectedIndex, onInsert, onClose]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    useEffect(() => {
        listRef.current?.children[selectedIndex]?.scrollIntoView({
            block: 'nearest',
        });
    }, [selectedIndex]);

    if (items.length === 0) {
        // Automatically close if there are no items after a short delay
        setTimeout(onClose, 1000);
        return (
            <div style={position} className="fixed z-50 bg-white rounded-md shadow-lg border border-slate-200 p-2 text-sm text-slate-500">
                No insertable items found.
            </div>
        );
    }
    
    return (
        <div ref={menuRef} style={position} className="fixed z-50 bg-white rounded-md shadow-lg border border-slate-200 w-72 max-h-80 overflow-y-auto animate-fade-in-fast">
            <ul ref={listRef}>
                {items.map((item, index) => (
                    <li key={index}>
                        <button
                            onClick={() => onInsert(item.value)}
                            onMouseOver={() => setSelectedIndex(index)}
                            className={`w-full text-left p-2 text-sm flex items-center gap-3 ${selectedIndex === index ? 'bg-indigo-100 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                        >
                            {getItemIcon(item.type)}
                            <span className="truncate flex-grow">{item.display}</span>
                        </button>
                    </li>
                ))}
            </ul>
             <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-fast {
                    animation: fade-in-fast 0.1s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
