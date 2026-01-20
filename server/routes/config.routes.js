const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const isAdmin = require('../middleware/isAdmin');
const ConfigEmail = require('../models/ConfigEmail.model');
const transporter = require('../utils/email');

// GET /api/config/emails - Récupérer tous les emails de configuration (public)
router.get('/emails', async (req, res) => {
    try {
        const emails = await ConfigEmail.findAll();
        const emailsObj = {};
        emails.forEach(e => {
            emailsObj[e.key] = e.email;
        });
        res.status(200).json(emailsObj);
    } catch (error) {
        console.error('Erreur lors de la récupération des emails:', error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// PUT /api/config/emails - Mettre à jour les emails de configuration (admin)
router.put('/emails', [isAuth, isAdmin], async (req, res) => {
    const { contact, privacy } = req.body;
    try {
        if (contact) {
            await ConfigEmail.upsert({ key: 'contact', email: contact });
        }
        if (privacy) {
            await ConfigEmail.upsert({ key: 'privacy', email: privacy });
        }
        res.status(200).json({ message: 'Emails de configuration mis à jour' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour des emails:', error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// POST /api/config/contact - Envoyer un email de contact
router.post('/contact', isAuth, async (req, res) => {
    const { subject, message } = req.body;
    const userEmail = req.user.email;

    if (!subject || !message) {
        return res.status(400).json({ message: 'Sujet et message requis.' });
    }

    try {
        // Récupérer l'email de destination
        const contactConfig = await ConfigEmail.findOne({ where: { key: 'contact' } });
        const destinationEmail = contactConfig ? contactConfig.email : 'contact@ragnance.com';

        // Envoyer l'email
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: destinationEmail,
            subject: `[Contact] ${subject}`,
            text: `Message de: ${userEmail}\n\n${message}`,
            replyTo: userEmail
        });

        res.status(200).json({ message: 'Message envoyé avec succès' });
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        res.status(500).json({ message: "Erreur lors de l'envoi du message" });
    }
});

module.exports = router;
