import logger from '../utils/logger.js'
import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    })
    // success logging handled by the caller (server.js)
  } catch (error) {
    logger.error('MongoDB connection failed: %s', error.message)
    throw error
  }
}

export default connectDB
