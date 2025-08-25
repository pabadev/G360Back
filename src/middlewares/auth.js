import jwt from 'jsonwebtoken'
import User from '../models/user.js'

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    if (!user) return res.status(401).json({ success: false, message: 'Invalid token' })

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
}

export default auth
