import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectsModule } from './projects/projects.module';
import { PrismaService } from './prisma/prisma.service';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [ProjectsModule, QueueModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
