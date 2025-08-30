import logger from '../utils/logger.js'

/**
 * Middleware global de manejo de errores.
 * - Reemplaza console.error por logger.error para centralizar logs.
 * - Devuelve stack only fuera de producción.
 */
const errorHandler = (err, req, res, next) => {
  // Loguear con stack (si existe)
  logger.error('Unhandled error: %o', { message: err.message, stack: err.stack })

  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred.',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  })
}

export default errorHandler
