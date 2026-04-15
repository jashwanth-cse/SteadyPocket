import React, { useState, createContext, useContext, useRef, useEffect } from 'react';
import MockLocationWarningModal from './MockLocationWarningModal';

interface ModalContextType {
  showMockLocationWarning: () => void;
  hideMockLocationWarning: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [showMockLocationModal, setShowMockLocationModal] = useState(false);
  const managerRef = useRef<ModalContextType | null>(null);

  const showMockLocationWarning = () => {
    setShowMockLocationModal(true);
  };

  const hideMockLocationWarning = () => {
    setShowMockLocationModal(false);
  };

  // Update manager ref whenever functions change
  useEffect(() => {
    managerRef.current = {
      showMockLocationWarning,
      hideMockLocationWarning,
    };
    // Also store in global for access from non-React code
    (global as any).modalManager = managerRef.current;
  }, [showMockLocationWarning, hideMockLocationWarning]);

  const contextValue: ModalContextType = {
    showMockLocationWarning,
    hideMockLocationWarning,
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      <MockLocationWarningModal
        visible={showMockLocationModal}
        onDismiss={hideMockLocationWarning}
      />
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

/**
 * Global helper to show mock location warning from anywhere
 */
export const showMockLocationWarning = () => {
  try {
    const manager = (global as any).modalManager;
    if (manager?.showMockLocationWarning) {
      manager.showMockLocationWarning();
      console.log('[Modal] Mock location warning shown');
    } else {
      console.warn('[Modal] Manager not initialized yet');
    }
  } catch (e) {
    console.warn('[Modal] Could not show mock location warning:', e);
  }
};
