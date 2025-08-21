import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Segment } from '../types';
import { YTPlayer } from './panes/YouTubePlayerPane';
import { Timeline } from './Timeline';
import { SubtitleSegmentRow } from './SubtitleSegmentRow';
import { useProject } from './contexts/ProjectContext';

interface SubtitleEditorProps {
    segments: Segment[];
    onSegmentChange: (segmentId: number, newText: string) => void;
    onSegmentFocus: (segmentId: number) => void;
    onSegmentComplete: (segmentId: number) => void;
    onUpdateSegmentTimes: (segmentId: number, start: number, end: number) => void;
    videoCurrentTime: number;
    onTimeUpdate: (time: number) => void;
    videoDuration: number;
    onDurationChange: (duration: number) => void;
    activeSegmentId: number | null;
    evaluatingSegmentId: number | null;
}

const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const SubtitleEditor: React.FC<SubtitleEditorProps> = (props) => {
    const {
        segments, onSegmentChange, onSegmentFocus, onSegmentComplete, onUpdateSegmentTimes,
        videoCurrentTime, onTimeUpdate, videoDuration, onDurationChange, activeSegmentId,
        evaluatingSegmentId
    } = props;

    const { project } = useProject();
    const videoId = getYouTubeId(project.youtubeUrl || '');
    const playerRef = useRef<any>(null);
    const activeSegmentRef = useRef<HTMLDivElement>(null);

    const onPlayerReady = (player: any) => {
        playerRef.current = player;
        onDurationChange(player.getDuration());
    };

    const onPlayerStateChange = (event: any) => {
        // This can be used for future enhancements, e.g., auto-pausing.
    };
    
    const handleTimelineClick = (time: number) => {
        if (playerRef.current) {
            playerRef.current.seekTo(time, true);
        }
    };
    
    // Auto-focus segment when video plays into it
    useEffect(() => {
        const activeSegment = segments.find(s => videoCurrentTime >= s.startTime! && videoCurrentTime < s.endTime!);
        if (activeSegment && activeSegment.id !== activeSegmentId) {
            onSegmentFocus(activeSegment.id);
        }
    }, [videoCurrentTime, segments, activeSegmentId, onSegmentFocus]);

    // Scroll active segment into view
    useEffect(() => {
        activeSegmentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [activeSegmentId]);

    if (!videoId) {
        return <div className="text-center p-8 text-slate-500">Error: YouTube video ID not found.</div>
    }

    return (
        <div className="h-full flex flex-row gap-4">
            <div className="flex-1 flex flex-col gap-4">
                <YTPlayer 
                    videoId={videoId}
                    onReady={onPlayerReady}
                    onStateChange={onPlayerStateChange}
                    onTimeUpdate={onTimeUpdate}
                />

                <Timeline 
                    segments={segments}
                    duration={videoDuration}
                    currentTime={videoCurrentTime}
                    onClick={handleTimelineClick}
                    activeSegmentId={activeSegmentId}
                />
            </div>
            
            <div className="flex-1 bg-white rounded-lg shadow-md overflow-y-auto p-2 space-y-2">
                {segments.map((segment) => {
                    const isActive = segment.id === activeSegmentId;
                    return (
                        <div ref={isActive ? activeSegmentRef : null} key={segment.id}>
                            <SubtitleSegmentRow
                                segment={segment}
                                onFocus={() => onSegmentFocus(segment.id)}
                                onTargetChange={(newText) => onSegmentChange(segment.id, newText)}
                                onTimeChange={onUpdateSegmentTimes}
                                onComplete={onSegmentComplete}
                                isActive={isActive}
                                evaluatingSegmentId={evaluatingSegmentId}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
