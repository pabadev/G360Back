import logger from './utils/logger.js'
import app from './app.js'
import dotenv from 'dotenv'
import connectDB from './config/db.js'

dotenv.config()
const PORT = process.env.PORT || 3000

const startServer = async () => {
  try {
    await connectDB()
    logger.info('MongoDB connected')
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`)
    })
  } catch (err) {
    logger.error('Startup error:', err)
    process.exit(1)
  }
}

startServer()
