import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import middleware
import { corsOptions, securityHeaders, requestLogger, requestId } from './middleware/security.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import familyTreeRoutes from './routes/familyTrees.js';
import relationshipRoutes from './routes/relationships.js';
import personRoutes from './routes/persons.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const server = createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Apply middleware
app.use(requestId);
app.use(requestLogger);
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/family-trees', familyTreeRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/persons', personRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('leave-room', (roomId: string) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Genealogy Platform API running on port ${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`🔄 Health check: http://localhost:${PORT}/health`);
});

export { io };
