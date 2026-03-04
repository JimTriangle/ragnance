import React from 'react';
import { ProgressBar } from 'primereact/progressbar';
import { Link } from 'react-router-dom';
import '../styles/cards.css';

const ProjectBudgetTracker = ({ budgets = [] }) => {

    const formatCurrency = (value) => (value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

    return (
        <div className="chart-card h-full">
            <div className="chart-card__header">
                <h2 className="chart-card__title">Suivi des Budgets Projet</h2>
            </div>
            {budgets.length > 0 ? (
                budgets.map(budget => {
                    const percentage = budget.totalAmount > 0 ? (budget.spentAmount / budget.totalAmount) * 100 : 0;
                    return (
                        <div key={budget.id} className="mb-3">
                            <div className="info-row mb-1">
                                <span className="info-row__label">{budget.name}</span>
                                <span className="info-row__value" style={{ color: percentage > 100 ? 'var(--red-400)' : 'inherit' }}>
                                    {formatCurrency(budget.spentAmount)} / {formatCurrency(budget.totalAmount)}
                                </span>
                            </div>
                            <ProgressBar value={percentage} showValue={false} style={{ height: '0.5rem' }} color={percentage > 100 ? '#EF4444' : '#10B981'} />
                        </div>
                    );
                })
            ) : (
                <div className="card-empty">
                    <i className="pi pi-folder-open card-empty__icon"></i>
                    <p className="card-empty__text">Aucun budget de projet.</p>
                    <Link to="/budget/project-budgets" className="p-button p-button-sm p-button-text mt-2">En créer un</Link>
                </div>
            )}
        </div>
    );
};

export default ProjectBudgetTracker;
