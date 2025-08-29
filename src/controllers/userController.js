import User from '../models/User.js'
import Business from '../models/Business.js'
import jwt from 'jsonwebtoken'

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  })
}

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing fields' })
    }
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ success: false, message: 'Email already in use' })

    const user = await User.create({ name, email, password }) // password hashed by pre('save')
    const token = generateToken(user._id)
    return res.status(201).json({ success: true, user: user.toJSON(), token })
  } catch (err) {
    return next(err)
  }
}

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ success: false, message: 'Missing credentials' })

    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' })

    const isMatch = await user.comparePassword(password)
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' })

    const token = generateToken(user._id)

    // Si es admin, devolver todos los usuarios
    if (user.role === 'admin') {
      const users = await User.find().select('-password')
      const payload = users.map((u) => (typeof u.toJSON === 'function' ? u.toJSON() : u))
      return res.json({ success: true, user: user.toJSON(), token, users: payload })
    }

    // Si es user, devolver sus negocios
    const businesses = await Business.find({ owner: user._id }).populate('owner', 'name email')
    const bizPayload = businesses.map((b) => (typeof b.toJSON === 'function' ? b.toJSON() : b))
    return res.json({ success: true, user: user.toJSON(), token, businesses: bizPayload })
  } catch (err) {
    return next(err)
  }
}

// optional: keep existing user listing but hide passwords
export const getUsers = async (req, res, next) => {
  try {
    // Mantener para uso administrativo si se requiere, pero no exponerse en la ruta /users pública
    const users = await User.find().select('-password')
    return res.json({ success: true, users })
  } catch (err) {
    return next(err)
  }
}

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json({ success: false, message: 'Missing user ID' })

    const user = await User.findById(id).select('-password')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    return res.json({ success: true, user })
  } catch (err) {
    return next(err)
  }
}

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, email, password } = req.body

    if (!id) return res.status(400).json({ success: false, message: 'Missing user ID' })

    const user = await User.findById(id).select('-password')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    // Actualizar solo campos proporcionados
    if (name) user.name = name
    if (email) {
      const existing = await User.findOne({ email })
      if (existing && existing._id.toString() !== id) {
        return res.status(409).json({ success: false, message: 'Email already in use' })
      }
      user.email = email
    }
    if (password) user.password = password // password hashed by pre('save')

    await user.save()

    return res.json({ success: true, user: user.toJSON() })
  } catch (err) {
    return next(err)
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json({ success: false, message: 'Missing user ID' })

    const user = await User.findById(id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    await user.remove()

    return res.json({ success: true, message: 'User deleted' })
  } catch (err) {
    return next(err)
  }
}

// Nuevo: devolver solo el usuario autenticado
export const getCurrentUser = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' })
    // req.user ya viene sin password si el middleware auth usa .select('-password')
    return res.json({ success: true, user: req.user })
  } catch (err) {
    return next(err)
  }
}

const UserController = {
  createUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getCurrentUser
}

export default UserController
