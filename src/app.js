import express from 'express'
import bodyParser from 'body-parser'
import routes from './routes/index.js'
import errorHandler from './middlewares/errorHandler.js'
import requestLogger from './middlewares/requestLogger.js'

const app = express()

// Request logger (morgan -> winston)
app.use(requestLogger)

// Middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Routes
app.use('/api', routes)

// Error handling middleware
app.use(errorHandler)

export default app
