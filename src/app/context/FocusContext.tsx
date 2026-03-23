import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

interface FocusContextType {
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  registerFocusable: (id: string, element: HTMLElement) => void;
  unregisterFocusable: (id: string) => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focusableElements = useRef<Map<string, HTMLElement>>(new Map());

  const registerFocusable = useCallback((id: string, element: HTMLElement) => {
    focusableElements.current.set(id, element);
    
    // Set first element as focused if nothing is focused
    if (!focusedId && focusableElements.current.size === 1) {
      setFocusedId(id);
    }
  }, [focusedId]);

  const unregisterFocusable = useCallback((id: string) => {
    focusableElements.current.delete(id);
    if (focusedId === id) {
      setFocusedId(null);
    }
  }, [focusedId]);

  // Handle keyboard navigation for TV
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys and Enter for TV navigation
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(e.key)) {
        return;
      }

      if (e.key === "Enter" && focusedId) {
        const element = focusableElements.current.get(focusedId);
        if (element) {
          element.click();
          e.preventDefault();
        }
        return;
      }

      // Arrow key navigation is handled by individual components
      // This context just manages the focused state
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedId]);

  return (
    <FocusContext.Provider
      value={{ focusedId, setFocusedId, registerFocusable, unregisterFocusable }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error("useFocus must be used within FocusProvider");
  }
  return context;
}
