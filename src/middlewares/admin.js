const admin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' })
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden: admin only' })
  next()
}

export default admin
