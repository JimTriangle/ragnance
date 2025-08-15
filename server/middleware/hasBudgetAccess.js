module.exports = (req, res, next) => {
  if (!req.user?.budgetAccess) {
    return res.status(403).json({ message: 'Accès budget refusé.' });
  }
  next();
};