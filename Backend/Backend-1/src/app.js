import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { env } from './config/env.js';

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = env.CLIENT_URL
  ? env.CLIENT_URL.split(',').map((o) => o.trim())
  : [];
const devOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];
const allAllowed = [...new Set([...allowedOrigins, ...devOrigins])];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      
      const isAllowed = allAllowed.some((allowed) => {
        if (origin === allowed) return true;
        try {
          const originHost = new URL(origin).hostname;
          // Prepend temporary protocol if client_url has no protocol to ensure safe URL parsing
          const allowedWithProtocol = /^https?:\/\//i.test(allowed) ? allowed : `http://${allowed}`;
          const allowedHost = new URL(allowedWithProtocol).hostname;
          return originHost === allowedHost;
        } catch {
          return false;
        }
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Api-Key'],
  })
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── HTTP Logging (Morgan) ────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'RecruitAI Backend-1',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
