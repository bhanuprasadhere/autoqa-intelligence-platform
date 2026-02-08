import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('logs')
export class LogController {
    constructor(private readonly prisma: PrismaService) { }

    @Get(':scanId')
    async getLogs(@Param('scanId') scanId: string) {
        try {
            return await this.prisma.scan.findMany({
                take: 1,
            });
        } catch (error) {
            console.error('Error fetching logs:', error);
            return { error: error.message };
        }
    }
}
