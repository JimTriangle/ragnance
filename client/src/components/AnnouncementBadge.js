import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { AuthContext } from '../context/AuthContext';

const AnnouncementBadge = ({ onClick }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const { isLoggedIn } = useContext(AuthContext);

    useEffect(() => {
        if (isLoggedIn) {
            fetchUnreadCount();
            // Rafraîchir toutes les 5 minutes
            const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [isLoggedIn]);

    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/announcements/unread');
            setUnreadCount(response.data.length);
        } catch (error) {
            console.error('Erreur récupération compteur annonces:', error);
        }
    };

    if (unreadCount === 0) {
        return null;
    }

    return (
        <Button
            icon="pi pi-bell"
            className="p-button-rounded p-button-text p-button-warning"
            onClick={onClick}
            tooltip="Nouvelles annonces"
            tooltipOptions={{ position: 'bottom' }}
        >
            <Badge value={unreadCount} severity="danger" />
        </Button>
    );
};

export default AnnouncementBadge;
