import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import useTransactionRefresh from '../hooks/useTransactionRefresh';
import { Card } from 'primereact/card';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chart } from 'primereact/chart';
import { SelectButton } from 'primereact/selectbutton';

const AnalysisPage = () => {
    const [expenseData, setExpenseData] = useState([]);
    const [incomeData, setIncomeData] = useState([]);
    const [expenseChartData, setExpenseChartData] = useState(null);
    const [incomeChartData, setIncomeChartData] = useState(null);
    const [dateRange, setDateRange] = useState([
        new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        new Date()
    ]);
    const [loading, setLoading] = useState(false);
    const [expenseChartType, setExpenseChartType] = useState('doughnut');
    const [incomeChartType, setIncomeChartType] = useState('doughnut');

    const chartTypeOptions = [
        { label: 'Camembert', value: 'doughnut' },
        { label: 'Barres', value: 'bar' }
    ];

    const doughnutOptions = {
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right' } }
    };

    const barOptions = {
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
            x: { beginAtZero: true }
        }
    };

    const fetchData = useCallback(async () => {
        const [startDate, endDate] = dateRange;
        if (!startDate || !endDate) return;
        setLoading(true);
        try {
            // Récupération des dépenses
            const expenseResponse = await api.get(`/analysis/category-breakdown?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
            setExpenseData(expenseResponse.data);
            const formattedExpenseChartData = {
                labels: expenseResponse.data.map(item => item.categoryName),
                datasets: [{
                    label: 'Dépenses',
                    data: expenseResponse.data.map(item => item.totalAmount),
                    backgroundColor: expenseResponse.data.map(item => item.categoryColor)
                }]
            };
            setExpenseChartData(formattedExpenseChartData);

            // Récupération des revenus
            const incomeResponse = await api.get(`/analysis/income-category-breakdown?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
            setIncomeData(incomeResponse.data);
            const formattedIncomeChartData = {
                labels: incomeResponse.data.map(item => item.categoryName),
                datasets: [{
                    label: 'Revenus',
                    data: incomeResponse.data.map(item => item.totalAmount),
                    backgroundColor: incomeResponse.data.map(item => item.categoryColor)
                }]
            };
            setIncomeChartData(formattedIncomeChartData);
        } catch (error) {
            console.error("Erreur fetch analysis", error);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    // Fetch data on initial load
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useTransactionRefresh(fetchData);


    const formatCurrency = (value) => (value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

    return (
        <div className="p-4">
            <h1>Analyse des Dépenses et Revenus</h1>
            <Card className="mt-4">
                <div className="flex flex-wrap gap-4 align-items-center">
                    <div className="p-float-label">
                        <Calendar value={dateRange} onChange={(e) => setDateRange(e.value)} selectionMode="range" readOnlyInput dateFormat="dd/mm/yy"/>
                        <label>Période d'analyse</label>
                    </div>
                    <Button label="Analyser" icon="pi pi-search" onClick={fetchData} loading={loading} />
                </div>
            </Card>
            <div className="grid mt-4">
                {/* Section Dépenses */}
                <div className="col-12 lg:col-6">
                    <Card title="Dépenses" className="h-full">
                        <div className="mb-3">
                            <SelectButton value={expenseChartType} onChange={(e) => setExpenseChartType(e.value)} options={chartTypeOptions} />
                        </div>
                        <div className="grid">
                            <div className="col-12">
                                <Card title="Répartition" className="mb-3">
                                    <div style={{ position: 'relative', height: '400px' }}>
                                        {expenseChartData && expenseData.length > 0 ? (
                                            <Chart
                                                type={expenseChartType}
                                                data={expenseChartData}
                                                options={expenseChartType === 'doughnut' ? doughnutOptions : barOptions}
                                            />
                                        ) : (
                                            <p className="text-center text-gray-500">Aucune donnée à afficher pour cette période.</p>
                                        )}
                                    </div>
                                </Card>
                            </div>
                            <div className="col-12">
                                <Card title="Détail par catégorie">
                                    <DataTable value={expenseData} size="small" loading={loading}>
                                        <Column field="categoryName" header="Catégorie" />
                                        <Column field="totalAmount" header="Total Dépensé" body={(rowData) => formatCurrency(rowData.totalAmount)} />
                                        <Column field="transactionCount" header="Nb. Transactions" />
                                    </DataTable>
                                </Card>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Section Revenus */}
                <div className="col-12 lg:col-6">
                    <Card title="Revenus" className="h-full">
                        <div className="mb-3">
                            <SelectButton value={incomeChartType} onChange={(e) => setIncomeChartType(e.value)} options={chartTypeOptions} />
                        </div>
                        <div className="grid">
                            <div className="col-12">
                                <Card title="Répartition" className="mb-3">
                                    <div style={{ position: 'relative', height: '400px' }}>
                                        {incomeChartData && incomeData.length > 0 ? (
                                            <Chart
                                                type={incomeChartType}
                                                data={incomeChartData}
                                                options={incomeChartType === 'doughnut' ? doughnutOptions : barOptions}
                                            />
                                        ) : (
                                            <p className="text-center text-gray-500">Aucune donnée à afficher pour cette période.</p>
                                        )}
                                    </div>
                                </Card>
                            </div>
                            <div className="col-12">
                                <Card title="Détail par catégorie">
                                    <DataTable value={incomeData} size="small" loading={loading}>
                                        <Column field="categoryName" header="Catégorie" />
                                        <Column field="totalAmount" header="Total Perçu" body={(rowData) => formatCurrency(rowData.totalAmount)} />
                                        <Column field="transactionCount" header="Nb. Transactions" />
                                    </DataTable>
                                </Card>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AnalysisPage;