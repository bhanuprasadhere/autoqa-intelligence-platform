import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
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
        console.log('[API] Creating project:', createProjectDto);

        try {
            // Check if project with same URL exists for user
            const existingProject = await this.prisma.project.findFirst({
                where: {
                    userId: createProjectDto.userId,
                    baseUrl: createProjectDto.baseUrl,
                },
            });

            if (existingProject) {
                console.log('[API] Returning existing project:', existingProject.id);
                // Return existing project with a flag indicating it already existed
                return {
                    ...existingProject,
                    _isExisting: true,
                    message: 'A project with this URL already exists for your account'
                };
            }

            // Validate URL
            const urlValidation = this.validateUrl(createProjectDto.baseUrl);
            if (!urlValidation.valid) {
                console.error('[API] URL validation failed:', urlValidation.error);
                throw new BadRequestException(urlValidation.error);
            }

            // Verify user exists before creating project
            const userExists = await this.prisma.profile.findUnique({
                where: { id: createProjectDto.userId },
            });

            if (!userExists) {
                console.error('[API] User not found:', createProjectDto.userId);
                throw new BadRequestException(
                    `User with ID ${createProjectDto.userId} does not exist. Please ensure the user profile is created first.`
                );
            }

            // Create project
            const project = await this.prisma.project.create({
                data: {
                    name: createProjectDto.name,
                    baseUrl: createProjectDto.baseUrl,
                    userId: createProjectDto.userId,
                },
            });

            console.log('[API] Project created successfully:', project.id);

            // Create initial scan
            const scan = await this.prisma.scan.create({
                data: {
                    projectId: project.id,
                    status: 'queued',
                },
            });

            console.log('[API] Initial scan created:', scan.id);

            // Add scan job to queue
            await this.scanQueue.add('scan-page', {
                scanId: scan.id,
                projectId: project.id,
                url: createProjectDto.baseUrl,
            });

            console.log('[API] Scan job added to queue');

            return { ...project, scanId: scan.id };
        } catch (error) {
            console.error('[API] Error creating project:', error);

            // Handle Prisma-specific errors
            if (error.code === 'P2003') {
                throw new BadRequestException(
                    'Invalid user ID. The specified user does not exist in the database.'
                );
            }

            // Re-throw BadRequestException as-is
            if (error instanceof BadRequestException) {
                throw error;
            }

            // Wrap other errors
            throw new InternalServerErrorException(
                `Failed to create project: ${error.message}`
            );
        }
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

    async findOne(id: string) {
        return this.prisma.project.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { scans: true },
                },
            },
        });
    }

    async findScans(projectId: string) {
        return this.prisma.scan.findMany({
            where: { projectId },
            orderBy: { startedAt: 'desc' },
        });
    }

    async createScan(projectId: string) {
        console.log('[API] Creating new scan for project:', projectId);

        // Verify project exists
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            throw new BadRequestException('Project not found');
        }

        // Create new scan
        const scan = await this.prisma.scan.create({
            data: {
                projectId,
                status: 'queued',
            },
        });

        console.log('[API] New scan created:', scan.id);

        // Add scan job to queue
        await this.scanQueue.add('scan-page', {
            scanId: scan.id,
            projectId,
            url: project.baseUrl,
        });

        console.log('[API] Scan job added to queue');

        return scan;
    }

    async stopScan(scanId: string) {
        console.log(`[API] Request to stop scan: ${scanId}`);

        try {
            const scan = await this.prisma.scan.findUnique({
                where: { id: scanId },
            });

            if (!scan) {
                console.warn(`[API] Scan not found for stop request: ${scanId}`);
                throw new NotFoundException(`Scan with ID ${scanId} not found`);
            }

            if (scan.status !== 'running' && scan.status !== 'queued') {
                console.log(`[API] Scan ${scanId} is already ${scan.status}. No action needed.`);
                return {
                    message: `Scan is already ${scan.status}`,
                    scan,
                    removedJobs: 0,
                };
            }

            // Update status immediately
            const updatedScan = await this.prisma.scan.update({
                where: { id: scanId },
                data: {
                    status: 'stopped',
                    completedAt: new Date(),
                },
            });

            // Remove jobs from queue
            const jobs = await this.scanQueue.getJobs(['waiting', 'delayed', 'active', 'paused']);
            let removedCount = 0;

            for (const job of jobs) {
                if (job.data.scanId === scanId) {
                    try {
                        await job.remove();
                        removedCount++;
                    } catch (e) {
                        console.warn(`[API] Failed to remove job ${job.id}: ${e.message}`);
                    }
                }
            }

            console.log(`[API] Scan ${scanId} stopped. Removed ${removedCount} jobs.`);

            return {
                message: 'Scan stopped successfully',
                scan: updatedScan,
                removedJobs: removedCount,
            };
        } catch (error) {
            console.error(`[API] Error stopping scan ${scanId}:`, error);
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException(`Failed to stop scan: ${error.message}`);
        }
    }

    async getLogs(scanId: string) {
        console.log(`[ProjectsService] getLogs called for scanId: ${scanId}`);
        try {
            const logs = await this.prisma.scanLog.findMany({
                where: { scanId },
                orderBy: { createdAt: 'asc' },
            });
            console.log(`[ProjectsService] Found ${logs.length} logs`);
            return logs;
        } catch (error) {
            console.error('[ProjectsService] Error fetching logs:', error);
            console.error(error.stack);
            throw error; // Re-throw to let controller handle it (or return 500)
        }
    }

    // URL Validation Helper
    private validateUrl(url: string): { valid: boolean; error?: string } {
        try {
            const parsed = new URL(url);

            // Only allow HTTP/HTTPS
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return { valid: false, error: 'Only HTTP and HTTPS protocols are supported' };
            }

            // Block localhost/127.0.0.1
            if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname.endsWith('.local')) {
                return { valid: false, error: 'Cannot scan localhost or local network URLs' };
            }

            // Block private IP ranges
            const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
            if (ipPattern.test(parsed.hostname)) {
                const parts = parsed.hostname.split('.').map(Number);
                // 10.x.x.x, 172.16-31.x.x, 192.168.x.x
                if (parts[0] === 10) return { valid: false, error: 'Cannot scan private IP addresses' };
                if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return { valid: false, error: 'Cannot scan private IP addresses' };
                if (parts[0] === 192 && parts[1] === 168) return { valid: false, error: 'Cannot scan private IP addresses' };
            }

            return { valid: true };
        } catch (e) {
            return { valid: false, error: 'Invalid URL format' };
        }
    }

    async delete(id: string) {
        console.log(`[API] Deleting project: ${id}`);
        try {
            // Prisma will cascade delete scans, site_map, and scan_logs automatically
            const project = await this.prisma.project.delete({
                where: { id },
            });
            console.log(`[API] Project deleted successfully: ${id}`);
            return { message: 'Project deleted successfully', project };
        } catch (error) {
            console.error(`[API] Error deleting project ${id}:`, error);
            throw new InternalServerErrorException(`Failed to delete project: ${error.message}`);
        }
    }
}
