// src/services/auth/strategies/siigoStrategy.js

/**
 * Placeholder para Siigo (OAuth2).
 * Cuando lo implementemos:
 *  - Pediremos access_token con clientId/clientSecret (o credenciales que uses).
 *  - Guardaremos accessToken, refreshToken, expiresAt en credentials.
 *  - Implementaremos refresh cuando expiresAt esté cerca.
 */
const siigoStrategy = {
  id: 'Siigo',

  async authenticate(params = {}) {
    // Por ahora, lanzamos un error explícito si alguien intenta usarla.
    throw new Error('Siigo auth strategy not implemented yet')
  },

  buildAuthHeaders(credentials = {}) {
    // Cuando se implemente, retornará { Authorization: `Bearer ${credentials.accessToken}`, ... }
    return {}
  }
}

export default siigoStrategy
