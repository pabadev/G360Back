// src/services/auth/strategies/alegraStrategy.js

/**
 * Estrategia Alegra:
 * - Normalmente usa Basic Auth con "email:token" (API Key del usuario en Alegra).
 * - Aquí NO llamamos a un endpoint de "login" porque la API Key ya es la credencial.
 * - Validación opcional: podrías hacer un ping a un endpoint lightweight para comprobarla.
 */
const alegraStrategy = {
  id: 'Alegra',

  /**
   * params esperados:
   * - email: string
   * - apiKey: string  (token generado en Alegra)
   */
  async authenticate(params = {}) {
    const { email, apiKey } = params
    if (!email || !apiKey) {
      throw new Error('Alegra auth requires { email, apiKey }')
    }

    // En Alegra la "credencial" es estática (no expira como OAuth),
    // así que simplemente la guardamos.
    const credentials = { email, apiKey }

    // meta opcional por si quieres devolver algo al frontend.
    const meta = { provider: 'Alegra', type: 'Basic', validated: false }

    // Si quisieras validarla aquí, podrías intentar un fetch a un endpoint:
    // try { await fetch(...); meta.validated = true } catch { throw new Error('Invalid Alegra credentials') }

    return { credentials, meta }
  },

  /**
   * Construye headers para consumir la API de Alegra.
   * La mayoría de los endpoints aceptan Basic con base64(email:token).
   */
  buildAuthHeaders(credentials = {}) {
    const { email, apiKey } = credentials
    const basic = Buffer.from(`${email}:${apiKey}`).toString('base64')
    return {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  }
}

export default alegraStrategy
