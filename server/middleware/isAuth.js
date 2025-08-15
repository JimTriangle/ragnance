const jwt = require('jsonwebtoken');

// Le middleware est une fonction qui s'exécute avant d'arriver à la route finale
module.exports = (req, res, next) => {
  try {
    // On cherche le token dans les en-têtes (headers) de la requête
    const authHeader = req.get('Authorization');
    if (!authHeader) {
      throw new Error('Non authentifié.');
    }

    // Le header est de la forme "Bearer TOKEN_STRING"
    const token = authHeader.split(' ')[1];

    // On vérifie que le token est valide avec notre clé secrète
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Si le token est invalide, une erreur sera levée
    if (!decodedToken) {
      throw new Error('Non authentifié.');
    }

    // Si tout est bon, on ajoute les infos de l'utilisateur à la requête
    // pour pouvoir les utiliser dans nos routes
    req.user = {
      id: decodedToken.id,
      email: decodedToken.email,
      role: decodedToken.role,
      budgetAccess: decodedToken.budgetAccess,
      tradingAccess: decodedToken.tradingAccess
    };

    // On passe à la suite (la route demandée)
    next();
  } catch (err) {
    // En cas d'erreur (token manquant, invalide...), on bloque la requête
    console.error('Auth error:', err.message);
    return res.status(401).json({ message: 'Accès refusé. Token invalide ou manquant.' });
  }
};