// @ts-nocheck
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CrawlerService } from './crawler.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

export interface ScanJobData {
    projectId: string;
    baseUrl: string;
    projectName: string;
    scanId: string; // Ensure scanId is passed
}

@Processor('scan-jobs')
export class CrawlerProcessor extends WorkerHost {
    constructor(
        private readonly crawlerService: CrawlerService,
        private readonly aiService: AiService,
        private readonly prismaService: PrismaService,
        private readonly storageService: StorageService,
    ) {
        super();
    }

    async process(job: Job<ScanJobData>): Promise<any> {
        const { projectId, scanId, baseUrl, projectName } = job.data;
        console.log(
            `[Worker] Processing job ${job.id} for project: ${projectName} (Scan: ${scanId})`,
        );

        try {
            // Update scan status to running
            if (scanId) {
                await this.prismaService.scan.update({
                    where: { id: scanId },
                    data: { status: 'running', startedAt: new Date() },
                }).catch(err => console.error('Failed to update start status', err));
            }

            // Step 1: Crawl
            const result = await this.crawlerService.crawl(baseUrl);
            console.log(`[Worker] Crawl complete for ${baseUrl}`);

            // Step 2: Upload Screenshot
            let screenshotUrl = '';
            if (result.screenshot) {
                const filename = `${projectId}/${scanId}/${Date.now()}.png`;
                try {
                    screenshotUrl = await this.storageService.uploadScreenshot(
                        filename,
                        result.screenshot,
                    );
                    console.log(`[Worker] Screenshot uploaded: ${screenshotUrl}`);
                } catch (e) {
                    console.error('[Worker] Screenshot upload failed', e);
                }
            }

            // Step 3: AI Analysis
            console.log(`[Worker] Running AI analysis...`);
            const aiAnalysis = await this.aiService.analyzePageScreenshot(
                result.screenshot,
                baseUrl,
                result.title,
            );

            // Step 4: Save Results to DB
            if (scanId) {
                try {
                    // Create ScanLog
                    await this.prismaService.scanLog.create({
                        data: {
                            scanId,
                            logLevel: 'info',
                            message: `AI Analysis Result: ${JSON.stringify(aiAnalysis)}`,
                            urlPath: '/',
                            screenshotUrl,
                            // aiAnalysis: aiAnalysis as any, (REMOVED)
                        },
                    });

                    // Update Scan completion
                    await this.prismaService.scan.update({
                        where: { id: scanId },
                        data: {
                            status: 'completed',
                            completedAt: new Date(),
                            totalPagesScanned: 1,
                            totalBugsFound: aiAnalysis.suggestedTests.length || 0,
                        },
                    });
                    console.log(`[Worker] DB updated for scan ${scanId}`);
                } catch (dbError) {
                    console.error('[Worker] DB Save failed (Schema mismatch?), continuing...', dbError.message);
                }
            }

            return {
                success: true,
                title: result.title,
                screenshotUrl,
                aiAnalysis,
            };
        } catch (error) {
            console.error(`[Worker] Job ${job.id} failed:`, error);

            if (scanId) {
                await this.prismaService.scan.update({
                    where: { id: scanId },
                    data: { status: 'failed', completedAt: new Date() },
                }).catch(err => console.error('Failed to update failed status', err));

                await this.prismaService.scanLog.create({
                    data: {
                        scanId,
                        logLevel: 'error',
                        message: error.message || 'Scan failed',
                        urlPath: '/',
                    }
                }).catch(e => console.error('Failed to save error log', e));
            }

            throw error;
        }
    }
}
