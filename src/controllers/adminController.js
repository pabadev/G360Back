import User from '../models/User.js'
import Business from '../models/Business.js'

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password')
    const payload = users.map((u) => (typeof u.toJSON === 'function' ? u.toJSON() : u))
    return res.json({ success: true, count: payload.length, users: payload })
  } catch (err) {
    return next(err)
  }
}

export const getAllBusinesses = async (req, res, next) => {
  try {
    const businesses = await Business.find().populate('owner', 'name email')
    const payload = businesses.map((b) => (typeof b.toJSON === 'function' ? b.toJSON() : b))
    return res.json({ success: true, count: payload.length, businesses: payload })
  } catch (err) {
    return next(err)
  }
}

export default { getAllUsers, getAllBusinesses }
