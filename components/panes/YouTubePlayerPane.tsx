import React, { useRef, useEffect } from 'react';

// YT might not be on window immediately, so we declare it
declare global {
    interface Window {
        onYouTubeIframeAPIReady?: () => void;
        YT: any;
    }
}

interface YTPlayerProps {
    videoId: string;
    onReady: (player: any) => void;
    onStateChange: (event: any) => void;
    onTimeUpdate: (time: number) => void;
}

export const YTPlayer: React.FC<YTPlayerProps> = ({ videoId, onReady, onStateChange, onTimeUpdate }) => {
    const playerRef = useRef<any>(null); // To hold the YT.Player instance
    const playerContainerRef = useRef<HTMLDivElement>(null); // To hold the div for the iframe
    const timeUpdateInterval = useRef<number | null>(null);

    const onPlayerStateChange = (event: any) => {
        if (event.data === window.YT.PlayerState.PLAYING) {
            if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
            timeUpdateInterval.current = window.setInterval(handleTimeUpdate, 250);
        } else {
            if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
            timeUpdateInterval.current = null;
        }
        onStateChange(event); // Forward the event to the parent
    };
    
    const setupPlayer = () => {
        if (playerRef.current || !videoId || !playerContainerRef.current || !window.YT?.Player) {
            return;
        }

        playerRef.current = new window.YT.Player(playerContainerRef.current, {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                playsinline: 1,
                rel: 0,
                modestbranding: 1,
                controls: 1,
            },
            events: {
                'onReady': (event: any) => {
                    onReady(event.target);
                },
                'onStateChange': onPlayerStateChange
            }
        });
    };

    const handleTimeUpdate = () => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            onTimeUpdate(playerRef.current.getCurrentTime());
        }
    };

    useEffect(() => {
        if (!videoId) return;

        if (window.YT && window.YT.Player) {
            setupPlayer();
        } else {
            window.onYouTubeIframeAPIReady = setupPlayer;
        }

        return () => {
            if (timeUpdateInterval.current) {
                clearInterval(timeUpdateInterval.current);
            }
            if (playerRef.current && typeof playerRef.current.destroy === 'function') {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [videoId]);

    return (
        <div className="aspect-video w-full bg-black relative">
            <div ref={playerContainerRef} className="w-full h-full" id={`yt-player-${videoId}`} />
        </div>
    );
};