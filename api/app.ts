import express, { Express } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import { corsOptions, securityHeaders, requestLogger, requestId } from './middleware/security.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

import authRoutes from './routes/auth.js'
import familyTreeRoutes from './routes/familyTrees.js'
import relationshipRoutes from './routes/relationships.js'
import personRoutes from './routes/persons.js'

dotenv.config()

const app: Express = express()

app.set('trust proxy', 1)
app.use(requestId)
app.use(requestLogger)
app.use(securityHeaders)
app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/family-trees', familyTreeRoutes)
app.use('/api/relationships', relationshipRoutes)
app.use('/api/persons', personRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app

