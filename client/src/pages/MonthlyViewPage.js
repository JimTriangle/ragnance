import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { TransactionRefreshContext } from '../context/TransactionRefreshContext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { confirmDialog } from 'primereact/confirmdialog';
import { Chart } from 'primereact/chart';
import { InputText } from 'primereact/inputtext';
import TransactionForm from '../components/TransactionForm';
import { Dropdown } from 'primereact/dropdown';
import useTransactionRefresh from '../hooks/useTransactionRefresh';


const MonthlyViewPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ startingBalance: 0, totalIncome: 0, totalExpense: 0 });
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

  const [isNewModalVisible, setIsNewModalVisible] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#CCC', font: { size: 10 } } }
    },
    scales: {
      x: { ticks: { color: '#CCC' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      y: { ticks: { color: '#CCC' }, grid: { color: 'rgba(255,255,255,0.1)' } }
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    try {
      const [transacResponse, summaryResponse, dailyFlowResponse] = await Promise.all([
        api.get(`/transactions?year=${year}&month=${month}`),
        api.get(`/transactions/summary/${year}/${month}`),
        api.get(`/analysis/daily-flow/${year}/${month}`)
      ]);
      setTransactions(transacResponse.data);
      setSummary(summaryResponse.data);

      const dailyFlowData = dailyFlowResponse.data;

      // Logique pour le graphique des flux journaliers (inchangée)
      setLineChartData({
        labels: dailyFlowData.labels,
        datasets: [
          { label: 'Revenus', data: dailyFlowData.incomeData, fill: false, borderColor: '#10B981', tension: 0.4 },
          { label: 'Dépenses', data: dailyFlowData.expenseData, fill: false, borderColor: '#EF4444', tension: 0.4 }
        ]
      });

      // Logique pour le graphique camembert (inchangée)
      setPieChartData({
        labels: ['Revenus', 'Dépenses'],
        datasets: [{
          data: [summaryResponse.data.totalIncome, summaryResponse.data.totalExpense],
          backgroundColor: ['#10B981', '#EF4444'],
        }]
      });

      // --- AJOUT : Calcul des données pour le nouveau graphique cumulatif ---
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
            label: 'Revenus Cumulés',
            data: cumulativeIncome,
            fill: true,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            tension: 0.4
          },
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
      showToast('error', 'Erreur', 'Impossible de charger les données');
    }
    finally { setLoading(false); }
  }, [currentDate, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useTransactionRefresh(fetchData);

  useEffect(() => {
    api.get('/categories').then(response => setAllCategories(response.data));
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
    if (isNewModalVisible) setIsNewModalVisible(false); // On ferme aussi la nouvelle modale
    notifyTransactionRefresh();
    fetchData();
  };

  const confirmDelete = (transactionId) => {
    const handleDelete = async () => {
      try {
        await api.delete(`/transactions/${transactionId}`);
        showToast('success', 'Succès', 'Transaction supprimée');
        notifyTransactionRefresh();
        fetchData();
      } catch (error) {
        showToast('error', 'Erreur', 'La suppression a échoué');
      }
    };
    confirmDialog({
      message: 'Êtes-vous sûr de vouloir supprimer cette transaction ?',
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: handleDelete,
    });
  };

  const formatCurrency = (value) => (value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

  const formatDate = (rowData) => {
    if (rowData.date) {
      return new Date(rowData.date).toLocaleDateString('fr-FR');
    }
    if (rowData.transactionType === 'recurring') {
      return `Le ${rowData.dayOfMonth || '1er'} du mois`;
    }
    return '-';
  };

  const typeTemplate = (rowData) => {
    const severity = rowData.type === 'income' ? 'success' : 'danger';
    const text = rowData.type === 'income' ? 'Revenu' : 'Dépense';
    return <Tag severity={severity} value={text}></Tag>;
  };

  const labelBodyTemplate = (rowData) => (
    <div className="flex align-items-center">
      {rowData.transactionType === 'recurring' && <i className="pi pi-sync mr-2" title="Transaction récurrente"></i>}
      {rowData.label}
    </div>
  );

  const actionBodyTemplate = (rowData) => (
    <div className="flex justify-content-center gap-2">
      <Button icon="pi pi-pencil" className="p-button-rounded p-button-success p-button-sm" onClick={() => handleEditClick(rowData)} />
      <Button icon="pi pi-trash" className="p-button-rounded p-button-danger p-button-sm" onClick={() => confirmDelete(rowData.id)} />
    </div>
  );

  const monthName = currentDate.toLocaleString('fr-FR', { month: 'long' });
  const year = currentDate.getFullYear();
  const endOfMonthBalance = (summary.startingBalance || 0) + (summary.totalIncome || 0) - (summary.totalExpense || 0);
  const categoryOptions = allCategories.map(c => ({ label: c.name, value: c.id }));

  const tableHeader = (
    <div className="flex flex-wrap justify-content-between align-items-center gap-2">
      <Button label="Ajouter une transaction" icon="pi pi-plus" className="p-button-success p-button-sm" onClick={() => setIsNewModalVisible(true)} />
      <div className="flex align-items-center gap-2">
        <Dropdown value={selectedCategoryId} options={categoryOptions} onChange={(e) => setSelectedCategoryId(e.value)} placeholder="Catégorie" showClear className="p-inputtext-sm" />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Rechercher..." className="p-inputtext-sm" />
        </span>
      </div>
    </div>
  );

  const createdAtDate = (rowData) => {
    return new Date(rowData.createdAt).toLocaleDateString('fr-FR');
  };


  const categoryBodyTemplate = (rowData) => {
    // Si la transaction n'a pas de catégories, on n'affiche rien.
    if (!rowData.Categories || rowData.Categories.length === 0) {
      return null;
    }
    // On affiche une pastille (Tag) pour chaque catégorie
    return (
      <div className="flex flex-wrap gap-1">
        {rowData.Categories.map(category => (
          <Tag key={category.id} value={category.name} style={{ background: category.color }}></Tag>
        ))}
      </div>
    );
  };
  return (
    <div>
      <div className="p-4">
        <div className="flex justify-content-between align-items-center mb-4">
          <Button icon="pi pi-arrow-left" onClick={() => changeMonth(-1)} />
          <h1 className="text-2xl capitalize m-0">{`Analyse de ${monthName} ${year}`}</h1>
          <Button icon="pi pi-arrow-right" onClick={() => changeMonth(1)} />
        </div>

        {/* MODIFICATION : Les cartes de résumé sont réintégrées ici */}
        <div className="grid text-center mb-4">
          <div className="col-12 md:col-3"><Card title="Solde Début de Mois"><h3 className="m-0">{formatCurrency(summary.startingBalance)}</h3></Card></div>
          <div className="col-12 md:col-3"><Card title="Total Revenus du Mois"><h3 className="m-0 text-green-400">{formatCurrency(summary.totalIncome)}</h3></Card></div>
          <div className="col-12 md:col-3"><Card title="Total Dépenses du Mois"><h3 className="m-0 text-red-400">{formatCurrency(summary.totalExpense)}</h3></Card></div>
          <div className="col-12 md:col-3"><Card title="Solde Fin de Mois"><h3 className="m-0" style={{ color: endOfMonthBalance >= 0 ? 'var(--green-400)' : 'var(--red-400)' }}>{formatCurrency(endOfMonthBalance)}</h3></Card></div>
        </div>

        <div className="grid">
          <div className="col-12 lg:col-4">
            {/* MODIFICATION : Le titre du graphique est mis à jour */}
            <Card title="Flux Journalier">
              <div style={{ position: 'relative', height: '300px' }}>
                <Chart type="line" data={lineChartData} options={chartOptions} />
              </div>
            </Card>
          </div>
          <div className="col-12 lg:col-4">
            <Card title="Progression Cumulée du Mois">
              <div style={{ position: 'relative', height: '300px' }}>
                <Chart type="line" data={cumulativeChartData} options={chartOptions} />
              </div>
            </Card>
          </div>
          <div className="col-12 lg:col-4">
            <Card title="Répartition Revenus / Dépenses">
              <div style={{ position: 'relative', height: '300px' }}>
                <Chart type="pie" data={pieChartData} options={chartOptions} />
              </div>
            </Card>
          </div>
        </div>

        <div className="card mt-4">
          <DataTable value={selectedCategoryId ? transactions.filter(t => t.Categories && t.Categories.some(c => c.id === selectedCategoryId)) : transactions} loading={loading} size="small" header={tableHeader} globalFilter={globalFilter} paginator rows={10} rowsPerPageOptions={[5, 10, 25, 50]} pt={{ bodyCell: { style: { padding: '0.25rem 0.5rem' } } }}>
            <Column field="label" header="Libellé" body={labelBodyTemplate} sortable />
            <Column field="amount" header="Montant" body={(rowData) => formatCurrency(rowData.amount)} sortable />
            <Column field="type" header="Type" body={typeTemplate} sortable />
            <Column header="Catégories" body={categoryBodyTemplate} />
            <Column field="date" header="Date" body={formatDate} sortable />
            <Column field="createdAt" header="Saisi le" body={createdAtDate} sortable />
            <Column body={actionBodyTemplate} header="Actions" style={{ width: '7rem', textAlign: 'center' }} />
          </DataTable>
        </div>
      </div>
      <Dialog header="Modifier la Transaction" visible={isEditModalVisible} style={{ width: '50vw' }} onHide={() => setIsEditModalVisible(false)}>
        <TransactionForm transactionToEdit={selectedTransaction} onComplete={handleComplete} />
      </Dialog>

      <Dialog header="Ajouter une Transaction" visible={isNewModalVisible} style={{ width: '50vw' }} onHide={() => setIsNewModalVisible(false)}>
        <TransactionForm onComplete={handleComplete} />
      </Dialog>
    </div>
  );
};

export default MonthlyViewPage;