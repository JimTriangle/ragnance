import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const DesktopSidebar = ({ navItems = [], section = 'budget' }) => {
    const { user, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const initials = user?.email
        ? user.email.substring(0, 2)
        : '??';

    return (
        <aside className="desktop-sidebar">
            {/* Brand */}
            <div className="sidebar-brand">
                <div className="sidebar-brand__icon">
                    <i className={`pi ${section === 'budget' ? 'pi-wallet' : 'pi-chart-line'}`}></i>
                </div>
                <h3 className="sidebar-brand__title">
                    {section === 'budget' ? 'Budget' : 'Trading'}
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
                        >
                            {item.icon && <i className={item.icon}></i>}
                            {item.label}
                        </NavLink>
                    );
                })}
            </nav>

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
                        className="btn-modern btn-modern--outlined btn-modern--sm"
                        onClick={() => navigate(section === 'budget' ? '/budget/profile' : '/trading/profile')}
                    />
                    <Button
                        label="Déconnexion"
                        icon="pi pi-sign-out"
                        className="btn-modern btn-modern--outlined btn-modern--danger btn-modern--sm"
                        onClick={logoutUser}
                    />
                </div>
            </div>
        </aside>
    );
};

export default DesktopSidebar;
