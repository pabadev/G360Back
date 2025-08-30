// src/services/auth/strategies/siigoStrategy.js
import axios from 'axios'

/**
 * Estrategia Siigo (OAuth-like con token de acceso de corta duración).
 * - Autentica contra el endpoint de Siigo y guarda accessToken + expiración.
 * - Permite construir headers Bearer para consumir APIs.
 */
const SIIGO_AUTH_URL = process.env.SIIGO_AUTH_URL || 'https://private-anon-9e989f2776-siigoapi.apiary-mock.com/auth'
const SIIGO_PARTNER_ID = process.env.SIIGO_PARTNER_ID || 'Gestion360'

const siigoStrategy = {
  id: 'Siigo',

  /**
   * params esperados:
   * - username: string
   * - accessKey: string
   *
   * Si no se envían por params, intenta leerlos de variables de entorno:
   *   SIIGO_USERNAME y SIIGO_ACCESS_KEY
   */
  async authenticate(params = {}) {
    const username = params.username || process.env.SIIGO_USERNAME
    const access_key = params.accessKey || process.env.SIIGO_ACCESS_KEY

    if (!username || !access_key) {
      throw new Error('Siigo auth requires { username, accessKey } or env { SIIGO_USERNAME, SIIGO_ACCESS_KEY }')
    }

    const response = await axios.post(
      SIIGO_AUTH_URL,
      { username, access_key },
      {
        headers: {
          'Content-Type': 'application/json',
          'Partner-Id': SIIGO_PARTNER_ID
        }
      }
    )

    const data = response.data || {}
    const accessToken = data.access_token
    const expiresIn = data.expires_in // en segundos

    if (!accessToken) {
      throw new Error('Siigo auth response missing access_token')
    }

    const now = Math.floor(Date.now() / 1000)
    const expiresAt = expiresIn ? now + Number(expiresIn) : now + 3600 // fallback 1h

    return {
      credentials: {
        accessToken,
        expiresAt
      },
      meta: {
        provider: 'Siigo',
        receivedAt: new Date().toISOString()
      }
    }
  },

  /**
   * Construye headers Bearer con el accessToken.
   * (En el futuro aquí podrías refrescar el token si está por expirar.)
   */
  buildAuthHeaders(credentials = {}) {
    const { accessToken } = credentials
    if (!accessToken) return {}
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  }
}

export default siigoStrategy
