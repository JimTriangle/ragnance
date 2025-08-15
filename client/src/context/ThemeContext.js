import React, { createContext, useState, useEffect } from 'react';
import PrimeReact from 'primereact/api';
import 'primereact/resources/themes/saga-blue/theme.css';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'saga-blue');

  useEffect(() => {
    if (theme !== 'saga-blue') {
      PrimeReact.changeTheme('saga-blue', theme, 'theme-link');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'saga-blue' ? 'vela-blue' : 'saga-blue';
    PrimeReact.changeTheme(theme, newTheme, 'theme-link', () => setTheme(newTheme));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};