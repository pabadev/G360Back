// src/controllers/integrationController.js
import { authenticate as authExternal, getActiveConnection } from '../services/auth/authService.js'
import alegraService from '../services/integrations/alegraService.js'
import Business from '../models/Business.js'

/**
 * Asegura que el usuario autenticado es dueño del business.
 */
async function assertOwnershipOrThrow(businessId, userId) {
  const business = await Business.findById(businessId)
  if (!business) throw Object.assign(new Error('Business not found'), { status: 404 })
  if (!business.owner.equals(userId)) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
  return business
}

/**
 * POST /integrations/:source/auth
 * Body esperado:
 * - businessId
 * - params: { email, apiKey } para Alegra (por ahora)
 *
 * Flujo:
 * - Verifica propietario
 * - Llama a authService.authenticate(source, { businessId, params })
 * - Guarda/actualiza conexión en Business.sourceConnections
 */
export async function authIntegration(req, res, next) {
  try {
    const { source } = req.params
    const { businessId, params } = req.body || {}

    const ownerId = req.user && (req.user.id || req.user._id)
    if (!ownerId) return res.status(401).json({ success: false, message: 'Unauthorized' })

    await assertOwnershipOrThrow(businessId, ownerId)

    const { business, meta } = await authExternal({ source, businessId, params })
    return res.json({ success: true, source, business, meta })
  } catch (err) {
    return next(err)
  }
}

/**
 * POST /integrations/:source/invoices/sync
 * Body opcional: { businessId, query }
 * - query: parámetros de paginado/fecha que soporte la API
 */
export async function syncInvoices(req, res, next) {
  try {
    const { source } = req.params
    const { businessId, query } = req.body || {}

    const ownerId = req.user && (req.user.id || req.user._id)
    if (!ownerId) return res.status(401).json({ success: false, message: 'Unauthorized' })

    await assertOwnershipOrThrow(businessId, ownerId)

    let result
    switch (source.toLowerCase()) {
      case 'alegra':
        result = await alegraService.syncAlegraInvoices({ businessId, query })
        break
      case 'siigo':
        result = await siigoService.syncSiigoInvoices({ businessId, query })
        break
      // case 'siigo':  (cuando se implemente)
      //   result = await siigoService.syncSiigoInvoices({ businessId, query })
      //   break
      default:
        return res.status(400).json({ success: false, message: `Unknown source "${source}"` })
    }

    return res.json({ success: true, source, ...result })
  } catch (err) {
    return next(err)
  }
}

/**
 * GET /integrations/:source/connection?businessId=...
 * Útil para verificar si la conexión está activa (no expone credenciales).
 */
export async function getConnectionInfo(req, res, next) {
  try {
    const { source } = req.params
    const { businessId } = req.query

    const ownerId = req.user && (req.user.id || req.user._id)
    if (!ownerId) return res.status(401).json({ success: false, message: 'Unauthorized' })

    await assertOwnershipOrThrow(businessId, ownerId)

    const { connection } = await getActiveConnection({ businessId, source })
    return res.json({
      success: true,
      source,
      connection: {
        source: connection.source,
        isActive: connection.isActive,
        lastSync: connection.lastSync || null
      }
    })
  } catch (err) {
    return next(err)
  }
}

export default {
  authIntegration,
  syncInvoices,
  getConnectionInfo
}
