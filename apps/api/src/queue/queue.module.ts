import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Module({
    imports: [
        BullModule.forRoot({
            connection: process.env.REDIS_URL
                ? {
                    // Parse rediss:// URL for Upstash
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
        BullModule.registerQueue({
            name: 'scan-jobs',
        }),
    ],
    exports: [BullModule],
})
export class QueueModule { }
