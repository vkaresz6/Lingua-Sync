import React from 'react';
import { Segment } from '../types';

interface TimelineProps {
    segments: Segment[];
    duration: number;
    currentTime: number;
    onClick: (time: number) => void;
    activeSegmentId: number | null;
}

export const Timeline: React.FC<TimelineProps> = ({ segments, duration, currentTime, onClick, activeSegmentId }) => {
    
    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        onClick(duration * percentage);
    };

    if (duration === 0) return null;

    return (
        <div className="timeline" onClick={handleTimelineClick}>
            {segments.map(segment => {
                if (typeof segment.startTime !== 'number' || typeof segment.endTime !== 'number') return null;
                
                const left = (segment.startTime / duration) * 100;
                const width = ((segment.endTime - segment.startTime) / duration) * 100;
                
                return (
                    <div
                        key={segment.id}
                        className={`timeline-segment ${segment.id === activeSegmentId ? 'active' : ''}`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={segment.source}
                    />
                );
            })}
            <div 
                className="playhead" 
                style={{ left: `${(currentTime / duration) * 100}%` }}
            />
        </div>
    );
};