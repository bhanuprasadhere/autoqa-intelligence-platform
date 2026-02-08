
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const connection = new Redis(process.env.REDIS_URL!);
const scanQueue = new Queue('scan-jobs', { connection });

async function deleteProjectByUrl(urlPattern: string) {
    try {
        console.log(`Searching for projects matching: ${urlPattern}`);
        const projects = await prisma.project.findMany({
            where: {
                baseUrl: {
                    contains: urlPattern,
                },
            },
            include: {
                scans: true,
            },
        });

        if (projects.length === 0) {
            console.log('No matching projects found.');
            return;
        }

        for (const project of projects) {
            console.log(`Deleting project: ${project.name} (${project.id}) - URL: ${project.url}`);

            // 1. Clean up Queue Jobs
            console.log('Cleaning up queue jobs...');
            const jobs = await scanQueue.getJobs(['active', 'waiting', 'delayed', 'paused', 'failed', 'completed']);
            for (const job of jobs) {
                if (project.scans.some(s => s.id === job.data.scanId)) {
                    await job.remove();
                    console.log(`Removed job ${job.id}`);
                }
            }

            // 2. Delete Scans (Cascading delete should handle relations, but manual is safer)
            // Note: If you have foreign keys set to CASCADE, deleting project is enough. 
            // But let's be explicit to ensure "Stopping" logic.
            console.log('Deleting scans...');
            await prisma.scan.deleteMany({
                where: { projectId: project.id },
            });

            // 3. Delete Project
            await prisma.project.delete({
                where: { id: project.id },
            });

            console.log(`✅ Successfully deleted project: ${project.name}`);
        }

    } catch (error) {
        console.error('Error deleting project:', error);
    } finally {
        await prisma.$disconnect();
        await scanQueue.close();
        await connection.quit();
    }
}

// Run for 'github'
deleteProjectByUrl('github').then(() => process.exit(0));
