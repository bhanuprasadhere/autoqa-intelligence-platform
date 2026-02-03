import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
    constructor(private prisma: PrismaService) { }

    async create(createProjectDto: CreateProjectDto) {
        // Ensure profile exists for this userId (hack for walking skeleton)
        // In real app, AuthGuard ensures user exists in Request
        const user = await this.prisma.profile.findUnique({
            where: { id: createProjectDto.userId },
        });

        if (!user) {
            // Create a dummy profile if not exists (for testing)
            await this.prisma.profile.create({
                data: {
                    id: createProjectDto.userId,
                    fullName: 'Test User',
                },
            });
        }

        return this.prisma.project.create({
            data: {
                name: createProjectDto.name,
                baseUrl: createProjectDto.baseUrl,
                userId: createProjectDto.userId,
            },
        });
    }

    async findAll() {
        return this.prisma.project.findMany({
            include: {
                _count: {
                    select: { scans: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}
