// Ce middleware doit s'exécuter APRES le middleware 'isAuth'
// car il a besoin de req.user pour fonctionner.

module.exports = (req, res, next) => {
    // On vérifie le rôle de l'utilisateur qui a été attaché par 'isAuth'
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Accès refusé. Droits d'administrateur requis." });
    }
    // Si l'utilisateur est un admin, on continue
    next();
};