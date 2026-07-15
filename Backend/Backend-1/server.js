import 'dotenv/config';
import { env } from './src/config/env.js';
import app from './src/app.js';
import './src/workers/resume.worker.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║        HireFlowAI — Backend-1 Started! 🚀        ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`\n📡  Server    : http://localhost:${PORT}`);
  console.log(`📋  API Base  : http://localhost:${PORT}/api/v1`);
  console.log(`❤️   Health   : http://localhost:${PORT}/health`);
  console.log(`🌍  Env       : ${env.NODE_ENV}\n`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n[${signal}] Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ Server closed. All connections drained.');
    process.exit(0);
  });

  // Force exit after 10s if not closed
  setTimeout(() => {
    console.error('⚠️  Forcing shutdown after timeout.');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
// nodemon restart trigger
