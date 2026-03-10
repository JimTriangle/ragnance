import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import useTransactionRefresh from '../hooks/useTransactionRefresh';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { ColorPicker } from 'primereact/colorpicker';
import { InputSwitch } from 'primereact/inputswitch';
import { confirmDialog } from 'primereact/confirmdialog';
import useTour from '../hooks/useTour';
import TourButton from '../components/TourButton';
import '../styles/tour.css';
import '../styles/categories.css';

const CategoriesPage = () => {
    const [categories, setCategories] = useState([]);
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [name, setName] = useState('');
    const [color, setColor] = useState('CCCCCC');
    const [isTracked, setIsTracked] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const toast = useRef(null);

    const tourSteps = [
        {
            element: '[data-tour-id="categories-title"]',
            popover: {
                title: 'Gestion des Catégories 🏷️',
                description: 'Les catégories vous permettent d\'organiser vos transactions. Créez des catégories personnalisées pour mieux suivre vos dépenses et revenus.',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '[data-tour-id="add-category-btn"]',
            popover: {
                title: 'Nouvelle Catégorie ➕',
                description: 'Cliquez ici pour créer une nouvelle catégorie. Vous pourrez lui donner un nom, une couleur, et choisir si elle doit être suivie mensuellement.',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '[data-tour-id="categories-grid"]',
            popover: {
                title: 'Vos Catégories 📋',
                description: 'Toutes vos catégories sont affichées ici sous forme de cartes. La pastille colorée vous aide à les identifier rapidement.',
                side: 'top',
                align: 'start'
            }
        },
        {
            element: '[data-tour-id="tracked-toggle"]',
            popover: {
                title: 'Suivi Mensuel 📊',
                description: 'Activez cette option pour qu\'une catégorie soit incluse dans les statistiques et analyses mensuelles. Utile pour suivre vos principales sources de dépenses.',
                side: 'left',
                align: 'center'
            }
        },
        {
            popover: {
                title: 'Astuce 💡',
                description: 'Vous pouvez modifier ou supprimer vos catégories à tout moment. Les catégories bien organisées facilitent l\'analyse de vos finances. Utilisez des couleurs distinctes pour mieux les identifier !',
            }
        }
    ];

    const { startTour } = useTour('categories', tourSteps, true);

    const fetchCategories = useCallback(async () => {
        const response = await api.get('/categories');
        setCategories(response.data);
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    useTransactionRefresh(fetchCategories);

    const openNew = () => {
        setIsEditMode(false);
        setSelectedCategoryId(null);
        setName('');
        setColor('CCCCCC');
        setIsTracked(false);
        setIsDialogVisible(true);
    };

    const editCategory = (category) => {
        setIsEditMode(true);
        setSelectedCategoryId(category.id);
        setName(category.name);
        setColor(category.color.substring(1));
        setIsTracked(category.isTrackedMonthly);
        setIsDialogVisible(true);
    };

    const hideDialog = () => {
        setIsDialogVisible(false);
        setIsEditMode(false);
        setSelectedCategoryId(null);
    };

    const saveCategory = async () => {
        if (!name) return;

        const payload = { name, color: `#${color}`, isTrackedMonthly: isTracked };

        try {
            if (isEditMode) {
                await api.put(`/categories/${selectedCategoryId}`, payload);
                toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Catégorie modifiée' });
            } else {
                await api.post('/categories', payload);
                toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Catégorie créée' });
            }
            fetchCategories();
            hideDialog();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'L\'opération a échoué' });
        }
    };

    const deleteCategory = (categoryId) => {
        const performDelete = async () => {
            try {
                await api.delete(`/categories/${categoryId}`);
                fetchCategories();
                toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Catégorie supprimée' });
            } catch (error) {
                toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'La suppression a échoué' });
            }
        };
        confirmDialog({
            message: 'Êtes-vous sûr de vouloir supprimer cette catégorie ?',
            header: 'Confirmation de suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            accept: performDelete
        });
    };

    const onTrackedChange = async (e, category) => {
        const updatedCategory = { ...category, isTrackedMonthly: e.value };
        try {
            await api.put(`/categories/${category.id}`, updatedCategory);
            setCategories(prev => prev.map(c => (c.id === category.id ? updatedCategory : c)));
            toast.current.show({ severity: 'info', summary: 'Mise à jour', detail: 'Suivi mensuel modifié', life: 2000 });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'La mise à jour a échoué' });
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(globalFilter.toLowerCase())
    );

    const dialogFooter = (
        <div>
            <Button label="Annuler" icon="pi pi-times" className="btn-modern btn-modern--ghost" onClick={hideDialog} />
            <Button label="Sauvegarder" icon="pi pi-check" className="btn-modern" onClick={saveCategory} />
        </div>
    );

    const dialogTitle = isEditMode ? "Modifier la Catégorie" : "Nouvelle Catégorie";

    return (
        <div className="p-4">
            <TourButton onStartTour={startTour} tooltip="Revoir le guide des Catégories" />
            <Toast ref={toast} />

            <div className="categories-header" data-tour-id="categories-title">
                <div>
                    <h1 className="categories-title">Catégories</h1>
                    <p className="categories-subtitle">{categories.length} catégorie{categories.length !== 1 ? 's' : ''}</p>
                </div>
                <Button
                    label="Nouvelle Catégorie"
                    icon="pi pi-plus"
                    className="btn-modern btn-modern--success btn-modern--sm"
                    onClick={openNew}
                    data-tour-id="add-category-btn"
                />
            </div>

            <div className="categories-search">
                <span className="p-input-icon-left" style={{ width: '100%' }}>
                    <i className="pi pi-search" />
                    <InputText
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Rechercher une catégorie..."
                        className="p-inputtext-sm"
                        style={{ width: '100%' }}
                    />
                </span>
            </div>

            <div className="categories-grid" data-tour-id="categories-grid">
                {filteredCategories.map((category) => (
                    <div key={category.id} className="category-card">
                        <div className="category-card-main">
                            <span
                                className="category-color-dot"
                                style={{ backgroundColor: category.color }}
                            />
                            <span className="category-name">{category.name}</span>
                        </div>
                        <div className="category-card-actions">
                            <div className="category-tracked" data-tour-id="tracked-toggle">
                                <InputSwitch
                                    checked={category.isTrackedMonthly}
                                    onChange={(e) => onTrackedChange(e, category)}
                                />
                                <span className="category-tracked-label">Suivi</span>
                            </div>
                            <div className="category-buttons">
                                <Button
                                    icon="pi pi-pencil"
                                    className="btn-icon-modern"
                                    onClick={() => editCategory(category)}
                                    aria-label="Modifier la catégorie"
                                />
                                <Button
                                    icon="pi pi-trash"
                                    className="btn-icon-modern btn-icon-modern--danger"
                                    onClick={() => deleteCategory(category.id)}
                                    aria-label="Supprimer la catégorie"
                                />
                            </div>
                        </div>
                    </div>
                ))}
                {filteredCategories.length === 0 && (
                    <div className="categories-empty">
                        <i className="pi pi-inbox" style={{ fontSize: '2rem', opacity: 0.3 }} />
                        <p>{globalFilter ? 'Aucune catégorie trouvée.' : 'Aucune catégorie pour le moment.'}</p>
                    </div>
                )}
            </div>

            <Dialog visible={isDialogVisible} style={{ width: '450px' }} breakpoints={{ '641px': '95vw' }} header={dialogTitle} modal onHide={hideDialog} footer={dialogFooter}>
                <div className="field">
                    <label htmlFor="name">Nom</label>
                    <InputText id="name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
                </div>
                <div className="field mt-4">
                    <label htmlFor="color" className="block mb-2">Couleur</label>
                    <ColorPicker id="color" value={color} onChange={(e) => setColor(e.value)} />
                </div>
                <div className="field flex align-items-center mt-4">
                    <InputSwitch id="isTracked" checked={isTracked} onChange={(e) => setIsTracked(e.value)} />
                    <label htmlFor="isTracked" className="ml-2">Suivre mensuellement dans les budgets</label>
                </div>
            </Dialog>
        </div>
    );
};

export default CategoriesPage;
