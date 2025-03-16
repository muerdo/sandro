// contexts/visibility-context.tsx
"use client";

import { createContext, useContext, useState } from "react";

interface VisibilityContextType {
  isCartButtonVisible: boolean;
  setCartButtonVisible: (visible: boolean) => void;
}

const VisibilityContext = createContext<VisibilityContextType | undefined>(undefined);

export function VisibilityProvider({ children }: { children: React.ReactNode }) {
  const [isCartButtonVisible, setCartButtonVisible] = useState(true);

  return (
    <VisibilityContext.Provider value={{ isCartButtonVisible, setCartButtonVisible }}>
      {children}
    </VisibilityContext.Provider>
  );
}

export function useVisibility() {
  const context = useContext(VisibilityContext);
  if (!context) {
    throw new Error("useVisibility must be used within a VisibilityProvider");
  }
  return context;
}