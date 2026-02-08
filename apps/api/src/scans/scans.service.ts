import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScansService {
    constructor(private prisma: PrismaService) { }

    async findOne(id: string) {
        return this.prisma.scan.findUnique({
            where: { id },
        });
    }

    async getLogs(scanId: string) {
        return this.prisma.scanLog.findMany({
            where: { scanId },
            orderBy: { createdAt: 'asc' },
        });
    }
}
