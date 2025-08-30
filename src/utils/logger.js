import winston from 'winston'
import fs from 'fs'
import path from 'path'
import DailyRotateFile from 'winston-daily-rotate-file'

/**
 * Logger centralizado usando Winston.
 *
 * - Crea la carpeta `logs/` si no existe.
 * - Consola (en desarrollo) con formato coloreado y legible.
 * - Archivos rotativos diarios:
 *    - `error-%DATE%.log` → solo errores.
 *    - `combined-%DATE%.log` → todos los niveles.
 * - Formato JSON con timestamp y stack traces en errores.
 * - Nivel configurable por variable de entorno LOG_LEVEL.
 */

const logsDir = path.resolve(process.cwd(), 'logs')

// Asegurar que exista la carpeta de logs
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Formato base: timestamp + stack + JSON
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }), // captura stack en errores
  winston.format.splat(),
  winston.format.json()
)

// Transports base
const transports = []

// En desarrollo → consola coloreada
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          return stack ? `${timestamp} [${level}]: ${stack}` : `${timestamp} [${level}]: ${message}`
        })
      )
    })
  )
}

// En producción → archivos rotativos
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  }),
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  })
)

// Crear el logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
})

export default logger
