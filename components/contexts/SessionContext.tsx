
import React, { createContext, useContext } from 'react';

export interface SessionContextState {
    activeSegmentId: number | null;
    inputTokenCount: number;
    outputTokenCount: number;
    apiCallCount: number;
    onSegmentFocus: (segmentId: number) => void;
    addTokens: (input: number, output: number, calls: number) => void;
}

const SessionContext = createContext<SessionContextState | undefined>(undefined);

export const SessionProvider: React.FC<{
    value: SessionContextState;
    children: React.ReactNode;
}> = ({ value, children }) => {
    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = (): SessionContextState => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};