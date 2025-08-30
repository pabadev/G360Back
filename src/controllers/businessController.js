import Business from '../models/Business.js'
import logger from '../utils/logger.js'

/**
 * Crear un negocio asociado al usuario autenticado.
 */
export const createBusiness = async (req, res, next) => {
  try {
    const { name, description } = req.body || {}
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Missing fields',
        missing: ['name']
      })
    }

    const ownerId = req.user && (req.user.id || req.user._id)
    if (!ownerId) return res.status(401).json({ success: false, message: 'Unauthorized' })

    const business = await Business.create({
      name: name.trim(),
      description,
      owner: ownerId
    })

    const businessWithOwner = await Business.findById(business._id).populate('owner', 'name email')

    logger.info(`Negocio creado con ID ${business._id} por usuario ${ownerId}`)

    return res.status(201).json({ success: true, business: businessWithOwner.toJSON() })
  } catch (err) {
    logger.error(`Error al crear negocio: ${err.message}`)
    return next(err)
  }
}

/**
 * Listar negocios pertenecientes al usuario autenticado.
 */
export const getUserBusinesses = async (req, res, next) => {
  try {
    const ownerId = req.user && (req.user.id || req.user._id)
    if (!ownerId) return res.status(401).json({ success: false, message: 'Unauthorized' })

    const businesses = await Business.find({ owner: ownerId }).populate('owner', 'name email')

    logger.info(`Usuario ${ownerId} consultó sus ${businesses.length} negocios`)

    return res.json({
      success: true,
      count: businesses.length,
      businesses
    })
  } catch (err) {
    logger.error(`Error al obtener negocios de usuario: ${err.message}`)
    return next(err)
  }
}

/**
 * Obtener un negocio por su ID.
 */
export const getBusinessById = async (req, res, next) => {
  try {
    const { id } = req.params
    const business = await Business.findById(id).populate('owner', 'name email')
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' })

    logger.info(`Negocio consultado con ID ${id}`)

    return res.json({ success: true, business })
  } catch (err) {
    logger.error(`Error al obtener negocio por ID: ${err.message}`)
    return next(err)
  }
}

/**
 * Actualizar un negocio existente.
 * Solo el dueño puede realizar esta acción.
 */
export const updateBusiness = async (req, res, next) => {
  try {
    const { id } = req.params
    const updates = req.body
    const business = await Business.findById(id)
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' })

    const ownerId = req.user && (req.user.id || req.user._id)
    if (!business.owner.equals(ownerId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    Object.assign(business, updates)
    await business.save()

    const updated = await Business.findById(business._id).populate('owner', 'name email')

    logger.info(`Negocio ${id} actualizado por usuario ${ownerId}`)

    return res.json({ success: true, business: updated })
  } catch (err) {
    logger.error(`Error al actualizar negocio: ${err.message}`)
    return next(err)
  }
}

/**
 * Eliminar un negocio.
 * Solo el dueño puede eliminarlo.
 */
export const deleteBusiness = async (req, res, next) => {
  try {
    const { id } = req.params
    const business = await Business.findById(id)
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' })

    const ownerId = req.user && (req.user.id || req.user._id)
    if (!business.owner.equals(ownerId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const deleted = await Business.findByIdAndDelete(id).populate('owner', 'name email')

    logger.info(`Negocio ${id} eliminado por usuario ${ownerId}`)

    return res.json({
      success: true,
      business: deleted,
      message: 'Business deleted'
    })
  } catch (err) {
    logger.error(`Error al eliminar negocio: ${err.message}`)
    return next(err)
  }
}

/**
 * Agregar o actualizar una conexión a una API externa (ej. Alegra o Siigo).
 */
export const addOrUpdateConnection = async (req, res, next) => {
  try {
    const { id } = req.params
    const { source, credentials } = req.body
    const ownerId = req.user && (req.user.id || req.user._id)

    const business = await Business.findById(id)
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' })
    if (!business.owner.equals(ownerId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    // Verificar si ya existe conexión para esa fuente
    const existing = business.sourceConnections.find((c) => c.source === source)
    if (existing) {
      existing.credentials = credentials
      existing.isActive = true
      existing.lastSync = null
      logger.info(`Conexión actualizada para fuente ${source} en negocio ${id}`)
    } else {
      business.sourceConnections.push({ source, credentials })
      logger.info(`Conexión agregada para fuente ${source} en negocio ${id}`)
    }

    await business.save()

    return res.json({ success: true, business })
  } catch (err) {
    logger.error(`Error al agregar/actualizar conexión: ${err.message}`)
    return next(err)
  }
}

export default {
  createBusiness,
  getUserBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
  addOrUpdateConnection
}
