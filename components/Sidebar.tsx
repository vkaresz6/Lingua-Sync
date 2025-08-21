
import React, { useRef, useState } from 'react';
import { BoundingBox } from './BoundingBox';
import { PaneId } from '../types';

interface SidebarProps {
    children: React.ReactNode;
    onReorder: (dragIndex: number, hoverIndex: number) => void;
    onDropPane: (paneId: PaneId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ children, onReorder, onDropPane }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = 'move';

        // Set paneId for cross-panel dropping
        const childArray = React.Children.toArray(children);
        const draggedChild = childArray[index];
        if (React.isValidElement(draggedChild) && draggedChild.key) {
            e.dataTransfer.setData('paneId', String(draggedChild.key));
        }

        // Use a timeout to allow the browser to render the ghost image before we apply our class
        setTimeout(() => {
            const el = e.target as HTMLElement;
            el.closest('.widget-container')?.classList.add('drag-ghost');
        }, 0);
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        dragOverItem.current = index;
    };
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "move";
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        
        // Handle dropping a tab from the bottom panel
        const paneId = e.dataTransfer.getData('paneId') as PaneId;
        if (paneId) {
            onDropPane(paneId);
        }
        // Handle reordering within the sidebar
        else if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            onReorder(dragItem.current, dragOverItem.current);
        }
        
        dragItem.current = null;
        dragOverItem.current = null;
        setIsDraggingOver(false);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        (e.target as HTMLElement).closest('.widget-container')?.classList.remove('drag-ghost');
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const childArray = React.Children.toArray(children);

    return (
        <BoundingBox name="sidebar" className="h-full !m-0 !p-0">
            <aside 
                className={`h-full w-full bg-slate-100 p-2 space-y-2 overflow-y-auto transition-colors ${isDraggingOver ? 'bg-indigo-100' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {React.Children.map(children, (child, index) => (
                    <div 
                        className="widget-container h-1/4 min-h-[150px]"
                        onDragEnter={(e) => handleDragEnter(e, index)}
                    >
                        {React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<any>, { 
                            onDragStart: (e: React.DragEvent) => handleDragStart(e, index),
                            onDragEnd: handleDragEnd,
                            draggable: true
                        }) : child}
                    </div>
                ))}
                {childArray.length === 0 && (
                     <div className="h-full flex items-center justify-center text-center text-slate-500 text-sm p-4 border-2 border-dashed border-slate-300 rounded-lg">
                        <p>Drop panels here from the bottom bar to add them to the sidebar.</p>
                    </div>
                )}
            </aside>
        </BoundingBox>
    );
};
