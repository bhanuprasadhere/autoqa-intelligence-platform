import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CrawlerService } from './crawler.service';
import { CrawlerProcessor } from './crawler.processor';
import { AiModule } from '../ai/ai.module';

import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'scan-jobs',
        }),
        AiModule,
        PrismaModule,
        StorageModule,
    ],
    providers: [CrawlerService, CrawlerProcessor],
    exports: [CrawlerService],
})
export class CrawlerModule { }
