import React, { createContext, useCallback, useContext, useState } from "react";
import ToastComponent from "../components/ui/Toast";
import { Toast } from "../types/toast";

export type { Toast };

let toastIdCounter = 0;
const generateId = () => `toast_${++toastIdCounter}_${Date.now()}`;

interface ToastContextType {
  addToast: (message: string, type: Toast["type"], duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, type: Toast["type"], duration?: number) => {
      const id = generateId();
      setToasts((prevToasts) => [
        ...prevToasts,
        { id, message, type, duration },
      ]);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </ToastContext.Provider>
  );
};
