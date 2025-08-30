import logger from '../../../utils/logger.js'

/**
 * Estrategia Alegra:
 * - Usa Basic Auth con la forma "email:apiKey" (token generado en Alegra).
 * - No requiere un endpoint de login, la API Key funciona como credencial permanente.
 * - Opcionalmente se puede validar haciendo un ping a un endpoint de Alegra.
 */
const alegraStrategy = {
  id: 'Alegra',

  /**
   * Autenticación básica para Alegra.
   * @param {Object} params
   * @param {string} params.email - Correo del usuario en Alegra.
   * @param {string} params.apiKey - Token generado en Alegra.
   * @returns {Object} credentials + meta info
   */
  async authenticate(params = {}) {
    const { email, apiKey } = params
    if (!email || !apiKey) {
      logger.warn('[AlegraStrategy] Credenciales faltantes en authenticate')
      throw new Error('Alegra auth requires { email, apiKey }')
    }

    // Credenciales estáticas (no expiran como OAuth).
    const credentials = { email, apiKey }

    // Información adicional para el frontend o debugging.
    const meta = { provider: 'Alegra', type: 'Basic', validated: false }

    // Si quieres validar de inmediato:
    // try { await fetch(...); meta.validated = true } catch (err) {
    //   logger.error('[AlegraStrategy] Credenciales inválidas', { error: err.message })
    //   throw new Error('Invalid Alegra credentials')
    // }

    logger.info('[AlegraStrategy] Autenticación configurada correctamente', { email })
    return { credentials, meta }
  },

  /**
   * Construye los headers necesarios para consumir la API de Alegra.
   * La mayoría de endpoints aceptan Basic Auth con base64(email:apiKey).
   * @param {Object} credentials
   * @param {string} credentials.email
   * @param {string} credentials.apiKey
   * @returns {Object} Headers HTTP
   */
  buildAuthHeaders(credentials = {}) {
    const { email, apiKey } = credentials
    if (!email || !apiKey) {
      logger.error('[AlegraStrategy] No se pudieron construir headers: credenciales faltantes')
      throw new Error('Missing Alegra credentials for headers')
    }

    const basic = Buffer.from(`${email}:${apiKey}`).toString('base64')
    logger.debug('[AlegraStrategy] Headers construidos correctamente', { email })
    return {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  }
}

export default alegraStrategy
