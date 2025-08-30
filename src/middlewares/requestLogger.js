import morgan from 'morgan'
import logger from '../utils/logger.js'

/**
 * Middleware para registrar peticiones HTTP usando morgan -> winston.
 * - Usa un stream que manda los mensajes a logger.info
 * - Se omite en entorno de test
 */

const stream = {
  write: (message) => logger.info(message.trim())
}

const skip = () => process.env.NODE_ENV === 'test'

const requestLogger = morgan(':method :url :status :res[content-length] - :response-time ms', { stream, skip })

export default requestLogger
