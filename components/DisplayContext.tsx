
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface DisplayContextType {
    showBoundingBoxes: boolean;
    toggleBoundingBoxes: () => void;
}

const DisplayContext = createContext<DisplayContextType | undefined>(undefined);

export const DisplayProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [showBoundingBoxes, setShowBoundingBoxes] = useState(false);

    const toggleBoundingBoxes = () => {
        setShowBoundingBoxes(prev => !prev);
    };

    return (
        <DisplayContext.Provider value={{ showBoundingBoxes, toggleBoundingBoxes }}>
            {children}
        </DisplayContext.Provider>
    );
};

export const useDisplay = (): DisplayContextType => {
    const context = useContext(DisplayContext);
    if (context === undefined) {
        throw new Error('useDisplay must be used within a DisplayProvider');
    }
    return context;
};
