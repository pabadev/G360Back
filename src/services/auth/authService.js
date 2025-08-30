import Business from '../../models/Business.js'
import alegraStrategy from './strategies/alegraStrategy.js'
import siigoStrategy from './strategies/siigoStrategy.js'
import logger from '../../utils/logger.js'

/**
 * Estrategias disponibles por proveedor.
 * Agrega aquí nuevas integraciones en el futuro (QuickBooks, SAP, etc).
 */
const strategies = {
  alegra: alegraStrategy,
  siigo: siigoStrategy // (placeholder por ahora)
}

/**
 * Obtiene una estrategia por "source" o lanza error si no existe.
 *
 * @param {string} source - Identificador de la integración externa (ej: "alegra").
 * @throws {Error} Si no existe la estrategia correspondiente.
 */
function getStrategyOrThrow(source) {
  const strat = strategies[source?.toLowerCase()]
  if (!strat) {
    logger.error(`Estrategia no encontrada para source "${source}"`)
    throw new Error(`No strategy found for source "${source}"`)
  }
  return strat
}

/**
 * Crea o actualiza la conexión de un negocio a una fuente externa.
 * Se guarda en Business.sourceConnections (token/clave/expiración/etc).
 *
 * @param {object} params
 * @param {string} params.businessId - ID del negocio
 * @param {string} params.source - Fuente externa (ej: "alegra", "siigo")
 * @param {object} params.credentials - Credenciales de autenticación
 * @param {boolean} [params.isActive=true] - Estado de la conexión
 * @param {Date|null} [params.lastSync=null] - Última fecha de sincronización
 */
export async function upsertConnection({ businessId, source, credentials, isActive = true, lastSync = null }) {
  const business = await Business.findById(businessId)
  if (!business) {
    logger.error(`No se encontró el negocio ${businessId} para establecer conexión con ${source}`)
    throw new Error('Business not found')
  }

  const idx = business.sourceConnections.findIndex((c) => c.source.toLowerCase() === source.toLowerCase())

  if (idx >= 0) {
    // Actualiza conexión existente
    business.sourceConnections[idx].credentials = credentials
    business.sourceConnections[idx].isActive = isActive
    business.sourceConnections[idx].lastSync = lastSync

    logger.info(`Conexión actualizada: negocio=${businessId}, source=${source}`)
  } else {
    // Crea una nueva conexión
    business.sourceConnections.push({
      source,
      credentials,
      isActive,
      lastSync
    })

    logger.info(`Nueva conexión creada: negocio=${businessId}, source=${source}`)
  }

  await business.save()

  // Por seguridad no devolvemos las credenciales crudas
  const safe = business.toJSON()
  safe.sourceConnections = safe.sourceConnections.map((sc) => ({
    source: sc.source,
    isActive: sc.isActive,
    lastSync: sc.lastSync
  }))

  return safe
}

/**
 * Flujo genérico de autenticación:
 * - Valida/obtiene credenciales a través de la estrategia (alegra/siigo/...)
 * - Guarda las credenciales en el Business correspondiente.
 *
 * @param {object} params
 * @param {string} params.source - Fuente de integración (ej: "alegra").
 * @param {string} params.businessId - ID del negocio
 * @param {object} params - Parámetros requeridos por la estrategia (ej: email, apiKey)
 */
export async function authenticate({ source, businessId, params }) {
  const strategy = getStrategyOrThrow(source)

  logger.info(`Iniciando autenticación con ${source} para negocio ${businessId}`)

  const { credentials, meta } = await strategy.authenticate(params)
  const business = await upsertConnection({ businessId, source: strategy.id, credentials })

  logger.info(`Autenticación exitosa con ${source} para negocio ${businessId}`)

  return { business, meta }
}

/**
 * Obtiene la conexión activa de un negocio para una fuente dada (p.ej. Alegra).
 * Útil para que los servicios de sincronización usen el token/clave correcto.
 *
 * @param {object} params
 * @param {string} params.businessId - ID del negocio
 * @param {string} params.source - Fuente externa (ej: "alegra", "siigo")
 * @throws {Error} Si el negocio no existe o no hay conexión activa.
 */
export async function getActiveConnection({ businessId, source }) {
  const business = await Business.findById(businessId)
  if (!business) {
    logger.error(`Negocio ${businessId} no encontrado al solicitar conexión activa con ${source}`)
    throw new Error('Business not found')
  }

  const conn = business.sourceConnections.find((c) => c.source.toLowerCase() === source.toLowerCase() && c.isActive)

  if (!conn) {
    logger.warn(`No hay conexión activa para source "${source}" en negocio ${businessId}`)
    throw new Error(`No active connection for source "${source}" on this business`)
  }

  logger.info(`Conexión activa encontrada para ${source} en negocio ${businessId}`)

  return { business, connection: conn }
}

export default {
  authenticate,
  upsertConnection,
  getActiveConnection
}
