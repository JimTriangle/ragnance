import { useContext, useMemo } from 'react';
import { ThemeContext } from '../context/ThemeContext';

/**
 * Hook qui retourne des options de graphiques adaptées au thème actuel (clair/sombre).
 */
const useChartTheme = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'vela-blue';

  const colors = useMemo(() => ({
    textColor: isDark ? '#CCC' : '#495057',
    gridColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    legendColor: isDark ? '#CCC' : '#495057',
  }), [isDark]);

  const lineChartOptions = useMemo(() => ({
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: colors.textColor }, grid: { color: colors.gridColor } },
      y: { ticks: { color: colors.textColor, callback: (value) => value.toLocaleString('fr-FR') + ' €' }, grid: { color: colors.gridColor } }
    }
  }), [colors]);

  const barChartOptions = useMemo(() => ({
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: colors.legendColor, font: { size: 10 } } } },
    scales: {
      x: { ticks: { color: colors.textColor }, grid: { color: colors.gridColor } },
      y: { ticks: { color: colors.textColor }, grid: { color: colors.gridColor } }
    }
  }), [colors]);

  return { colors, lineChartOptions, barChartOptions, isDark };
};

export default useChartTheme;
