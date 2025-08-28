import Business from '../models/Business.js'

// Crear un negocio
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
    return res.status(201).json({ success: true, business: businessWithOwner.toJSON() })
  } catch (err) {
    return next(err)
  }
}

// Listar negocios de un usuario
export const getUserBusinesses = async (req, res, next) => {
  try {
    const ownerId = req.user && (req.user.id || req.user._id)
    if (!ownerId) return res.status(401).json({ success: false, message: 'Unauthorized' })

    const businesses = await Business.find({ owner: ownerId }).populate('owner', 'name email')
    return res.json({ success: true, count: businesses.length, businesses })
  } catch (err) {
    return next(err)
  }
}

// Obtener un negocio por ID
export const getBusinessById = async (req, res, next) => {
  try {
    const { id } = req.params
    const business = await Business.findById(id).populate('owner', 'name email')
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' })
    return res.json({ success: true, business })
  } catch (err) {
    return next(err)
  }
}

// Actualizar un negocio (solo dueño)
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
    return res.json({ success: true, business: updated })
  } catch (err) {
    return next(err)
  }
}

// Eliminar un negocio
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
    return res.json({ success: true, business: deleted, message: 'Business deleted' })
  } catch (err) {
    return next(err)
  }
}

// Agregar o actualizar conexión a API (ej. Alegra o Siigo)
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

    // Busca si ya existe conexión para esa fuente
    const existing = business.sourceConnections.find((c) => c.source === source)
    if (existing) {
      existing.credentials = credentials
      existing.isActive = true
      existing.lastSync = null
    } else {
      business.sourceConnections.push({ source, credentials })
    }

    await business.save()
    return res.json({ success: true, business })
  } catch (err) {
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
