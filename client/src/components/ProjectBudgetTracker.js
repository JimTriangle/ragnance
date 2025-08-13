import React from 'react';
import { Card } from 'primereact/card';
import { ProgressBar } from 'primereact/progressbar';
import { Link } from 'react-router-dom';

// Le composant reçoit maintenant les budgets en "props"
const ProjectBudgetTracker = ({ budgets = [] }) => {

    const formatCurrency = (value) => (value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

    return (
        <Card title="Suivi des Budgets Projet">
            {budgets.length > 0 ? (
                budgets.map(budget => {
                    const percentage = budget.totalAmount > 0 ? (budget.spentAmount / budget.totalAmount) * 100 : 0;
                    return (
                        <div key={budget.id} className="mb-3">
                            <div className="flex justify-content-between mb-1 text-sm">
                                <span>{budget.name}</span>
                                <span style={{ color: percentage > 100 ? 'var(--red-400)' : 'inherit' }}>
                                    {formatCurrency(budget.spentAmount)} / {formatCurrency(budget.totalAmount)}
                                </span>
                            </div>
                            <ProgressBar value={percentage} showValue={false} style={{ height: '0.75rem' }} color={percentage > 100 ? '#EF4444' : '#10B981'} />
                        </div>
                    );
                })
            ) : (
                <div className="text-center text-gray-500">
                    <p>Aucun budget de projet.</p>
                    <Link to="/project-budgets" className="p-button p-button-sm p-button-text">En créer un</Link>
                </div>
            )}
        </Card>
    );
};

export default ProjectBudgetTracker;