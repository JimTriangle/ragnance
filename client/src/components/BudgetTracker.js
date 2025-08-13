import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';
import { ProgressBar } from 'primereact/progressbar';
import { AuthContext } from '../context/AuthContext';

const BudgetTracker = () => {
    const [data, setData] = useState([]);
    const { user } = useContext(AuthContext);

    const fetchData = useCallback(async () => {
        if (!user) return;
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        try {
            const response = await api.get(`/budgets/progress/${year}/${month}`);
            setData(response.data);
        } catch (error) {
            console.error("Erreur fetch budget progress", error);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
        // Ajout d'un écouteur pour rafraîchir quand l'utilisateur revient sur la page
        window.addEventListener('focus', fetchData);
        return () => {
            window.removeEventListener('focus', fetchData);
        };
    }, [fetchData]); // Se relance si l'utilisateur change

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
                <p className="text-center text-gray-500">Aucun budget défini pour ce mois-ci.</p>
            )}
        </div>
    );
};

export default BudgetTracker;