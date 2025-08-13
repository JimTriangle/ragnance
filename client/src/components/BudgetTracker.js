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
                    return (
                        <div key={item.categoryId} className="mb-3">
                            <div className="flex justify-content-between mb-1 text-sm">
                                <span>{item.categoryName}</span>
                                <span style={{ color: percentage > 100 ? 'var(--red-400)' : 'inherit' }}>
                                    {formatCurrency(item.spentAmount)} / {formatCurrency(item.budgetedAmount)}
                                </span>
                            </div>
                            <ProgressBar value={percentage} showValue={false} style={{ height: '0.75rem' }} color={item.categoryColor} />
                        </div>
                    );
                })
            ) : (
                <p className="text-center text-gray-500">Aucun budget à suivre pour ce mois-ci.</p>
            )}
        </div>
    );
};

export default BudgetTracker;