import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const DesktopSidebar = ({ navItems = [], section = 'budget' }) => {
    const { user, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();

    return (
        <aside className="desktop-sidebar">
            <div className="flex align-items-center gap-2 px-2 mb-2">
                <i className={`pi ${section === 'budget' ? 'pi-wallet' : 'pi-chart-line'} text-primary`}></i>
                <h3 className="m-0 text-primary text-lg">
                    {section === 'budget' ? 'Budget' : 'Trading'}
                </h3>
            </div>

            <Divider className="my-2" />

            <nav className="flex-grow-1">
                {navItems.map((item, index) => {
                    if (item.section && item.items) {
                        return (
                            <div key={index}>
                                <div className="desktop-section-title">{item.section}</div>
                                {item.items.map((subItem, subIndex) => (
                                    <NavLink
                                        key={`${index}-${subIndex}`}
                                        to={subItem.to}
                                        end={subItem.end}
                                        className={({ isActive }) =>
                                            `desktop-nav-item ${isActive ? 'active' : ''} ${subItem.danger ? 'text-red-400' : ''}`
                                        }
                                    >
                                        {subItem.icon && <i className={`${subItem.icon} mr-2`} style={{ width: '1.25rem', textAlign: 'center' }}></i>}
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
                                `desktop-nav-item ${isActive ? 'active' : ''} ${item.danger ? 'text-red-400' : ''}`
                            }
                        >
                            {item.icon && <i className={`${item.icon} mr-2`} style={{ width: '1.25rem', textAlign: 'center' }}></i>}
                            {item.label}
                        </NavLink>
                    );
                })}
            </nav>

            <Divider className="my-2" />

            <div className="px-2">
                <div className="flex align-items-center justify-content-center mb-2">
                    <span className="mr-2 text-sm">Thème :</span>
                    <ThemeToggle />
                </div>
                <div className="text-center text-sm mb-2">
                    <i className="pi pi-user mr-1"></i>
                    <strong>{user?.email}</strong>
                </div>
                <Button
                    label="Profil"
                    icon="pi pi-user-edit"
                    className="w-full mb-1 p-button-outlined p-button-sm"
                    onClick={() => navigate(section === 'budget' ? '/budget/profile' : '/trading/profile')}
                />
                <Button
                    label="Déconnexion"
                    icon="pi pi-sign-out"
                    className="w-full p-button-danger p-button-outlined p-button-sm"
                    onClick={logoutUser}
                />
            </div>
        </aside>
    );
};

export default DesktopSidebar;
