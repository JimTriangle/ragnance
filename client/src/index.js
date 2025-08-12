import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { PrimeReactProvider } from 'primereact/api';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext'; // <-- AJOUTER

// ON CHANGE LE THÈME ICI
import 'primereact/resources/themes/vela-blue/theme.css';   
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PrimeReactProvider>
      <AuthProvider>
        <ToastProvider> {/* <-- AJOUTER */}
          <App />
        </ToastProvider>
      </AuthProvider>
    </PrimeReactProvider>
  </React.StrictMode>
);