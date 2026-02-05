import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { SCAN_JOBS_QUEUE, ScanJobData } from '../queue/queue.constants';

@Injectable()
export class ProjectsService {
    constructor(
        private prisma: PrismaService,
        @InjectQueue(SCAN_JOBS_QUEUE) private scanQueue: Queue<ScanJobData>,
    ) { }

    async create(createProjectDto: CreateProjectDto) {
        // Ensure profile exists for this userId (hack for walking skeleton)
        const user = await this.prisma.profile.findUnique({
            where: { id: createProjectDto.userId },
        });

        if (!user) {
            await this.prisma.profile.create({
                data: {
                    id: createProjectDto.userId,
                    fullName: 'Test User',
                },
            });
        }

        // Create the project
        const project = await this.prisma.project.create({
            data: {
                name: createProjectDto.name,
                baseUrl: createProjectDto.baseUrl,
                userId: createProjectDto.userId,
            },
        });

        // Create a scan record
        const scan = await this.prisma.scan.create({
            data: {
                projectId: project.id,
                status: 'queued',
            },
        });

        // Add job to queue for worker to process
        await this.scanQueue.add('initial-scan', {
            projectId: project.id,
            scanId: scan.id, // Pass scanId to worker
            baseUrl: project.baseUrl,
            projectName: project.name,
        });

        console.log(`[Queue] Added scan job for project: ${project.name}`);

        return { ...project, scanId: scan.id };
    }

    async findAll() {
        return this.prisma.project.findMany({
            include: {
                _count: {
                    select: { scans: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
