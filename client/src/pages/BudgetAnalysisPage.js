import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import api from '../services/api';
import useTransactionRefresh from '../hooks/useTransactionRefresh';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Tag } from 'primereact/tag';
import { Chart } from 'primereact/chart';
import { ProgressBar } from 'primereact/progressbar';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { ToastContext } from '../context/ToastContext';
import { Skeleton } from 'primereact/skeleton';
import useChartTheme from '../hooks/useChartTheme';

const BudgetAnalysisPage = () => {
    const [data, setData] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [periodFilter, setPeriodFilter] = useState('6');
    const [selectedCategories, setSelectedCategories] = useState(null);
    const navigate = useNavigate();
    const { showToast } = useContext(ToastContext);

    const { barChartOptions: baseChartOptions, colors: themeColors } = useChartTheme();

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

    // Options de filtre période
    const periodOptions = [
        { label: '3 derniers mois', value: '3' },
        { label: '6 derniers mois', value: '6' },
        { label: '12 derniers mois', value: '12' },
        { label: 'Tout', value: 'all' }
    ];

    // Options de catégories pour le MultiSelect
    const categoryOptions = useMemo(() =>
        data.map(c => ({ label: c.info.name, value: c.info.id })),
        [data]
    );

    // Données filtrées par période et catégorie
    const filteredData = useMemo(() => {
        let result = data;

        // Filtre par catégorie
        if (selectedCategories && selectedCategories.length > 0) {
            result = result.filter(c => selectedCategories.includes(c.info.id));
        }

        // Filtre par période
        if (periodFilter !== 'all') {
            const limit = parseInt(periodFilter);
            result = result.map(c => ({
                ...c,
                history: c.history.slice(-limit)
            }));
        }

        return result;
    }, [data, periodFilter, selectedCategories]);

    // Résumé global
    const globalSummary = useMemo(() => {
        let totalBudgeted = 0;
        let totalSpent = 0;
        let monthCount = 0;

        filteredData.forEach(c => {
            c.history.forEach(h => {
                totalBudgeted += h.budgeted;
                totalSpent += h.spent;
                monthCount++;
            });
        });

        const totalDiff = totalBudgeted - totalSpent;
        const categoryCount = filteredData.length;
        const avgMonthlyDiff = monthCount > 0 ? totalDiff / (monthCount / (categoryCount || 1)) : 0;

        return { totalBudgeted, totalSpent, totalDiff, avgMonthlyDiff };
    }, [filteredData]);

    // Calcul des totaux par catégorie
    const getCategoryTotals = (history) => {
        const totalBudgeted = history.reduce((sum, h) => sum + h.budgeted, 0);
        const totalSpent = history.reduce((sum, h) => sum + h.spent, 0);
        const totalDiff = totalBudgeted - totalSpent;
        const avgDiff = history.length > 0 ? totalDiff / history.length : 0;
        return { totalBudgeted, totalSpent, totalDiff, avgDiff };
    };

    // Chart.js plugin pour colorer la zone entre les deux courbes
    const fillBetweenPlugin = useMemo(() => ({
        id: 'fillBetween',
        beforeDatasetsDraw(chart) {
            const { ctx, scales: { x, y }, data: chartData } = chart;
            const budgetData = chartData.datasets[0].data;
            const spentData = chartData.datasets[1].data;

            if (!budgetData.length || !spentData.length) return;

            ctx.save();

            for (let i = 0; i < budgetData.length - 1; i++) {
                const x1 = x.getPixelForValue(i);
                const x2 = x.getPixelForValue(i + 1);

                const budgetY1 = y.getPixelForValue(budgetData[i]);
                const budgetY2 = y.getPixelForValue(budgetData[i + 1]);
                const spentY1 = y.getPixelForValue(spentData[i]);
                const spentY2 = y.getPixelForValue(spentData[i + 1]);

                // Sous budget = vert, au-dessus = rouge
                const isUnder1 = spentData[i] <= budgetData[i];
                const isUnder2 = spentData[i + 1] <= budgetData[i + 1];

                ctx.beginPath();
                ctx.moveTo(x1, budgetY1);
                ctx.lineTo(x2, budgetY2);
                ctx.lineTo(x2, spentY2);
                ctx.lineTo(x1, spentY1);
                ctx.closePath();

                if (isUnder1 && isUnder2) {
                    ctx.fillStyle = 'rgba(76, 175, 80, 0.15)';
                } else if (!isUnder1 && !isUnder2) {
                    ctx.fillStyle = 'rgba(244, 67, 54, 0.15)';
                } else {
                    ctx.fillStyle = 'rgba(255, 167, 38, 0.1)';
                }
                ctx.fill();
            }

            ctx.restore();
        }
    }), []);

    const getChartData = (history) => {
        const labels = history.map(h => `${h.month}/${h.year}`);
        return {
            labels,
            datasets: [
                {
                    label: 'Budget Défini',
                    data: history.map(h => h.budgeted),
                    borderColor: '#42A5F5',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Dépenses Réelles',
                    data: history.map(h => h.spent),
                    borderColor: '#FFA726',
                    tension: 0.4,
                    fill: false
                }
            ]
        };
    };

    const getChartOptions = () => ({
        ...baseChartOptions,
        plugins: {
            ...baseChartOptions.plugins,
            legend: {
                ...baseChartOptions.plugins?.legend,
                labels: {
                    ...baseChartOptions.plugins?.legend?.labels,
                    color: themeColors.legendColor
                }
            }
        }
    });

    const differenceBodyTemplate = (rowData, { rowIndex }, history) => {
        const diff = rowData.budgeted - rowData.spent;
        const color = diff >= 0 ? 'var(--green-400)' : 'var(--red-400)';

        // Indicateur de tendance par rapport au mois précédent
        let trendIcon = null;
        if (rowIndex > 0) {
            const prevDiff = history[rowIndex - 1].budgeted - history[rowIndex - 1].spent;
            if (diff > prevDiff) {
                trendIcon = <i className="pi pi-arrow-up text-xs ml-2" style={{ color: 'var(--green-400)' }} title="Amélioration" />;
            } else if (diff < prevDiff) {
                trendIcon = <i className="pi pi-arrow-down text-xs ml-2" style={{ color: 'var(--red-400)' }} title="Dégradation" />;
            } else {
                trendIcon = <i className="pi pi-minus text-xs ml-2" style={{ color: 'var(--text-color-secondary)' }} title="Stable" />;
            }
        }

        return (
            <span style={{ color }}>
                {formatCurrency(diff)}{trendIcon}
            </span>
        );
    };

    const consumptionBodyTemplate = (rowData) => {
        const pct = rowData.budgeted > 0 ? Math.round((rowData.spent / rowData.budgeted) * 100) : 0;
        const color = pct > 100 ? 'var(--red-400)' : pct > 85 ? 'var(--orange-400)' : 'var(--green-400)';

        return (
            <div className="flex align-items-center gap-2">
                <ProgressBar
                    value={Math.min(pct, 100)}
                    showValue={false}
                    style={{ height: '0.5rem', width: '4rem' }}
                    color={color}
                />
                <span className="text-xs" style={{ color }}>{pct}%</span>
            </div>
        );
    };

    const monthBodyTemplate = (rowData) => `${rowData.month} / ${rowData.year}`;

    const getFooterGroup = (totals) => (
        <ColumnGroup>
            <Row>
                <Column footer="Total" style={{ fontWeight: 'bold' }} />
                <Column footer={formatCurrency(totals.totalBudgeted)} style={{ fontWeight: 'bold' }} />
                <Column footer={formatCurrency(totals.totalSpent)} style={{ fontWeight: 'bold' }} />
                <Column footer={() => {
                    const color = totals.totalDiff >= 0 ? 'var(--green-400)' : 'var(--red-400)';
                    return <span style={{ color, fontWeight: 'bold' }}>{formatCurrency(totals.totalDiff)}</span>;
                }} />
                <Column footer="" />
            </Row>
            <Row>
                <Column footer="Moyenne / mois" style={{ fontStyle: 'italic', fontSize: '0.85rem' }} />
                <Column footer="" />
                <Column footer="" />
                <Column footer={() => {
                    const color = totals.avgDiff >= 0 ? 'var(--green-400)' : 'var(--red-400)';
                    return <span style={{ color, fontStyle: 'italic', fontSize: '0.85rem' }}>{formatCurrency(totals.avgDiff)}</span>;
                }} />
                <Column footer="" />
            </Row>
        </ColumnGroup>
    );

    const getDiffColor = (value) => value >= 0 ? 'var(--green-400)' : 'var(--red-400)';
    const getDiffLabel = (value) => value > 0 ? 'Excédentaire' : value < 0 ? 'Déficitaire' : 'À l\'équilibre';
    const getDiffSeverity = (value) => value > 0 ? 'success' : value < 0 ? 'danger' : 'info';

    const suggestionCard = (suggestion) => {
        const icon = suggestion.type === 'increase' ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
        const color = suggestion.type === 'increase' ? 'btn-modern--warning' : 'btn-modern--info';

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
                        className={`btn-modern btn-modern--sm w-full ${color}`}
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

            {/* Résumé global */}
            {filteredData.length > 0 && (
                <div className="grid mt-4">
                    <div className="col-12 md:col-3">
                        <Card className="text-center">
                            <div className="text-sm text-500 mb-1">Total budgeté</div>
                            <div className="text-xl font-bold">{formatCurrency(globalSummary.totalBudgeted)}</div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-3">
                        <Card className="text-center">
                            <div className="text-sm text-500 mb-1">Total dépensé</div>
                            <div className="text-xl font-bold">{formatCurrency(globalSummary.totalSpent)}</div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-3">
                        <Card className="text-center">
                            <div className="text-sm text-500 mb-1">Différence globale</div>
                            <div className="text-xl font-bold" style={{ color: getDiffColor(globalSummary.totalDiff) }}>
                                {formatCurrency(globalSummary.totalDiff)}
                            </div>
                            <Tag severity={getDiffSeverity(globalSummary.totalDiff)} value={getDiffLabel(globalSummary.totalDiff)} className="mt-1" />
                        </Card>
                    </div>
                    <div className="col-12 md:col-3">
                        <Card className="text-center">
                            <div className="text-sm text-500 mb-1">Moyenne / mois</div>
                            <div className="text-xl font-bold" style={{ color: getDiffColor(globalSummary.avgMonthlyDiff) }}>
                                {formatCurrency(globalSummary.avgMonthlyDiff)}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* Filtres */}
            <div className="flex flex-wrap align-items-center gap-3 mt-4">
                <div className="flex align-items-center gap-2">
                    <label className="text-sm font-medium">Période :</label>
                    <Dropdown
                        value={periodFilter}
                        options={periodOptions}
                        onChange={(e) => setPeriodFilter(e.value)}
                        className="w-12rem"
                    />
                </div>
                <div className="flex align-items-center gap-2">
                    <label className="text-sm font-medium">Catégories :</label>
                    <MultiSelect
                        value={selectedCategories}
                        options={categoryOptions}
                        onChange={(e) => setSelectedCategories(e.value)}
                        placeholder="Toutes les catégories"
                        className="w-18rem"
                        display="chip"
                        showClear
                    />
                </div>
            </div>

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
                {filteredData.map(categoryData => {
                    const totals = getCategoryTotals(categoryData.history);
                    return (
                        <Card key={categoryData.info.id} title={categoryData.info.name} className="mb-4">
                            <div className="grid">
                                <div className="col-12 lg:col-6">
                                    <DataTable
                                        value={categoryData.history}
                                        size="small"
                                        responsiveLayout="scroll"
                                        footerColumnGroup={getFooterGroup(totals)}
                                    >
                                        <Column body={monthBodyTemplate} header="Mois" />
                                        <Column field="budgeted" header="Budget" body={(rowData) => formatCurrency(rowData.budgeted)} />
                                        <Column field="spent" header="Dépensé" body={(rowData) => formatCurrency(rowData.spent)} />
                                        <Column header="Différence" body={(rowData, options) => differenceBodyTemplate(rowData, options, categoryData.history)} />
                                        <Column header="%" body={consumptionBodyTemplate} style={{ width: '8rem' }} />
                                    </DataTable>
                                </div>
                                <div className="col-12 lg:col-6">
                                    <Chart
                                        type="line"
                                        data={getChartData(categoryData.history)}
                                        options={getChartOptions()}
                                        plugins={[fillBetweenPlugin]}
                                    />
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default BudgetAnalysisPage;
