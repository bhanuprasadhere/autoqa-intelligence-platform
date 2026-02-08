import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectsModule } from './projects/projects.module';
import { ScansModule } from './scans/scans.module';
import { QueueModule } from './queue/queue.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ProjectsModule,
    ScansModule,
    QueueModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
