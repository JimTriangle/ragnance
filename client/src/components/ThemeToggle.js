import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { Button } from 'primereact/button';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return (
    <Button
      icon={theme === 'saga-blue' ? 'pi pi-moon' : 'pi pi-sun'}
      className="btn-icon-modern"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    />
  );
};

export default ThemeToggle;