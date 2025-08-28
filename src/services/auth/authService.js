// src/services/auth/authService.js
import Business from '../../models/Business.js'
import alegraStrategy from './strategies/alegraStrategy.js'
import siigoStrategy from './strategies/siigoStrategy.js'

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
 */
function getStrategyOrThrow(source) {
  const strat = strategies[source?.toLowerCase()]
  if (!strat) throw new Error(`No strategy found for source "${source}"`)
  return strat
}

/**
 * Crea o actualiza la conexión de un negocio a una fuente externa.
 * Se guarda en Business.sourceConnections (token/clave/expiración/etc).
 */
export async function upsertConnection({ businessId, source, credentials, isActive = true, lastSync = null }) {
  const business = await Business.findById(businessId)
  if (!business) throw new Error('Business not found')

  const idx = business.sourceConnections.findIndex((c) => c.source.toLowerCase() === source.toLowerCase())

  if (idx >= 0) {
    // Actualiza conexión existente
    business.sourceConnections[idx].credentials = credentials
    business.sourceConnections[idx].isActive = isActive
    business.sourceConnections[idx].lastSync = lastSync
  } else {
    // Crea una nueva conexión
    business.sourceConnections.push({
      source,
      credentials,
      isActive,
      lastSync
    })
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
 */
export async function authenticate({ source, businessId, params }) {
  const strategy = getStrategyOrThrow(source)
  const { credentials, meta } = await strategy.authenticate(params)
  const business = await upsertConnection({ businessId, source: strategy.id, credentials })
  return { business, meta }
}

/**
 * Obtiene la conexión activa de un negocio para una fuente dada (p.ej. Alegra).
 * Útil para que los servicios de sincronización usen el token/clave correcto.
 */
export async function getActiveConnection({ businessId, source }) {
  const business = await Business.findById(businessId)
  if (!business) throw new Error('Business not found')

  const conn = business.sourceConnections.find((c) => c.source.toLowerCase() === source.toLowerCase() && c.isActive)
  if (!conn) throw new Error(`No active connection for source "${source}" on this business`)

  return { business, connection: conn }
}

export default {
  authenticate,
  upsertConnection,
  getActiveConnection
}
