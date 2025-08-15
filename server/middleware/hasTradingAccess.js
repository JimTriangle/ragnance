module.exports = (req, res, next) => {
  if (!req.user?.tradingAccess) {
    return res.status(403).json({ message: 'Accès trading refusé.' });
  }
  next();
};