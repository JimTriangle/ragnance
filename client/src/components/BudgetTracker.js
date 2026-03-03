import React from 'react';
import { ProgressBar } from 'primereact/progressbar';

// Le composant reçoit maintenant les données en "props"
const BudgetTracker = ({ data = [] }) => {

    const formatCurrency = (value) => (value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

    return (
        <div>
            {data.length > 0 ? (
                data.map(item => {
                    const percentage = item.budgetedAmount > 0 ? (item.spentAmount / item.budgetedAmount) * 100 : 0;
                    const difference = item.budgetedAmount - item.spentAmount;
                    const diffColor = difference >= 0 ? 'var(--green-400)' : 'var(--red-400)';
                    return (
                        <div key={item.categoryId} className="mb-3">
                            <div className="flex justify-content-between mb-1 text-sm">
                                <span>{item.categoryName}</span>
                                <div className="text-right">
                                    <div style={{ color: percentage > 100 ? 'var(--red-400)' : 'inherit' }}>
                                        {formatCurrency(item.spentAmount)} / {formatCurrency(item.budgetedAmount)}
                                    </div>
                                    <div style={{ color: diffColor }}>
                                        {formatCurrency(difference)}
                                    </div>
                                </div>
                            </div>
                            <ProgressBar value={percentage} showValue={false} style={{ height: '0.75rem' }} color={item.categoryColor} />
                        </div>
                    );
                })
            ) : (
                <div className="flex flex-column align-items-center justify-content-center p-4 text-center">
                    <i className="pi pi-wallet text-400" style={{ fontSize: '3rem' }}></i>
                    <p className="mt-2 mb-0 text-500 font-medium">Aucun budget à suivre</p>
                    <p className="text-sm text-400 mt-1">Définissez des budgets mensuels pour suivre vos dépenses par catégorie.</p>
                </div>
            )}
        </div>
    );
};

export default BudgetTracker;