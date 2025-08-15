import React, { createContext, useState, useEffect, useRef } from 'react';
import PrimeReact from 'primereact/api';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'saga-blue');
  const previousTheme = useRef('saga-blue');

  useEffect(() => {
    PrimeReact.changeTheme(previousTheme.current, theme, 'theme-link');
    previousTheme.current = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
     setTheme((prevTheme) => (prevTheme === 'saga-blue' ? 'vela-blue' : 'saga-blue'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
