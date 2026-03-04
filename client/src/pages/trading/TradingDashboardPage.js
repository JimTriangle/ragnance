import React, { useEffect, useState, useCallback } from 'react';
import { Button } from 'primereact/button';
import FiltersBar from '../../components/trading/FiltersBar';
import KpiCard from '../../components/trading/KpiCard';
import EquityChart from '../../components/trading/EquityChart';
import PnlDailyChart from '../../components/trading/PnlDailyChart';
import SummaryTable from '../../components/trading/SummaryTable';
import api from '../../services/api';
import DisplaySettings from '../../components/DisplaySettings';
import useDisplayPreferences from '../../hooks/useDisplayPreferences';
import './TradingStyles.css';
import useTour from '../../hooks/useTour';
import TourButton from '../../components/TourButton';
import '../../styles/tour.css';

const TradingDashboardPage = () => {
  const today = new Date();
  const defaultFrom = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
  const [filters, setFilters] = useState({
    from: defaultFrom.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
    exchange: ''
  });
  const [summary, setSummary] = useState(null);
  const [equity, setEquity] = useState([]);
  const [pnlDaily, setPnlDaily] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // Configuration du guide utilisateur
  const tourSteps = [
    {
      element: '[data-tour-id="trading-title"]',
      popover: {
        title: 'Dashboard Trading 📈',
        description: 'Bienvenue sur votre tableau de bord trading ! Ici vous pouvez suivre vos performances, analyser vos trades et surveiller vos robots de trading en temps réel.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '[data-tour-id="filters-bar"]',
      popover: {
        title: 'Filtres de Période 📅',
        description: 'Ajustez la période d\'analyse et filtrez par exchange pour affiner vos statistiques. Les données se mettent à jour automatiquement.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '[data-tour-id="kpi-equity"]',
      popover: {
        title: 'Equity Actuel 💰',
        description: 'Votre capital total actuel en trading. C\'est la valeur cumulée de tous vos actifs sur vos exchanges.',
        side: 'bottom',
        align: 'center'
      }
    },
    {
      element: '[data-tour-id="kpi-pnl"]',
      popover: {
        title: 'PnL du Jour 📊',
        description: 'Votre Profit & Loss (Gain & Perte) du jour. Positif = vous gagnez, négatif = vous perdez.',
        side: 'bottom',
        align: 'center'
      }
    },
    {
      element: '[data-tour-id="kpi-trades"]',
      popover: {
        title: 'Nombre de Trades 🔢',
        description: 'Le nombre total de transactions effectuées sur la période sélectionnée.',
        side: 'bottom',
        align: 'center'
      }
    },
    {
      element: '[data-tour-id="equity-chart"]',
      popover: {
        title: 'Courbe d\'Equity 📈',
        description: 'Visualisez l\'évolution de votre capital dans le temps. Une courbe montante indique des performances positives.',
        side: 'top',
        align: 'center'
      }
    },
    {
      element: '[data-tour-id="pnl-chart"]',
      popover: {
        title: 'PnL Journalier 📊',
        description: 'Votre profit ou perte jour par jour. Les barres vertes = gains, les barres rouges = pertes. Identifiez rapidement vos meilleures et pires journées.',
        side: 'top',
        align: 'center'
      }
    },
    {
      element: '[data-tour-id="summary-table"]',
      popover: {
        title: 'Résumé Robots & Backtests 🤖',
        description: 'Tableau récapitulatif de vos robots de trading actifs et de vos backtests. Suivez le statut et les performances de chacun.',
        side: 'top',
        align: 'start'
      }
    },
    {
      popover: {
        title: 'Actualisation Automatique 🔄',
        description: 'Si des robots sont actifs, les données se rafraîchissent automatiquement toutes les 15 secondes. Vous pouvez aussi actualiser manuellement avec le bouton ↻ en haut à droite.',
      }
    }
  ];

  const { startTour } = useTour('trading-dashboard', tourSteps, true);

  // Préférences d'affichage des sections
  const TRADING_SECTIONS = [
    { key: 'kpiEquity', label: 'Equity' },
    { key: 'kpiPnl', label: 'PnL Jour' },
    { key: 'kpiTrades', label: 'Trades' },
    { key: 'chartEquity', label: "Courbe d'Equity" },
    { key: 'chartPnl', label: 'PnL Journalier' },
    { key: 'summaryTable', label: 'Résumé Robots & Backtests' },
  ];
  const { visibility, toggleSection, isVisible } = useDisplayPreferences('tradingDashboard', {
    kpiEquity: true, kpiPnl: true, kpiTrades: true,
    chartEquity: true, chartPnl: true, summaryTable: true,
  });

  const fetchData = useCallback(async () => {
    const params = {
      from: new Date(filters.from).toISOString(),
      to: new Date(filters.to).toISOString(),
      exchange: filters.exchange || ''
    };

    try {
      const { data: dataSummary } = await api.get('/dashboard/summary', { params });
      setSummary(dataSummary);

      try {
        const { data: dataEquity } = await api.get('/dashboard/equity-curve', { params });
        setEquity(dataEquity.points || []);
      } catch {
        setEquity([]);
      }

      try {
        const { data: dataPnl } = await api.get('/dashboard/pnl-daily', { params });
        setPnlDaily(dataPnl.days || []);
       } catch {
        setPnlDaily([]);
      }

      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data', err);
      setError(err.response?.status === 401 ? 'Unauthorized' : err.message);
      setSummary(null);
      setEquity([]);
      setPnlDaily([]);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (summary?.robots?.some(r => r.status === 'RUNNING')) {
      const id = setInterval(fetchData, 15000);
      return () => clearInterval(id);
    }
  }, [summary, fetchData]);

  if (error) {
    return <div className="p-4 trading-page-container">{error}</div>;
  }

  if (!summary) {
    return <div className="p-4 trading-page-container">Loading...</div>;
  }

  return (
    <div className="p-4 trading-page-container">
      <TourButton onStartTour={startTour} tooltip="Revoir le guide du Trading Dashboard" />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold" data-tour-id="trading-title">Dashboard Trading</h1>
        <div className="flex align-items-center gap-2">
          <DisplaySettings sections={TRADING_SECTIONS} visibility={visibility} onToggle={toggleSection} />
          <Button icon="pi pi-refresh" onClick={fetchData} size="small" rounded text aria-label="Actualiser" />
        </div>
      </div>
      {lastUpdated && (
        <p className="text-sm text-gray-500 mb-4">Dernière mise à jour : {lastUpdated.toLocaleString()}</p>
      )}
      <div data-tour-id="filters-bar">
        <FiltersBar filters={filters} onChange={setFilters} />
      </div>
      {(isVisible('kpiEquity') || isVisible('kpiPnl') || isVisible('kpiTrades')) && (
      <div className="grid">
        {isVisible('kpiEquity') && (
        <div className="col-12 md:col-4" data-tour-id="kpi-equity">
          <KpiCard
            label="Equity"
            value={
              summary?.equity?.current != null
                ? `${summary.equity.current.toFixed(2)} ${summary.currency}`
                : '-'
            }
          />
        </div>
        )}
        {isVisible('kpiPnl') && (
        <div className="col-12 md:col-4" data-tour-id="kpi-pnl">
          <KpiCard
            label="PnL Jour"
            value={summary?.pnl?.day != null ? summary.pnl.day.toFixed(2) : '-'}
          />
        </div>
        )}
        {isVisible('kpiTrades') && (
        <div className="col-12 md:col-4" data-tour-id="kpi-trades">
          <KpiCard label="Trades" value={summary?.tradesCount ?? '-'} />
        </div>
        )}
      </div>
      )}
      {(isVisible('chartEquity') || isVisible('chartPnl')) && (
      <div className="grid mt-4">
        {isVisible('chartEquity') && (
        <div className="col-12 lg:col-6" data-tour-id="equity-chart">
          <EquityChart points={equity} />
        </div>
        )}
        {isVisible('chartPnl') && (
        <div className="col-12 lg:col-6" data-tour-id="pnl-chart">
          <PnlDailyChart days={pnlDaily} />
        </div>
        )}
      </div>
      )}
      {isVisible('summaryTable') && (
      <div className="mt-4" data-tour-id="summary-table">
        <SummaryTable robots={summary?.robots || []} backtests={summary?.backtests || []} />
      </div>
      )}
    </div>
  );
};
export default TradingDashboardPage;