// Clean up stuck scans in database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupStuckScans() {
    console.log('Cleaning up stuck scans...');

    // Mark stuck "running" scans as completed
    const runningResult = await prisma.scan.updateMany({
        where: {
            status: 'running',
            startedAt: {
                lt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
            },
        },
        data: {
            status: 'completed',
            completedAt: new Date(),
        },
    });
    console.log(`✅ Marked ${runningResult.count} stuck 'running' scans as completed`);

    // Mark stuck "queued" scans as failed
    const queuedResult = await prisma.scan.updateMany({
        where: {
            status: 'queued',
            createdAt: {
                lt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
            },
        },
        data: {
            status: 'failed',
            completedAt: new Date(),
        },
    });
    console.log(`✅ Marked ${queuedResult.count} stuck 'queued' scans as failed`);

    await prisma.$disconnect();
}

cleanupStuckScans().catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
});
