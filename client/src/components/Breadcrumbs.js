import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const ROUTE_LABELS = {
  'budget': 'Budget',
  'dashboard': 'Dashboard',
  'monthly': 'Vue Mensuelle',
  'categories': 'Catégories',
  'budgets': 'Budgets Mensuels',
  'project-budgets': 'Budgets Projets',
  'savings': 'Épargnes',
  'savings-goals': 'Objectifs Épargne',
  'analysis': 'Analyse Dépenses',
  'budget-analysis': 'Analyse Budgets',
  'calculator': 'Répartition de Charges',
  'profile': 'Profil',
  'admin': 'Administration',
  'trading': 'Trading',
  'portfolios': 'Portefeuilles',
  'exchanges': 'Clés API',
  'strategies': 'Stratégies',
  'backtests': 'Backtests',
  'bot-activity': 'Bot',
};

const Breadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length <= 1) return null;

  const crumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const label = ROUTE_LABELS[segment] || segment;
    const isLast = index === pathSegments.length - 1;

    return (
      <span key={path}>
        {index > 0 && <span className="mx-1">/</span>}
        {isLast ? (
          <span>{label}</span>
        ) : (
          <Link to={path}>{label}</Link>
        )}
      </span>
    );
  });

  return (
    <div className="breadcrumb-bar">
      {crumbs}
    </div>
  );
};

export default Breadcrumbs;
