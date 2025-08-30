import { authenticate as authExternal, getActiveConnection } from '../services/auth/authService.js'
import alegraService from '../services/integrations/alegraService.js'
import Business from '../models/Business.js'
import logger from '../utils/logger.js'

/**
 * Verifica que el usuario autenticado sea dueño del negocio.
 *
 * @param {string} businessId - ID del negocio a validar
 * @param {string} userId - ID del usuario autenticado
 * @throws {Error} si el negocio no existe o el usuario no es dueño
 * @returns {Business} El documento de negocio validado
 */
async function assertOwnershipOrThrow(businessId, userId) {
  const business = await Business.findById(businessId)
  if (!business) {
    logger.warn(`Intento de acceso a negocio inexistente: ${businessId}`)
    throw Object.assign(new Error('Business not found'), { status: 404 })
  }
  if (!business.owner.equals(userId)) {
    logger.warn(`Acceso denegado: usuario ${userId} no es dueño del negocio ${businessId}`)
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
  return business
}

/**
 * Autenticación con una integración externa (ej: Alegra).
 *
 * Endpoint: POST /integrations/:source/auth
 *
 * Body esperado:
 * - businessId
 * - params: { email, apiKey } (depende de la integración)
 *
 * Flujo:
 * - Verifica que el usuario sea dueño del negocio
 * - Llama a authService.authenticate para manejar credenciales
 * - Guarda/actualiza conexión en Business.sourceConnections
 */
export async function authIntegration(req, res, next) {
  try {
    const { source } = req.params
    const { businessId, params } = req.body || {}

    const ownerId = req.user && (req.user.id || req.user._id)
    if (!ownerId) {
      logger.warn(`Intento de autenticación sin usuario en source "${source}"`)
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    await assertOwnershipOrThrow(businessId, ownerId)

    const { business, meta } = await authExternal({ source, businessId, params })

    logger.info(`Integración "${source}" autenticada para negocio ${businessId} por usuario ${ownerId}`)

    return res.json({ success: true, source, business, meta })
  } catch (err) {
    logger.error(`Error en authIntegration (${req.params.source}): ${err.message}`)
    return next(err)
  }
}

/**
 * Sincroniza facturas desde una integración externa.
 *
 * Endpoint: POST /integrations/:source/invoices/sync
 *
 * Body opcional:
 * - businessId
 * - query: parámetros de paginado/fecha soportados por la API
 */
export async function syncInvoices(req, res, next) {
  try {
    const { source } = req.params
    const { businessId, query } = req.body || {}

    const ownerId = req.user && (req.user.id || req.user._id)
    if (!ownerId) {
      logger.warn(`Intento de sincronización sin usuario en source "${source}"`)
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    await assertOwnershipOrThrow(businessId, ownerId)

    let result
    switch (source.toLowerCase()) {
      case 'alegra':
        result = await alegraService.syncAlegraInvoices({ businessId, query })
        break
      case 'siigo':
        result = await siigoService.syncSiigoInvoices({ businessId, query })
        break
      default:
        logger.warn(`Fuente de integración desconocida: "${source}"`)
        return res.status(400).json({ success: false, message: `Unknown source "${source}"` })
    }

    logger.info(`Sincronización completada para "${source}" en negocio ${businessId}`)

    return res.json({ success: true, source, ...result })
  } catch (err) {
    logger.error(`Error en syncInvoices (${req.params.source}): ${err.message}`)
    return next(err)
  }
}

/**
 * Recupera información de la conexión activa a una integración externa.
 *
 * Endpoint: GET /integrations/:source/connection?businessId=...
 *
 * Útil para verificar si la conexión está activa sin exponer credenciales.
 */
export async function getConnectionInfo(req, res, next) {
  try {
    const { source } = req.params
    const { businessId } = req.query

    const ownerId = req.user && (req.user.id || req.user._id)
    if (!ownerId) {
      logger.warn(`Intento de consultar conexión sin usuario en source "${source}"`)
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    await assertOwnershipOrThrow(businessId, ownerId)

    const { connection } = await getActiveConnection({ businessId, source })

    logger.info(`Consulta de conexión para "${source}" en negocio ${businessId}`)

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
    logger.error(`Error en getConnectionInfo (${req.params.source}): ${err.message}`)
    return next(err)
  }
}

export default {
  authIntegration,
  syncInvoices,
  getConnectionInfo
}
