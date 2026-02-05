import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { SCAN_JOBS_QUEUE } from '../queue/queue.constants';

@Module({
  imports: [
    BullModule.registerQueue({
      name: SCAN_JOBS_QUEUE,
    }),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, PrismaService],
})
export class ProjectsModule { }
