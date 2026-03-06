import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import api from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { TransactionRefreshContext } from '../context/TransactionRefreshContext';
import { AuthContext } from '../context/AuthContext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { confirmDialog } from 'primereact/confirmdialog';
import { Chart } from 'primereact/chart';
import { Skeleton } from 'primereact/skeleton';
import { InputText } from 'primereact/inputtext';
import TransactionForm from '../components/TransactionForm';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import useTransactionRefresh from '../hooks/useTransactionRefresh';
import BudgetTracker from '../components/BudgetTracker';
import DisplaySettings from '../components/DisplaySettings';
import useTour from '../hooks/useTour';
import TourButton from '../components/TourButton';
import useChartTheme from '../hooks/useChartTheme';
import useDisplayPreferences from '../hooks/useDisplayPreferences';
import '../styles/tour.css';
import '../styles/transactions.css';

const COLUMN_CONFIG = [
  { key: 'label',      header: 'Libellé',    field: 'label',     sortable: true,  bodyRef: 'labelBodyTemplate' },
  { key: 'amount',     header: 'Montant',    field: 'amount',    sortable: true,  bodyRef: 'amountBodyTemplate' },
  { key: 'type',       header: 'Type',       field: 'type',      sortable: true,  bodyRef: 'typeTemplate' },
  { key: 'categories', header: 'Catégories', field: null,        sortable: false, bodyRef: 'categoryBodyTemplate' },
  { key: 'date',       header: 'Date',       field: 'date',      sortable: true,  bodyRef: 'formatDate' },
  { key: 'createdAt',  header: 'Saisi le',   field: 'createdAt', sortable: true,  bodyRef: 'createdAtDate' },
];
const DEFAULT_VISIBLE_COLUMNS = COLUMN_CONFIG.map(c => c.key);
const COLUMN_VISIBILITY_STORAGE_KEY = 'monthlyView_visibleColumns';

const MonthlyViewPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ startingBalance: 0, totalIncome: 0, totalExpense: 0, projectedBalanceWithBudgets: 0, totalBudgets: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [lineChartData, setLineChartData] = useState({});
  const [pieChartData, setPieChartData] = useState({});
  const [cumulativeChartData, setCumulativeChartData] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const { showToast } = useContext(ToastContext);
  const { notifyTransactionRefresh } = useContext(TransactionRefreshContext);
  const { isLoggedIn, isLoading: authLoading } = useContext(AuthContext);

  const [isNewModalVisible, setIsNewModalVisible] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [budgetProgress, setBudgetProgress] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const stored = localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const validKeys = COLUMN_CONFIG.map(c => c.key);
        const filtered = parsed.filter(k => validKeys.includes(k));
        return filtered.length > 0 ? filtered : DEFAULT_VISIBLE_COLUMNS;
      }
    } catch (e) {}
    return DEFAULT_VISIBLE_COLUMNS;
  });

  const isMountedRef = useRef(true);

  // Configuration du guide utilisateur
  const tourSteps = [
    {
      element: '[data-tour-id="monthly-title"]',
      popover: {
        title: 'Vue Mensuelle 📅',
        description: 'Cette page vous permet d\'analyser en détail toutes vos transactions pour un mois spécifique. Naviguez entre les mois et visualisez vos flux financiers.',
        side: 'bottom',
        align: 'center'
      }
    },
    {
      element: '[data-tour-id="month-navigation"]',
      popover: {
        title: 'Navigation par Mois ⬅️➡️',
        description: 'Utilisez les flèches pour naviguer entre les différents mois. Le bouton "Exporter en Excel" permet de télécharger toutes vos transactions du mois.',
        side: 'bottom',
        align: 'center'
      }
    },
    {
      element: '[data-tour-id="summary-cards"]',
      popover: {
        title: 'Résumé Mensuel 💰',
        description: 'Ces cartes résument votre situation financière du mois : solde de début, total des revenus et dépenses, solde de fin, et l\'impact de vos budgets.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '[data-tour-id="chart-daily-flow"]',
      popover: {
        title: 'Flux Journalier 📊',
        description: 'Ce graphique montre vos revenus (vert) et dépenses (rouge) jour par jour. Identifiez facilement les pics de dépenses ou de revenus.',
        side: 'top',
        align: 'center'
      }
    },
    {
      element: '[data-tour-id="chart-cumulative"]',
      popover: {
        title: 'Progression Cumulée 📈',
        description: 'Visualisez l\'évolution cumulée de vos dépenses tout au long du mois. Pratique pour suivre votre consommation progressive.',
        side: 'top',
        align: 'center'
      }
    },
    {
      element: '[data-tour-id="chart-pie"]',
      popover: {
        title: 'Répartition Revenus/Dépenses 🎯',
        description: 'Ce graphique circulaire compare rapidement le total de vos revenus et dépenses du mois.',
        side: 'top',
        align: 'center'
      }
    },
    {
      element: '[data-tour-id="budget-progress"]',
      popover: {
        title: 'Progression des Budgets 💳',
        description: 'Suivez en temps réel l\'avancement de vos budgets mensuels. Les barres de progression indiquent le pourcentage utilisé.',
        side: 'top',
        align: 'center'
      }
    },
    {
      element: '[data-tour-id="transactions-table"]',
      popover: {
        title: 'Liste des Transactions 📋',
        description: 'Toutes vos transactions du mois sont listées ici. Vous pouvez les rechercher, les filtrer par catégorie, et les trier selon vos besoins.',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '[data-tour-id="add-transaction-btn"]',
      popover: {
        title: 'Ajouter une Transaction ➕',
        description: 'Cliquez ici pour ajouter rapidement une nouvelle transaction (revenu ou dépense).',
        side: 'right',
        align: 'start'
      }
    },
    {
      popover: {
        title: 'C\'est terminé ! ✨',
        description: 'Vous maîtrisez maintenant la vue mensuelle. Utilisez le bouton "i" en bas à droite pour revoir ce guide à tout moment.',
      }
    }
  ];

  const { startTour } = useTour('monthly-view', tourSteps, true);

  // Options des graphiques (adaptées au thème clair/sombre)
  const { barChartOptions: chartOptions, pieChartOptions } = useChartTheme();

  // Préférences d'affichage des sections
  const MONTHLY_SECTIONS = [
    { key: 'soldeDebut', label: 'Solde Début de Mois' },
    { key: 'revenus', label: 'Total Revenus' },
    { key: 'depenses', label: 'Total Dépenses' },
    { key: 'soldeFinMois', label: 'Solde Fin de Mois' },
    { key: 'totalBudgets', label: 'Total Budgets' },
    { key: 'soldePrev', label: 'Solde Prév. avec Budgets' },
    { key: 'chartFlux', label: 'Flux Journalier' },
    { key: 'chartCumul', label: 'Progression Cumulée' },
    { key: 'chartPie', label: 'Répartition Revenus / Dépenses' },
    { key: 'chartBudgetProgress', label: 'Progression des Budgets' },
  ];
  const { visibility, toggleSection, isVisible } = useDisplayPreferences('monthlyView', {
    soldeDebut: true, revenus: true, depenses: true,
    soldeFinMois: true, totalBudgets: true, soldePrev: true,
    chartFlux: true, chartCumul: true, chartPie: true, chartBudgetProgress: true,
  });

  const fetchData = useCallback(async () => {
    if (!isLoggedIn || authLoading) {
      return;
    }

    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    try {
      const [transacResponse, summaryResponse, dailyFlowResponse, budgetProgressResponse] = await Promise.all([
        api.get(`/transactions?year=${year}&month=${month}`),
        api.get(`/transactions/summary/${year}/${month}`),
        api.get(`/analysis/daily-flow/${year}/${month}`),
        api.get(`/budgets/progress/${year}/${month}`)
      ]);

      if (!isMountedRef.current) return;

      setTransactions(transacResponse.data);
      setSummary(summaryResponse.data);
      setBudgetProgress(budgetProgressResponse.data);

      const dailyFlowData = dailyFlowResponse.data;

      setLineChartData({
        labels: dailyFlowData.labels,
        datasets: [
          { label: 'Revenus', data: dailyFlowData.incomeData, fill: false, borderColor: '#10B981', tension: 0.4 },
          { label: 'Dépenses', data: dailyFlowData.expenseData, fill: false, borderColor: '#EF4444', tension: 0.4 }
        ]
      });

      setPieChartData({
        labels: ['Revenus', 'Dépenses'],
        datasets: [{
          data: [summaryResponse.data.totalIncome, summaryResponse.data.totalExpense],
          backgroundColor: ['#10B981', '#EF4444'],
        }]
      });

      const cumulativeIncome = [];
      const cumulativeExpense = [];
      let runningIncome = 0;
      let runningExpense = 0;

      for (const dailyIncome of dailyFlowData.incomeData) {
        runningIncome += dailyIncome;
        cumulativeIncome.push(runningIncome);
      }
      for (const dailyExpense of dailyFlowData.expenseData) {
        runningExpense += dailyExpense;
        cumulativeExpense.push(runningExpense);
      }

      setCumulativeChartData({
        labels: dailyFlowData.labels,
        datasets: [
          {
            label: 'Dépenses Cumulées',
            data: cumulativeExpense,
            fill: true,
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            tension: 0.4
          }
        ]
      });

    } catch (error) {
      if (!isMountedRef.current) return;
      showToast('error', 'Erreur', 'Impossible de charger les données');
    } finally { 
      if (isMountedRef.current) {
        setLoading(false); 
      }
    }
  }, [currentDate, showToast, isLoggedIn, authLoading]);

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      fetchData();
    }
  }, [fetchData, authLoading, isLoggedIn]);

  useTransactionRefresh(fetchData);

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      api.get('/categories').then(response => {
        if (isMountedRef.current) {
          setAllCategories(response.data);
        }
      }).catch(err => console.error('Erreur chargement catégories:', err));
    }
  }, [authLoading, isLoggedIn]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const changeMonth = (amount) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  const handleEditClick = (transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalVisible(true);
  };

  const handleComplete = () => {
    showToast('success', 'Succès', 'Opération réussie');
    if (isEditModalVisible) setIsEditModalVisible(false);
    if (isNewModalVisible) setIsNewModalVisible(false);
    notifyTransactionRefresh();
  };

  const confirmDelete = (transactionId) => {
    const handleDelete = async () => {
      try {
        await api.delete(`/transactions/${transactionId}`);
        showToast('success', 'Succès', 'Transaction supprimée');
        notifyTransactionRefresh();
      } catch (error) {
        showToast('error', 'Erreur', 'La suppression a échoué');
      }
    };
    confirmDialog({
      message: 'Êtes-vous sûr de vouloir supprimer cette transaction ?',
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: handleDelete,
    });
  };

  const formatCurrency = (value) => (value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

  const formatDate = (rowData) => {
    let text = '-';
    if (rowData.date) {
      text = new Date(rowData.date).toLocaleDateString('fr-FR');
    } else if (rowData.transactionType === 'recurring') {
      text = `Le ${rowData.dayOfMonth || '1er'} du mois`;
    }
    return <span className="txn-date">{text}</span>;
  };

  const handleExportExcel = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    try {
      const response = await api.get(`/transactions/export-excel/${year}/${month}`, {
        responseType: 'blob'
      });

      const monthName = currentDate.toLocaleString('fr-FR', { month: 'long' });
      const filename = `transactions_${monthName}_${year}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('success', 'Succès', 'Export Excel téléchargé');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      showToast('error', 'Erreur', 'Impossible d\'exporter les transactions');
    }
  };

  const typeTemplate = (rowData) => {
    const isIncome = rowData.type === 'income';
    return (
      <span className={`txn-type ${isIncome ? 'txn-type--income' : 'txn-type--expense'}`}>
        <span className="txn-type__dot" />
        {isIncome ? 'Revenu' : 'Dépense'}
      </span>
    );
  };

  const labelBodyTemplate = (rowData) => (
    <span className="txn-label">
      {rowData.transactionType === 'recurring' && <i className="pi pi-sync txn-label__recurring" title="Transaction récurrente"></i>}
      {rowData.label}
    </span>
  );

  const onColumnVisibilityChange = (e) => {
    setVisibleColumns(e.value);
    localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(e.value));
  };

  const amountBodyTemplate = (rowData) => (
    <span className={`txn-amount ${rowData.type === 'income' ? 'txn-amount--income' : 'txn-amount--expense'}`}>
      {formatCurrency(rowData.amount)}
    </span>
  );

  const actionBodyTemplate = (rowData) => (
    <div className="txn-actions">
      <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => handleEditClick(rowData)} aria-label="Modifier la transaction" />
      <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => confirmDelete(rowData.id)} aria-label="Supprimer la transaction" />
    </div>
  );

  const monthName = currentDate.toLocaleString('fr-FR', { month: 'long' });
  const year = currentDate.getFullYear();
  const endOfMonthBalance = (summary.startingBalance || 0) + (summary.totalIncome || 0) - (summary.totalExpense || 0);
  const categoryOptions = allCategories.map(c => ({ label: c.name, value: c.id }));

  const filteredTransactions = selectedCategoryId
    ? transactions.filter(t => t.Categories && t.Categories.some(c => c.id === selectedCategoryId))
    : transactions;

  const createdAtDate = (rowData) => {
    return <span className="txn-date">{new Date(rowData.createdAt).toLocaleDateString('fr-FR')}</span>;
  };

  const categoryBodyTemplate = (rowData) => {
    if (!rowData.Categories || rowData.Categories.length === 0) {
      return null;
    }
    return (
      <div className="txn-categories">
        {rowData.Categories.map(category => (
          <span key={category.id} className="txn-category-tag" style={{ background: category.color }}>{category.name}</span>
        ))}
      </div>
    );
  };

  const bodyTemplates = {
    labelBodyTemplate,
    amountBodyTemplate,
    typeTemplate,
    categoryBodyTemplate,
    formatDate,
    createdAtDate,
  };

  if (authLoading) {
    return (
      <div className="p-4">
        <Skeleton width="16rem" height="2rem" className="mb-4 mx-auto" />
        <div className="grid text-center mb-4">
          <div className="col-12 md:col-6 lg:col-4"><Skeleton height="6rem" /></div>
          <div className="col-12 md:col-6 lg:col-4"><Skeleton height="6rem" /></div>
          <div className="col-12 md:col-6 lg:col-4"><Skeleton height="6rem" /></div>
          <div className="col-12 md:col-6 lg:col-4"><Skeleton height="6rem" /></div>
          <div className="col-12 md:col-6 lg:col-4"><Skeleton height="6rem" /></div>
          <div className="col-12 md:col-6 lg:col-4"><Skeleton height="6rem" /></div>
        </div>
        <div className="grid">
          <div className="col-12 lg:col-6"><Skeleton height="20rem" /></div>
          <div className="col-12 lg:col-6"><Skeleton height="20rem" /></div>
        </div>
        <div className="txn-section mt-4">
          <div className="txn-header">
            <Skeleton width="8rem" height="1.25rem" />
            <Skeleton width="6rem" height="2rem" borderRadius="8px" />
          </div>
          <div style={{ padding: '0.75rem 1.25rem' }}>
            <Skeleton height="12rem" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TourButton onStartTour={startTour} tooltip="Revoir le guide de la Vue Mensuelle" />
      <div className="p-4">
        <div className="flex justify-content-center align-items-center mb-4">
          <h1 className="text-2xl capitalize m-0" data-tour-id="monthly-title">{`Analyse de ${monthName} ${year}`}</h1>
          <DisplaySettings sections={MONTHLY_SECTIONS} visibility={visibility} onToggle={toggleSection} />
        </div>

        {(isVisible('soldeDebut') || isVisible('revenus') || isVisible('depenses') || isVisible('soldeFinMois') || isVisible('totalBudgets') || isVisible('soldePrev')) && (
        <div className="grid text-center mb-4" data-tour-id="summary-cards">
          {isVisible('soldeDebut') && <div className="col-12 md:col-6 lg:col-4"><Card title="Solde Début de Mois"><h3 className="m-0">{formatCurrency(summary.startingBalance)}</h3></Card></div>}
          {isVisible('revenus') && <div className="col-12 md:col-6 lg:col-4"><Card title="Total Revenus du Mois"><h3 className="m-0 text-green-400">{formatCurrency(summary.totalIncome)}</h3></Card></div>}
          {isVisible('depenses') && <div className="col-12 md:col-6 lg:col-4"><Card title="Total Dépenses du Mois"><h3 className="m-0 text-red-400">{formatCurrency(summary.totalExpense)}</h3></Card></div>}
          {isVisible('soldeFinMois') && <div className="col-12 md:col-6 lg:col-4"><Card title="Solde Fin de Mois"><h3 className="m-0" style={{ color: endOfMonthBalance >= 0 ? 'var(--green-400)' : 'var(--red-400)' }}>{formatCurrency(endOfMonthBalance)}</h3></Card></div>}
          {isVisible('totalBudgets') && <div className="col-12 md:col-6 lg:col-4"><Card title="Total Budgets"><h3 className="m-0 text-blue-400">{formatCurrency(summary.totalBudgets)}</h3></Card></div>}
          {isVisible('soldePrev') && <div className="col-12 md:col-6 lg:col-4"><Card title="Solde Prév. avec Budgets"><h3 className="m-0" style={{ color: (summary.projectedBalanceWithBudgets || 0) >= 0 ? 'var(--green-400)' : 'var(--red-400)' }}>{formatCurrency(summary.projectedBalanceWithBudgets)}</h3></Card></div>}
        </div>
        )}

        {(isVisible('chartFlux') || isVisible('chartCumul') || isVisible('chartPie') || isVisible('chartBudgetProgress')) && (
        <div className="grid">
          {isVisible('chartFlux') && (
          <div className="col-12 lg:col-6" data-tour-id="chart-daily-flow">
            <Card title="Flux Journalier">
              <div style={{ position: 'relative', height: '300px' }}>
                <Chart type="line" data={lineChartData} options={chartOptions} aria-label="Graphique du flux journalier revenus et dépenses" />
              </div>
            </Card>
          </div>
          )}
          {isVisible('chartCumul') && (
          <div className="col-12 lg:col-6" data-tour-id="chart-cumulative">
            <Card title="Progression Cumulée du Mois">
              <div style={{ position: 'relative', height: '300px' }}>
                <Chart type="line" data={cumulativeChartData} options={chartOptions} aria-label="Graphique de la progression cumulée des dépenses" />
              </div>
            </Card>
          </div>
          )}
          {isVisible('chartPie') && (
          <div className="col-12 lg:col-6" data-tour-id="chart-pie">
            <Card title="Répartition Revenus / Dépenses">
              <div style={{ position: 'relative', height: '300px' }}>
                <Chart type="pie" data={pieChartData} options={pieChartOptions} aria-label="Graphique de répartition revenus et dépenses" />
              </div>
            </Card>
          </div>
          )}
          {isVisible('chartBudgetProgress') && (
          <div className="col-12 lg:col-6" data-tour-id="budget-progress">
            <Card title="Progression des Budgets">
              <div style={{ height: '300px', overflowY: 'auto', padding: '0.5rem' }}>
                <BudgetTracker data={budgetProgress} />
              </div>
            </Card>
          </div>
          )}
        </div>
        )}

        <div className="flex justify-content-between align-items-center my-4" data-tour-id="month-navigation">
          <Button icon="pi pi-arrow-left" onClick={() => changeMonth(-1)} aria-label="Mois précédent" />
          <Button label="Exporter en Excel" icon="pi pi-file-excel" className="p-button-success p-button-sm" onClick={handleExportExcel} />
          <Button icon="pi pi-arrow-right" onClick={() => changeMonth(1)} aria-label="Mois suivant" />
        </div>

        <div className="txn-section mt-4" data-tour-id="transactions-table">
          <div className="txn-header">
            <div className="txn-header__left">
              <h2 className="txn-header__title">Transactions</h2>
              <span className="txn-header__count">{filteredTransactions.length}</span>
            </div>
            <Button label="Ajouter" icon="pi pi-plus" className="p-button-success p-button-sm txn-add-btn" onClick={() => setIsNewModalVisible(true)} data-tour-id="add-transaction-btn" />
          </div>

          <div className="txn-toolbar">
            <MultiSelect value={visibleColumns} options={COLUMN_CONFIG.map(c => ({ label: c.header, value: c.key }))} onChange={onColumnVisibilityChange} placeholder="Colonnes" className="p-inputtext-sm" display="chip" style={{ maxWidth: '14rem' }} />
            <Dropdown value={selectedCategoryId} options={categoryOptions} onChange={(e) => setSelectedCategoryId(e.value)} placeholder="Catégorie" showClear className="p-inputtext-sm" />
            <div className="txn-toolbar__search">
              <i className="pi pi-search" />
              <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Rechercher..." className="p-inputtext-sm" />
            </div>
          </div>

          <DataTable value={filteredTransactions} loading={loading} size="small" globalFilter={globalFilter} globalFilterFields={['label', 'amount', 'type', 'date']} paginator rows={10} rowsPerPageOptions={[5, 10, 25, 50, 100]} responsiveLayout="scroll" emptyMessage={
            <div className="txn-empty">
              <i className="pi pi-inbox txn-empty__icon"></i>
              <p className="txn-empty__text">Aucune transaction ce mois</p>
              <p className="txn-empty__sub">Ajoutez votre première transaction pour commencer le suivi.</p>
            </div>
          }>
            {COLUMN_CONFIG
              .filter(col => visibleColumns.includes(col.key))
              .map(col => (
                <Column key={col.key} field={col.field} header={col.header} body={bodyTemplates[col.bodyRef]} sortable={col.sortable} />
              ))}
            <Column body={actionBodyTemplate} header="Actions" style={{ width: '6rem', textAlign: 'center' }} />
          </DataTable>
        </div>
      </div>
      <Dialog header="Modifier la Transaction" visible={isEditModalVisible} style={{ width: '50vw' }} breakpoints={{ '960px': '75vw', '641px': '95vw' }} onHide={() => setIsEditModalVisible(false)}>
        <TransactionForm transactionToEdit={selectedTransaction} onComplete={handleComplete} />
      </Dialog>

      <Dialog header="Ajouter une Transaction" visible={isNewModalVisible} style={{ width: '50vw' }} breakpoints={{ '960px': '75vw', '641px': '95vw' }} onHide={() => setIsNewModalVisible(false)}>
        <TransactionForm onComplete={handleComplete} defaultDate={currentDate} />
      </Dialog>
    </div>
  );
};

export default MonthlyViewPage; 