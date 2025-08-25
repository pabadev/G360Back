import Business from '../models/business.js'

export const createBusiness = async (req, res, next) => {
  try {
    console.log('createBusiness.body:', req.body)
    console.log('createBusiness.user:', req.user && (req.user.id || req.user._id))

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

    const business = await Business.create({ name: name.trim(), description, owner: ownerId })

    // Re-consulta y popula owner para asegurar que venga como objeto con name/email (no sólo id)
    const businessWithOwner = await Business.findById(business._id).populate('owner', 'name email')
    return res.status(201).json({ success: true, business: businessWithOwner.toJSON() })
  } catch (err) {
    return next(err)
  }
}

export const getUserBusinesses = async (req, res, next) => {
  try {
    const ownerId = req.user && (req.user.id || req.user._id)
    if (!ownerId) return res.status(401).json({ success: false, message: 'Unauthorized' })

    const businesses = await Business.find({ owner: ownerId }).populate('owner', 'name email')
    const payload = businesses.map((b) => (typeof b.toJSON === 'function' ? b.toJSON() : b))
    return res.json({ success: true, count: payload.length, businesses: payload })
  } catch (err) {
    return next(err)
  }
}

export const getBusinessById = async (req, res, next) => {
  try {
    const { id } = req.params
    const business = await Business.findById(id).populate('owner', 'name email')
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' })
    return res.json({ success: true, business: business.toJSON() })
  } catch (err) {
    return next(err)
  }
}

export const updateBusiness = async (req, res, next) => {
  try {
    const { id } = req.params
    const updates = req.body
    const business = await Business.findById(id)
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' })

    // ownership check (works whether owner is ObjectId or string)
    const ownerId = req.user && (req.user.id || req.user._id)
    if (!business.owner.equals(ownerId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    Object.assign(business, updates)
    await business.save()

    const updated = await Business.findById(business._id).populate('owner', 'name email')
    return res.json({ success: true, business: updated.toJSON() })
  } catch (err) {
    return next(err)
  }
}

export const deleteBusiness = async (req, res, next) => {
  try {
    const { id } = req.params
    const business = await Business.findById(id)
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' })

    const ownerId = req.user && (req.user.id || req.user._id)
    if (!business.owner.equals(ownerId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    // eliminar y devolver objeto poblado
    const deleted = await Business.findByIdAndDelete(id).populate('owner', 'name email')
    return res.json({ success: true, business: deleted ? deleted.toJSON() : null, message: 'Business deleted' })
  } catch (err) {
    return next(err)
  }
}

export default {
  createBusiness,
  getUserBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness
}
