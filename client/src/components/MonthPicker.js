import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/month-picker.css';

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const MonthPicker = ({ currentDate, onMonthSelect, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const displayLabel = `${capitalize(MONTHS_FR[currentMonth])} ${currentYear}`;

  // Generate list: 12 months before, current, 12 months after
  const generateMonths = useCallback(() => {
    const months = [];
    for (let i = -12; i <= 12; i++) {
      const d = new Date(currentYear, currentMonth + i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const isCurrentSelection = m === currentMonth && y === currentYear;
      const isToday = m === todayMonth && y === todayYear;
      months.push({ month: m, year: y, label: `${capitalize(MONTHS_FR[m])} ${y}`, isCurrentSelection, isToday, offset: i });
    }
    return months;
  }, [currentMonth, currentYear, todayMonth, todayYear]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleSelect = (month, year) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    newDate.setMonth(month);
    newDate.setDate(1);
    onMonthSelect(newDate);
    setIsOpen(false);
  };

  const handleGoToToday = () => {
    const newDate = new Date();
    newDate.setDate(1);
    onMonthSelect(newDate);
    setIsOpen(false);
  };

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // Scroll to current selection when opened
  useEffect(() => {
    if (isOpen && listRef.current) {
      const selected = listRef.current.querySelector('.month-picker__item--selected');
      if (selected) {
        selected.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    }
  }, [isOpen]);

  const months = generateMonths();
  const isCurrentMonth = currentMonth === todayMonth && currentYear === todayYear;

  return (
    <div className={`month-picker ${className || ''}`} ref={containerRef}>
      <button
        type="button"
        className={`month-picker__trigger ${isOpen ? 'month-picker__trigger--open' : ''}`}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="month-picker__label">{displayLabel}</span>
        <i className={`pi pi-chevron-down month-picker__chevron ${isOpen ? 'month-picker__chevron--open' : ''}`} />
      </button>

      {isOpen && (
        <div className="month-picker__dropdown">
          {!isCurrentMonth && (
            <button
              type="button"
              className="month-picker__today-btn"
              onClick={handleGoToToday}
            >
              <i className="pi pi-calendar" />
              Mois actuel
            </button>
          )}
          <ul className="month-picker__list" ref={listRef} role="listbox">
            {months.map((item) => (
              <li key={`${item.year}-${item.month}`}>
                <button
                  type="button"
                  className={`month-picker__item ${item.isCurrentSelection ? 'month-picker__item--selected' : ''} ${item.isToday && !item.isCurrentSelection ? 'month-picker__item--today' : ''}`}
                  onClick={() => handleSelect(item.month, item.year)}
                  role="option"
                  aria-selected={item.isCurrentSelection}
                >
                  {item.label}
                  {item.isToday && <span className="month-picker__today-dot" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MonthPicker;
