import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { AuthContext } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';

const AnnouncementDialog = ({ visible, onHide }) => {
    const [announcements, setAnnouncements] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { isLoggedIn } = useContext(AuthContext);

    useEffect(() => {
        if (visible && isLoggedIn) {
            fetchUnreadAnnouncements();
        }
    }, [visible, isLoggedIn]);

    const fetchUnreadAnnouncements = async () => {
        try {
            const response = await api.get('/announcements/unread');
            setAnnouncements(response.data);
            setCurrentIndex(0);
        } catch (error) {
            console.error('Erreur chargement annonces:', error);
        }
    };

    const markAsRead = async (announcementId) => {
        try {
            await api.post(`/announcements/${announcementId}/read`);
        } catch (error) {
            console.error('Erreur marquage lecture:', error);
        }
    };

    const handleNext = () => {
        if (currentIndex < announcements.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = async () => {
        // Marquer l'annonce actuelle comme lue
        if (announcements[currentIndex]) {
            await markAsRead(announcements[currentIndex].id);
        }
        onHide();
    };

    const handleDismiss = async () => {
        // Marquer toutes les annonces comme lues
        for (const announcement of announcements) {
            await markAsRead(announcement.id);
        }
        onHide();
    };

    if (!announcements || announcements.length === 0) {
        return null;
    }

    const currentAnnouncement = announcements[currentIndex];

    const getIcon = (type) => {
        switch (type) {
            case 'feature': return 'pi-sparkles';
            case 'info': return 'pi-info-circle';
            case 'warning': return 'pi-exclamation-triangle';
            case 'update': return 'pi-sync';
            default: return 'pi-bell';
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'feature': return '#10B981';
            case 'info': return '#3B82F6';
            case 'warning': return '#F59E0B';
            case 'update': return '#8B5CF6';
            default: return '#6B7280';
        }
    };

    const header = (
        <div className="flex align-items-center gap-3">
            <i
                className={`pi ${getIcon(currentAnnouncement.type)}`}
                style={{ fontSize: '1.5rem', color: getColor(currentAnnouncement.type) }}
            ></i>
            <span className="text-xl font-bold">{currentAnnouncement.title}</span>
            {announcements.length > 1 && (
                <Badge value={`${currentIndex + 1}/${announcements.length}`} severity="info" />
            )}
        </div>
    );

    const footer = (
        <div className="flex justify-content-between align-items-center">
            <Button
                label="Ne plus afficher"
                className="p-button-text p-button-secondary"
                onClick={handleDismiss}
            />
            <Button
                label={currentIndex < announcements.length - 1 ? 'Suivant' : 'Compris'}
                icon={currentIndex < announcements.length - 1 ? 'pi pi-arrow-right' : 'pi pi-check'}
                iconPos="right"
                onClick={handleNext}
            />
        </div>
    );

    return (
        <Dialog
            visible={visible}
            onHide={handleClose}
            header={header}
            footer={footer}
            style={{ width: '90vw', maxWidth: '600px' }}
            modal
            closable={true}
        >
            <div className="announcement-content py-3">
                <ReactMarkdown>{currentAnnouncement.content}</ReactMarkdown>
            </div>

            <style jsx>{`
                .announcement-content {
                    line-height: 1.6;
                }
                .announcement-content h1 {
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                }
                .announcement-content h2 {
                    font-size: 1.25rem;
                    margin-bottom: 0.75rem;
                }
                .announcement-content p {
                    margin-bottom: 0.75rem;
                }
                .announcement-content ul, .announcement-content ol {
                    margin-left: 1.5rem;
                    margin-bottom: 0.75rem;
                }
                .announcement-content li {
                    margin-bottom: 0.25rem;
                }
                .announcement-content code {
                    background: rgba(0, 0, 0, 0.1);
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.25rem;
                    font-family: monospace;
                }
            `}</style>
        </Dialog>
    );
};

export default AnnouncementDialog;
