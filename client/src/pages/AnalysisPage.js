import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import useTransactionRefresh from '../hooks/useTransactionRefresh';
import { Card } from 'primereact/card';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chart } from 'primereact/chart';

const AnalysisPage = () => {
    const [data, setData] = useState([]);
    const [chartData, setChartData] = useState(null);
    const [dateRange, setDateRange] = useState([
        new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        new Date()
    ]);
    const [loading, setLoading] = useState(false);

    const chartOptions = {
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right' } }
    };

    const fetchData = useCallback(async () => {
        const [startDate, endDate] = dateRange;
        if (!startDate || !endDate) return;
        setLoading(true);
        try {
            const response = await api.get(`/analysis/category-breakdown?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
            setData(response.data);
            const formattedChartData = {
                labels: response.data.map(item => item.categoryName),
                datasets: [{
                    data: response.data.map(item => item.totalAmount),
                    backgroundColor: response.data.map(item => item.categoryColor)
                }]
            };
            setChartData(formattedChartData);
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
            <h1>Analyse des Dépenses</h1>
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
                <div className="col-12 lg:col-6">
                    <Card title="Détail par catégorie">
                        <DataTable value={data} size="small" loading={loading}>
                            <Column field="categoryName" header="Catégorie" />
                            <Column field="totalAmount" header="Total Dépensé" body={(rowData) => formatCurrency(rowData.totalAmount)} />
                            <Column field="transactionCount" header="Nb. Transactions" />
                        </DataTable>
                    </Card>
                </div>
                <div className="col-12 lg:col-6">
                    <Card title="Répartition">
                        <div style={{ position: 'relative', height: '400px' }}>
                            {chartData && data.length > 0 ? (
                                <Chart type="doughnut" data={chartData} options={chartOptions} />
                            ) : (
                                <p className="text-center text-gray-500">Aucune donnée à afficher pour cette période.</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AnalysisPage;