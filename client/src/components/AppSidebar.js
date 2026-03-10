import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const AppSidebar = ({
    visible,
    onHide,
    navItems = [],
    additionalActions = null
}) => {
    const { user, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleNavigation = (path) => {
        navigate(path);
        onHide();
    };


    const initials = user?.email
        ? user.email.substring(0, 2)
        : '??';

    return (
        <Sidebar
            visible={visible}
            onHide={onHide}
            position="left"
            className="app-sidebar"
            style={{ width: '300px' }}
        >
            <div className="sidebar-mobile-content">
                {/* Close button */}
                <div className="sidebar-mobile-close">
                    <Button
                        icon="pi pi-times"
                        className="p-button-text p-button-rounded p-button-sm"
                        onClick={onHide}
                        aria-label="Fermer le menu"
                    />
                </div>

                {/* Brand */}
                <div className="sidebar-brand">
                    <div className="sidebar-brand__icon">
                        <i className="pi pi-wallet"></i>
                    </div>
                    <h3 className="sidebar-brand__title">
                        Budget
                    </h3>
                </div>

                <hr className="sidebar-divider" />

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {navItems.map((item, index) => {
                        if (item.section && item.items) {
                            return (
                                <div key={index} className="sidebar-nav__section">
                                    <div className="sidebar-nav__section-title">{item.section}</div>
                                    {item.items.map((subItem, subIndex) => (
                                        <NavLink
                                            key={`${index}-${subIndex}`}
                                            to={subItem.to}
                                            end={subItem.end}
                                            className={({ isActive }) =>
                                                `sidebar-nav__item ${isActive ? 'active' : ''} ${subItem.danger ? 'sidebar-nav__item--danger' : ''}`
                                            }
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleNavigation(subItem.to);
                                            }}
                                        >
                                            {subItem.icon && <i className={subItem.icon}></i>}
                                            {subItem.label}
                                        </NavLink>
                                    ))}
                                </div>
                            );
                        }

                        return (
                            <NavLink
                                key={index}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `sidebar-nav__item ${isActive ? 'active' : ''} ${item.danger ? 'sidebar-nav__item--danger' : ''}`
                                }
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleNavigation(item.to);
                                }}
                            >
                                {item.icon && <i className={item.icon}></i>}
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>

                <hr className="sidebar-divider" />

                {/* Additional actions */}
                {additionalActions && (
                    <>
                        <div className="sidebar-extra-actions">
                            {additionalActions}
                        </div>
                        <hr className="sidebar-divider" />
                    </>
                )}

                {/* Footer */}
                <div className="sidebar-footer-section">
                    <div className="sidebar-theme-row">
                        <span className="sidebar-theme-row__label">Thème</span>
                        <ThemeToggle />
                    </div>

                    <div className="sidebar-user">
                        <div className="sidebar-user__avatar">{initials}</div>
                        <div className="sidebar-user__info">
                            <div className="sidebar-user__email">{user?.email}</div>
                        </div>
                    </div>

                    <div className="sidebar-footer__actions">
                        <Button
                            label="Profil"
                            icon="pi pi-user-edit"
                            className="p-button-outlined p-button-sm"
                            onClick={() => handleNavigation('/budget/profile')}
                        />
                        <Button
                            label="Déconnexion"
                            icon="pi pi-sign-out"
                            className="p-button-danger p-button-outlined p-button-sm"
                            onClick={logoutUser}
                        />
                    </div>
                </div>
            </div>
        </Sidebar>
    );
};

export default AppSidebar;
