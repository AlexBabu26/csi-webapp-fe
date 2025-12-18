import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none sm:top-24 sm:right-6 max-w-[calc(100vw-2rem)]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg shadow-lg border-l-4 
              bg-white animate-slide-in flex ring-1 ring-black ring-opacity-5
              ${toast.type === 'success' ? 'border-success' : 
                toast.type === 'error' ? 'border-danger' : 
                toast.type === 'warning' ? 'border-warning' : 'border-info'}
            `}
            role="alert"
          >
            <div className="p-4 flex items-start w-full">
              <div className="flex-shrink-0">
                {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-success" />}
                {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-danger" />}
                {toast.type === 'warning' && <AlertCircle className="h-5 w-5 text-warning" />}
                {toast.type === 'info' && <Info className="h-5 w-5 text-info" />}
              </div>
              <div className="ml-3 flex-1 pt-0.5 min-w-0">
                <p className="text-sm font-medium text-gray-900 break-words">{toast.message}</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={() => removeToast(toast.id)}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};