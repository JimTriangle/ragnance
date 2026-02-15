import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { PrimeReactProvider, addLocale, locale } from 'primereact/api';
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

// Configuration de la locale française pour PrimeReact (calendriers, etc.)
addLocale('fr', {
  firstDayOfWeek: 1,
  dayNames: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  dayNamesShort: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
  dayNamesMin: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
  monthNames: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  monthNamesShort: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  today: "Aujourd'hui",
  clear: 'Effacer',
  weekHeader: 'Sm'
});
locale('fr');

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