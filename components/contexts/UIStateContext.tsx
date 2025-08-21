
import React, { createContext, useState, useContext, useCallback } from 'react';

export type ModalType =
  | 'settings'
  | 'commit'
  | 'push'
  | 'manageTms'
  | 'manageTermDbs'
  | 'loadTermDb'
  | 'sync'
  | 'qaReport'
  | 'autoTranslate'
  | 'connectGitHub'
  | 'manageUsers'
  | 'definition'
  | 'newTerm'
  | 'dictation'
  | 'statisticsReport';

export type ModalPayload = {
    word?: string;
    position?: { x: number; y: number };
    sourceTerm?: string;
    segmentId?: number;
    originalText?: string;
};

export type ActiveModal = {
    type: ModalType;
    payload?: ModalPayload;
} | null;


export interface UIStateContextState {
    activeModal: ActiveModal;
    openModal: (type: ModalType, payload?: ModalPayload) => void;
    closeModal: () => void;
}

const UIStateContext = createContext<UIStateContextState | undefined>(undefined);

export const UIStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeModal, setActiveModal] = useState<ActiveModal>(null);

    const openModal = useCallback((type: ModalType, payload?: ModalPayload) => {
        setActiveModal({ type, payload });
    }, []);

    const closeModal = useCallback(() => {
        setActiveModal(null);
    }, []);

    const value = { activeModal, openModal, closeModal };

    return (
        <UIStateContext.Provider value={value}>
            {children}
        </UIStateContext.Provider>
    );
};

export const useUIState = (): UIStateContextState => {
    const context = useContext(UIStateContext);
    if (!context) {
        throw new Error('useUIState must be used within a UIStateProvider');
    }
    return context;
};