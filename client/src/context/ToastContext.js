import React, { createContext, useRef } from 'react';
import { Toast } from 'primereact/toast';

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const toast = useRef(null);

    // Cette fonction sera accessible par toute l'application
    const showToast = (severity, summary, detail) => {
        if (toast.current) {
            toast.current.show({ severity, summary, detail, life: 3000 });
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {/* Le composant Toast est maintenant unique et global */}
            <Toast ref={toast} />
            {children}
        </ToastContext.Provider>
    );
};