import app from './app.js'
import dotenv from 'dotenv'
import connectDB from './config/db.js'

dotenv.config()
const PORT = process.env.PORT || 3000

const startServer = async () => {
  try {
    await connectDB()
    console.log('MongoDB connected')
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  } catch (err) {
    console.error('Startup error:', err)
    process.exit(1)
  }
}

startServer()
