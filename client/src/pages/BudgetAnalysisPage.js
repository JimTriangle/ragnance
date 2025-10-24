import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';
import useTransactionRefresh from '../hooks/useTransactionRefresh';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Chart } from 'primereact/chart';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { ToastContext } from '../context/ToastContext';
import { Skeleton } from 'primereact/skeleton';

const BudgetAnalysisPage = () => {
    const [data, setData] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { showToast } = useContext(ToastContext);

    const chartOptions = {
        maintainAspectRatio: false,
        aspectRatio: 1.5,
        plugins: { legend: { labels: { color: '#CCC' } } },
        scales: {
            x: { ticks: { color: '#CCC' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            y: { ticks: { color: '#CCC' }, grid: { color: 'rgba(255,255,255,0.1)' } }
        }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/analysis/budget-history');
            setData(response.data.analysis);
            setSuggestions(response.data.suggestions);
        } catch (error) {
            showToast('error', 'Erreur', 'Impossible de charger les données d\'analyse');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useTransactionRefresh(fetchData);

    const formatCurrency = (value) => (value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

    const getChartData = (history) => {
        const labels = history.map(h => `${h.month}/${h.year}`);
        return {
            labels,
            datasets: [
                {
                    label: 'Budget Défini',
                    data: history.map(h => h.budgeted),
                    borderColor: '#42A5F5',
                    tension: 0.4
                },
                {
                    label: 'Dépenses Réelles',
                    data: history.map(h => h.spent),
                    borderColor: '#FFA726',
                    backgroundColor: 'rgba(255, 167, 38, 0.2)',
                    fill: true,
                    tension: 0.4
                }
            ]
        };
    };

    const differenceBodyTemplate = (rowData) => {
        const diff = rowData.budgeted - rowData.spent;
        const color = diff >= 0 ? 'var(--green-400)' : 'var(--red-400)';
        return <span style={{ color }}>{formatCurrency(diff)}</span>;
    };

    const monthBodyTemplate = (rowData) => `${rowData.month} / ${rowData.year}`;

    const suggestionCard = (suggestion) => {
        const icon = suggestion.type === 'increase' ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
        const color = suggestion.type === 'increase' ? 'p-button-warning' : 'p-button-info';

        return (
            <div key={suggestion.categoryId} className="col-12 md:col-6 lg:col-4">
                <Card title={<><i className={`${icon} mr-2`}></i>Suggestion: {suggestion.categoryName}</>}>
                    <div className="text-center mb-3">
                        <p className="text-sm text-gray-500">{suggestion.reason}</p>
                        <div className="flex justify-content-center align-items-center gap-3 mt-2">
                            <Tag value={formatCurrency(suggestion.currentBudget)} />
                            <i className="pi pi-arrow-right"></i>
                            <Tag severity={suggestion.type === 'increase' ? 'warning' : 'info'} value={formatCurrency(suggestion.suggestedBudget)} />
                        </div>
                    </div>
                    <Button
                        label="Gérer les budgets"
                        icon="pi pi-pencil"
                        className={`p-button-sm w-full ${color}`}
                        onClick={() => navigate('/budget/budgets')}
                    />
                </Card>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-4">
                <Skeleton width="10rem" height="2rem" className="mb-4" />
                <div className="grid">
                    <div className="col-12 lg:col-6 xl:col-4"><Skeleton height="15rem" /></div>
                    <div className="col-12 lg:col-6 xl:col-4"><Skeleton height="15rem" /></div>
                </div>
                <Skeleton height="20rem" className="mt-4" />
            </div>
        )
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl">Analyse et Suggestions des Budgets</h1>

            {suggestions.length > 0 && (
                <div className="mt-4">
                    <h2 className="text-xl mb-3">Nos recommandations ✨</h2>
                    <div className="grid">
                        {suggestions.map(suggestionCard)}
                    </div>
                </div>
            )}

            <div className="mt-4">
                <h2 className="text-xl mb-3">Historique par catégorie</h2>
                {data.map(categoryData => (
                    <Card key={categoryData.info.id} title={categoryData.info.name} className="mb-4">
                        <div className="grid">
                            <div className="col-12 lg:col-6">
                                <DataTable value={categoryData.history} size="small" responsiveLayout="scroll">
                                    <Column body={monthBodyTemplate} header="Mois" />
                                    <Column field="budgeted" header="Budget" body={(rowData) => formatCurrency(rowData.budgeted)} />
                                    <Column field="spent" header="Dépensé" body={(rowData) => formatCurrency(rowData.spent)} />
                                    <Column header="Différence" body={differenceBodyTemplate} />
                                </DataTable>
                            </div>
                            <div className="col-12 lg:col-6">
                                <Chart type="line" data={getChartData(categoryData.history)} options={chartOptions} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default BudgetAnalysisPage;