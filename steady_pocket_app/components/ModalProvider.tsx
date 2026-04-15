import React, { useState, createContext, useContext, useEffect } from 'react';
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

  const showMockLocationWarning = () => {
    setShowMockLocationModal(true);
  };

  const hideMockLocationWarning = () => {
    setShowMockLocationModal(false);
  };

  // Store in global ref for easy access
  useEffect(() => {
    (global as any).modalManager = {
      showMockLocationWarning,
      hideMockLocationWarning,
    };
  }, []);

  return (
    <ModalContext.Provider
      value={{
        showMockLocationWarning,
        hideMockLocationWarning,
      }}
    >
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
    if (manager) {
      manager.showMockLocationWarning();
    }
  } catch (e) {
    console.warn('[Modal] Could not show mock location warning:', e);
  }
};
