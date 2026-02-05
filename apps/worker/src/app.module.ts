import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrawlerModule } from './crawler/crawler.module';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: process.env.REDIS_URL
        ? {
          host: new URL(process.env.REDIS_URL).hostname,
          port: parseInt(new URL(process.env.REDIS_URL).port),
          password: new URL(process.env.REDIS_URL).password,
          tls: process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
        }
        : {
          host: 'localhost',
          port: 6379,
        },
    }),
    CrawlerModule,
    PrismaModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
