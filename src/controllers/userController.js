import User from '../models/User.js'
import Business from '../models/Business.js'
import jwt from 'jsonwebtoken'
import logger from '../utils/logger.js' // Logger centralizado

// Función para generar JWT de forma consistente
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  })
}

// Crear un nuevo usuario
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      logger.warn('Intento de creación de usuario con campos faltantes')
      return res.status(400).json({ success: false, message: 'Missing fields' })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      logger.warn(`Intento de registro con email duplicado: ${email}`)
      return res.status(409).json({ success: false, message: 'Email already in use' })
    }

    const user = await User.create({ name, email, password }) // password hashed by pre('save')
    const token = generateToken(user._id)

    logger.info(`Usuario creado exitosamente: ${email}`)
    return res.status(201).json({ success: true, user: user.toJSON(), token })
  } catch (err) {
    logger.error(`Error al crear usuario: ${err.message}`)
    return next(err)
  }
}

// Login de usuario (admin o user)
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      logger.warn('Intento de login con credenciales faltantes')
      return res.status(400).json({ success: false, message: 'Missing credentials' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      logger.warn(`Login fallido: usuario no encontrado (${email})`)
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      logger.warn(`Login fallido: contraseña inválida para ${email}`)
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const token = generateToken(user._id)
    logger.info(`Usuario autenticado correctamente: ${email}`)

    // Si es admin, devolver todos los usuarios
    if (user.role === 'admin') {
      const users = await User.find().select('-password')
      const payload = users.map((u) => (typeof u.toJSON === 'function' ? u.toJSON() : u))
      logger.info(`Admin ${email} obtuvo lista de usuarios`)
      return res.json({ success: true, user: user.toJSON(), token, users: payload })
    }

    // Si es user, devolver sus negocios
    const businesses = await Business.find({ owner: user._id }).populate('owner', 'name email')
    const bizPayload = businesses.map((b) => (typeof b.toJSON === 'function' ? b.toJSON() : b))
    logger.info(`Usuario ${email} obtuvo lista de negocios`)
    return res.json({ success: true, user: user.toJSON(), token, businesses: bizPayload })
  } catch (err) {
    logger.error(`Error en login de usuario: ${err.message}`)
    return next(err)
  }
}

// Listar usuarios (uso administrativo, ocultando passwords)
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password')
    logger.info('Lista de usuarios obtenida exitosamente')
    return res.json({ success: true, users })
  } catch (err) {
    logger.error(`Error al obtener usuarios: ${err.message}`)
    return next(err)
  }
}

// Obtener usuario por ID
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!id) {
      logger.warn('Solicitud de usuario sin ID')
      return res.status(400).json({ success: false, message: 'Missing user ID' })
    }

    const user = await User.findById(id).select('-password')
    if (!user) {
      logger.warn(`Usuario no encontrado con ID: ${id}`)
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    logger.info(`Usuario obtenido correctamente: ${id}`)
    return res.json({ success: true, user })
  } catch (err) {
    logger.error(`Error al obtener usuario por ID: ${err.message}`)
    return next(err)
  }
}

// Actualizar un usuario
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, email, password } = req.body

    if (!id) {
      logger.warn('Intento de actualización de usuario sin ID')
      return res.status(400).json({ success: false, message: 'Missing user ID' })
    }

    const user = await User.findById(id).select('-password')
    if (!user) {
      logger.warn(`Usuario no encontrado para actualización: ${id}`)
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Actualizar solo campos proporcionados
    if (name) user.name = name
    if (email) {
      const existing = await User.findOne({ email })
      if (existing && existing._id.toString() !== id) {
        logger.warn(`Email duplicado en actualización: ${email}`)
        return res.status(409).json({ success: false, message: 'Email already in use' })
      }
      user.email = email
    }
    if (password) user.password = password // password hashed by pre('save')

    await user.save()
    logger.info(`Usuario actualizado correctamente: ${id}`)

    return res.json({ success: true, user: user.toJSON() })
  } catch (err) {
    logger.error(`Error al actualizar usuario: ${err.message}`)
    return next(err)
  }
}

// Eliminar un usuario
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!id) {
      logger.warn('Intento de eliminación de usuario sin ID')
      return res.status(400).json({ success: false, message: 'Missing user ID' })
    }

    const user = await User.findById(id)
    if (!user) {
      logger.warn(`Usuario no encontrado para eliminación: ${id}`)
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    await user.remove()
    logger.info(`Usuario eliminado correctamente: ${id}`)

    return res.json({ success: true, message: 'User deleted' })
  } catch (err) {
    logger.error(`Error al eliminar usuario: ${err.message}`)
    return next(err)
  }
}

// Devolver solo el usuario autenticado
export const getCurrentUser = async (req, res, next) => {
  try {
    if (!req.user) {
      logger.warn('Intento de acceso a /me sin autenticación')
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    // req.user ya viene sin password si el middleware auth usa .select('-password')
    logger.info(`Usuario actual devuelto: ${req.user._id}`)
    return res.json({ success: true, user: req.user })
  } catch (err) {
    logger.error(`Error al obtener usuario autenticado: ${err.message}`)
    return next(err)
  }
}

// Export agrupado para mantener consistencia
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
