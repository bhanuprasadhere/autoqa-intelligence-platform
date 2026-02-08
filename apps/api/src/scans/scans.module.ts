import { Module } from '@nestjs/common';
import { ScansController } from './scans.controller';
import { LogController } from './log.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ScansService } from './scans.service';

@Module({
    controllers: [ScansController, LogController],
    providers: [ScansService],
})
export class ScansModule { }
