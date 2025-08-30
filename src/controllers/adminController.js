import User from '../models/User.js'
import Business from '../models/Business.js'
import logger from '../utils/logger.js'

/**
 * Obtiene todos los usuarios registrados en el sistema.
 * Excluye el campo 'password' por seguridad.
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password')

    // Convertimos cada documento a objeto JSON en caso de ser necesario
    const payload = users.map((u) => (typeof u.toJSON === 'function' ? u.toJSON() : u))

    // Log informativo de la acción
    logger.info(`Admin request: ${payload.length} usuarios obtenidos`)

    return res.json({ success: true, count: payload.length, users: payload })
  } catch (err) {
    // Log de error para facilitar depuración
    logger.error(`Error al obtener usuarios: ${err.message}`)
    return next(err)
  }
}

/**
 * Obtiene todos los negocios registrados en el sistema.
 * Incluye información básica del propietario (name, email).
 */
export const getAllBusinesses = async (req, res, next) => {
  try {
    const businesses = await Business.find().populate('owner', 'name email')

    // Convertimos cada documento a objeto JSON en caso de ser necesario
    const payload = businesses.map((b) => (typeof b.toJSON === 'function' ? b.toJSON() : b))

    // Log informativo de la acción
    logger.info(`Admin request: ${payload.length} negocios obtenidos`)

    return res.json({
      success: true,
      count: payload.length,
      businesses: payload
    })
  } catch (err) {
    // Log de error para facilitar depuración
    logger.error(`Error al obtener negocios: ${err.message}`)
    return next(err)
  }
}

export default { getAllUsers, getAllBusinesses }
