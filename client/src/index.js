import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { PrimeReactProvider } from 'primereact/api';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { TransactionRefreshProvider } from './context/TransactionRefreshContext';

// --- ORDRE D'IMPORTATION DES STYLES (TRÈS IMPORTANT) ---

// 1. Les styles de base des composants PrimeReact
import 'primereact/resources/primereact.min.css';
// 2. Les icônes
import 'primeicons/primeicons.css';
// 3. La grille et les utilitaires flex
import 'primeflex/primeflex.css';
// 4. NOTRE fichier de styles personnalisés, EN DERNIER
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PrimeReactProvider>
      <AuthProvider>
        <ToastProvider>
          <ThemeProvider>
            <TransactionRefreshProvider>
              <App />
            </TransactionRefreshProvider>
          </ThemeProvider>
        </ToastProvider>
      </AuthProvider>
    </PrimeReactProvider>
  </React.StrictMode>
);