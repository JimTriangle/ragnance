import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const AppSidebar = ({
    visible,
    onHide,
    navItems = [],
    section = 'budget',
    additionalActions = null
}) => {
    const { user, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleNavigation = (path) => {
        navigate(path);
        onHide(); // Fermer le sidebar après navigation
    };

    const handleSectionSwitch = (targetSection) => {
        if (targetSection === 'budget') {
            navigate('/budget/dashboard');
        } else if (targetSection === 'trading') {
            navigate('/trading');
        }
        onHide();
    };

    return (
        <Sidebar
            visible={visible}
            onHide={onHide}
            position="left"
            className="app-sidebar"
            style={{ width: '280px' }}
        >
            <div className="flex flex-column h-full">
                {/* En-tête du Sidebar */}
                <div className="sidebar-header mb-3">
                    <h3 className="m-0 text-primary">
                        <i className="pi pi-bars mr-2"></i>
                        {section === 'budget' ? 'Budget' : 'Trading'}
                    </h3>
                </div>

                <Divider className="my-2" />

                {/* Navigation principale */}
                <nav className="flex-grow-1 overflow-y-auto">
                    <div className="flex flex-column gap-1">
                        {navItems.map((item, index) => {
                            // Si c'est une section avec des sous-éléments
                            if (item.section && item.items) {
                                return (
                                    <div key={index} className="mb-2">
                                        <div className="sidebar-section-title px-3 py-2 text-sm font-semibold text-500">
                                            {item.section}
                                        </div>
                                        <div className="flex flex-column gap-1">
                                            {item.items.map((subItem, subIndex) => (
                                                <NavLink
                                                    key={`${index}-${subIndex}`}
                                                    to={subItem.to}
                                                    end={subItem.end}
                                                    className={({ isActive }) =>
                                                        `sidebar-nav-item p-button p-button-text ${isActive ? 'active' : ''} ${subItem.danger ? 'p-button-danger' : ''}`
                                                    }
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleNavigation(subItem.to);
                                                    }}
                                                >
                                                    {subItem.icon && <i className={`${subItem.icon} mr-2`}></i>}
                                                    {subItem.label}
                                                </NavLink>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }

                            // Sinon, c'est un élément simple
                            return (
                                <NavLink
                                    key={index}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `sidebar-nav-item p-button p-button-text ${isActive ? 'active' : ''} ${item.danger ? 'p-button-danger' : ''}`
                                    }
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleNavigation(item.to);
                                    }}
                                >
                                    {item.icon && <i className={`${item.icon} mr-2`}></i>}
                                    {item.label}
                                </NavLink>
                            );
                        })}
                    </div>
                </nav>

                <Divider className="my-2" />

                {/* Actions additionnelles (ex: Annonces, Ajouter Transaction) */}
                {additionalActions && (
                    <>
                        <div className="sidebar-actions mb-2">
                            {additionalActions}
                        </div>
                        <Divider className="my-2" />
                    </>
                )}

                {/* Section Utilisateur et Actions */}
                <div className="sidebar-footer">
                    {/* Bouton de changement de section */}
                    {/* MASQUÉ: Accès au trading désactivé */}
                    {/* {section === 'budget' && user?.tradingAccess && (
                        <Button
                            label="Passer au Trading"
                            icon="pi pi-chart-line"
                            className="w-full mb-2 p-button-secondary p-button-sm"
                            onClick={() => handleSectionSwitch('trading')}
                        />
                    )} */}
                    {section === 'trading' && user?.budgetAccess && (
                        <Button
                            label="Passer au Budget"
                            icon="pi pi-wallet"
                            className="w-full mb-2 p-button-secondary p-button-sm"
                            onClick={() => handleSectionSwitch('budget')}
                        />
                    )}

                    {/* Toggle du thème */}
                    <div className="flex align-items-center justify-content-center mb-2">
                        <span className="mr-2">Thème :</span>
                        <ThemeToggle />
                    </div>

                    <Divider className="my-2" />

                    {/* Info utilisateur */}
                    <div className="text-center mb-2">
                        <div className="text-sm mb-2">
                            <i className="pi pi-user mr-2"></i>
                            <strong>{user?.email}</strong>
                        </div>
                        <Button
                            label="Profil"
                            icon="pi pi-user-edit"
                            className="w-full mb-2 p-button-outlined p-button-sm"
                            onClick={() => handleNavigation(section === 'budget' ? '/budget/profile' : '/trading/profile')}
                        />
                        <Button
                            label="Déconnexion"
                            icon="pi pi-sign-out"
                            className="w-full p-button-danger p-button-outlined p-button-sm"
                            onClick={logoutUser}
                        />
                    </div>
                </div>
            </div>
        </Sidebar>
    );
};

export default AppSidebar;
