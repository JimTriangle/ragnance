import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { PrimeReactProvider } from 'primereact/api';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext'; // <-- AJOUTER

// --- ORDRE D'IMPORTATION DES STYLES (TRÈS IMPORTANT) ---

// 1. Le thème de PrimeReact
import 'primereact/resources/themes/vela-blue/theme.css';   
// 2. Les styles de base des composants PrimeReact
import 'primereact/resources/primereact.min.css';
// 3. Les icônes
import 'primeicons/primeicons.css';
// 4. La grille et les utilitaires flex
import 'primeflex/primeflex.css'; 
// 5. NOTRE fichier de styles personnalisés, EN DERNIER
import './index.css';

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