'use client';

import React, { createContext, useContext, useState } from 'react';

interface HeaderContextType {
  onBack: (() => void) | undefined;
  setOnBack: (fn: (() => void) | undefined) => void;
  hideNav: boolean;
  setHideNav: (hide: boolean) => void;
}

const HeaderContext = createContext<HeaderContextType>({
  onBack: undefined,
  setOnBack: () => {},
  hideNav: false,
  setHideNav: () => {},
});

export const HeaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [onBack, setOnBackState] = useState<(() => void) | undefined>(undefined);
  const [hideNav, setHideNav] = useState<boolean>(false);

  const setOnBack = (fn: (() => void) | undefined) => {
    setOnBackState(() => fn);
  };

  return (
    <HeaderContext.Provider value={{ onBack, setOnBack, hideNav, setHideNav }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = () => useContext(HeaderContext);
