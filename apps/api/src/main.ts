import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('[API] Starting API service...');

  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors();

  // Health check endpoint
  const server = app.getHttpAdapter();
  server.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  await app.listen(process.env.PORT ?? 4000);
  console.log('[API] ✅ Running on port 4000');
  console.log('[API] ✅ Health check: http://localhost:4000/health');
}

bootstrap().catch((error) => {
  console.error('[API] ❌ Failed to start:', error);
  process.exit(1);
});
