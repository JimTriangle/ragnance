const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const isAdmin = require('../middleware/isAdmin');
const Announcement = require('../models/Announcement.model');
const UserAnnouncement = require('../models/UserAnnouncement.model');
const { Op } = require('sequelize');

// GET /api/announcements/unread - Récupérer les annonces non lues
router.get('/unread', isAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Récupérer toutes les annonces actives et publiées
        const allAnnouncements = await Announcement.findAll({
            where: {
                active: true,
                publishedAt: { [Op.not]: null }
            },
            order: [['publishedAt', 'DESC']]
        });

        // Récupérer les IDs des annonces déjà lues
        const readAnnouncements = await UserAnnouncement.findAll({
            where: { UserId: userId },
            attributes: ['AnnouncementId']
        });

        const readIds = readAnnouncements.map(ua => ua.AnnouncementId);

        // Filtrer pour avoir seulement les non lues
        const unreadAnnouncements = allAnnouncements.filter(
            announcement => !readIds.includes(announcement.id)
        );

        res.status(200).json(unreadAnnouncements);
    } catch (error) {
        console.error('Erreur récupération annonces non lues:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// GET /api/announcements - Récupérer toutes les annonces (avec statut lu/non lu)
router.get('/', isAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const announcements = await Announcement.findAll({
            where: {
                active: true,
                publishedAt: { [Op.not]: null }
            },
            order: [['publishedAt', 'DESC']]
        });

        // Récupérer les annonces lues par l'utilisateur
        const readAnnouncements = await UserAnnouncement.findAll({
            where: { UserId: userId },
            attributes: ['AnnouncementId', 'readAt']
        });

        const readMap = {};
        readAnnouncements.forEach(ua => {
            readMap[ua.AnnouncementId] = ua.readAt;
        });

        // Ajouter l'information de lecture à chaque annonce
        const announcementsWithReadStatus = announcements.map(announcement => ({
            ...announcement.toJSON(),
            isRead: !!readMap[announcement.id],
            readAt: readMap[announcement.id] || null
        }));

        res.status(200).json(announcementsWithReadStatus);
    } catch (error) {
        console.error('Erreur récupération annonces:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// POST /api/announcements/:id/read - Marquer une annonce comme lue
router.post('/:id/read', isAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const announcementId = req.params.id;

        // Vérifier si l'annonce existe
        const announcement = await Announcement.findByPk(announcementId);
        if (!announcement) {
            return res.status(404).json({ message: 'Annonce non trouvée' });
        }

        // Vérifier si déjà marquée comme lue
        const existing = await UserAnnouncement.findOne({
            where: { UserId: userId, AnnouncementId: announcementId }
        });

        if (existing) {
            return res.status(200).json({ message: 'Déjà marquée comme lue' });
        }

        // Créer l'enregistrement
        await UserAnnouncement.create({
            UserId: userId,
            AnnouncementId: announcementId
        });

        res.status(200).json({ message: 'Annonce marquée comme lue' });
    } catch (error) {
        console.error('Erreur marquage annonce lue:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// ADMIN ROUTES

// GET /api/announcements/admin/all - Récupérer toutes les annonces (admin)
router.get('/admin/all', isAuth, isAdmin, async (req, res) => {
    try {
        const announcements = await Announcement.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(announcements);
    } catch (error) {
        console.error('Erreur récupération annonces admin:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// POST /api/announcements/admin - Créer une annonce (admin)
router.post('/admin', isAuth, isAdmin, async (req, res) => {
    try {
        const { title, content, type, publishNow } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Titre et contenu requis' });
        }

        const announcement = await Announcement.create({
            title,
            content,
            type: type || 'feature',
            publishedAt: publishNow ? new Date() : null,
            active: true
        });

        res.status(201).json(announcement);
    } catch (error) {
        console.error('Erreur création annonce:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// PUT /api/announcements/admin/:id - Modifier une annonce (admin)
router.put('/admin/:id', isAuth, isAdmin, async (req, res) => {
    try {
        const announcement = await Announcement.findByPk(req.params.id);
        if (!announcement) {
            return res.status(404).json({ message: 'Annonce non trouvée' });
        }

        await announcement.update(req.body);
        res.status(200).json(announcement);
    } catch (error) {
        console.error('Erreur modification annonce:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// DELETE /api/announcements/admin/:id - Supprimer une annonce (admin)
router.delete('/admin/:id', isAuth, isAdmin, async (req, res) => {
    try {
        const announcement = await Announcement.findByPk(req.params.id);
        if (!announcement) {
            return res.status(404).json({ message: 'Annonce non trouvée' });
        }

        await announcement.destroy();
        res.status(200).json({ message: 'Annonce supprimée' });
    } catch (error) {
        console.error('Erreur suppression annonce:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;
