import { useEffect, useRef } from "react";
import { useFocus } from "../context/FocusContext";
import { useDevice } from "../context/DeviceContext";

interface FocusableButtonProps {
  id: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  autoFocus?: boolean;
}

export function FocusableButton({ 
  id, 
  children, 
  onClick, 
  className = "",
  autoFocus = false 
}: FocusableButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { focusedId, setFocusedId, registerFocusable, unregisterFocusable } = useFocus();
  const { isTv } = useDevice();
  const isFocused = focusedId === id;

  useEffect(() => {
    if (buttonRef.current) {
      registerFocusable(id, buttonRef.current);
    }
    
    if (autoFocus) {
      setFocusedId(id);
    }

    return () => {
      unregisterFocusable(id);
    };
  }, [id, registerFocusable, unregisterFocusable, autoFocus, setFocusedId]);

  const handleClick = () => {
    setFocusedId(id);
    onClick?.();
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseEnter={() => isTv && setFocusedId(id)}
      className={`
        ${className}
        ${isFocused && isTv ? "ring-4 ring-[#E63946] ring-offset-2 ring-offset-[#0A0A0F] scale-105" : ""}
        transition-all duration-200
      `}
    >
      {children}
    </button>
  );
}
