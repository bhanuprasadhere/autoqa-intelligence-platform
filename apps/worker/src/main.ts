import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('[Worker] Starting worker service...');
  console.log('[Worker] Environment:', {
    REDIS_URL: process.env.REDIS_URL ? 'SET' : 'MISSING',
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'MISSING',
    MAX_CRAWL_DEPTH: process.env.MAX_CRAWL_DEPTH || '3',
    MAX_PAGES_PER_SCAN: process.env.MAX_PAGES_PER_SCAN || '50',
  });

  const app = await NestFactory.create(AppModule);

  // Health check endpoint
  const server = app.getHttpAdapter();
  server.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  await app.listen(process.env.PORT ?? 4001);
  console.log('[Worker] ✅ Running on port 4001');
  console.log('[Worker] ✅ Health check: http://localhost:4001/health');
}

bootstrap().catch((error) => {
  console.error('[Worker] ❌ Failed to start:', error);
  process.exit(1);
});
