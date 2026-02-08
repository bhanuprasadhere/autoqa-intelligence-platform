// @ts-nocheck
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { CrawlerService } from './crawler.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { LinkExtractorService } from './link-extractor.service';
import { VisitedUrlsService } from './visited-urls.service';
import sharp from 'sharp';

export interface ScanJobData {
    projectId: string;
    baseUrl: string;
    projectName: string;
    scanId: string;
    url?: string; // Specific URL to scan (for multi-page)
    depth?: number; // Crawl depth
    parentUrl?: string; // Parent URL that linked to this page
}

@Processor('scan-jobs')
export class CrawlerProcessor extends WorkerHost {
    constructor(
        private readonly crawlerService: CrawlerService,
        private readonly aiService: AiService,
        private readonly prismaService: PrismaService,
        private readonly storageService: StorageService,
        private readonly linkExtractor: LinkExtractorService,
        private readonly visitedUrls: VisitedUrlsService,
        @InjectQueue('scan-jobs') private scanQueue: Queue,
    ) {
        super();
    }

    async process(job: Job<ScanJobData>): Promise<any> {
        const { projectId, scanId, baseUrl, projectName, url, depth = 0, parentUrl } = job.data;
        const targetUrl = url || baseUrl;

        console.log(`\n[Worker] ========== JOB START ==========`);
        console.log(`[Worker] Job ID: ${job.id}`);
        console.log(`[Worker] Scan ID: ${scanId}`);
        console.log(`[Worker] Project: ${projectName}`);
        console.log(`[Worker] Target URL: ${targetUrl}`);
        console.log(`[Worker] Depth: ${depth}`);
        console.log(`[Worker] Parent URL: ${parentUrl || 'N/A'}`);
        console.log(`[Worker] ====================================\n`);

        // Validate URL format
        try {
            const parsed = new URL(targetUrl);
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                throw new Error('Only HTTP/HTTPS URLs are supported');
            }
        } catch (urlError) {
            console.error(`[Worker] Invalid URL: ${targetUrl}`, urlError.message);
            await this.markScanFailed(scanId, `Invalid URL: ${urlError.message}`);
            return { success: false, error: 'invalid_url' };
        }

        // Check crawl limits
        const maxDepth = parseInt(process.env.MAX_CRAWL_DEPTH || '3');
        const maxPages = parseInt(process.env.MAX_PAGES_PER_SCAN || '50');

        if (depth > maxDepth) {
            console.log(`[Worker] Max depth ${maxDepth} reached, skipping ${targetUrl}`);
            return { success: true, skipped: true, reason: 'max_depth' };
        }

        // Check if already visited
        try {
            const isVisited = await this.visitedUrls.isVisited(scanId, targetUrl);
            if (isVisited) {
                console.log(`[Worker] URL already visited: ${targetUrl}`);
                return { success: true, skipped: true, reason: 'already_visited' };
            }
            await this.visitedUrls.markVisited(scanId, targetUrl);
        } catch (redisError) {
            console.error('[Worker] Redis error, continuing anyway', redisError.message);
        }

        try {
            // Update scan status to running
            if (scanId) {
                await this.prismaService.scan.update({
                    where: { id: scanId },
                    data: { status: 'running', startedAt: new Date() },
                }).catch(err => console.error('Failed to update start status', err));
            }

            // Step 1: Crawl the page with timeout (30 seconds)
            const result = await this.withTimeout(
                this.crawlerService.crawl(targetUrl),
                30000,
                `Page load timeout for ${targetUrl}`
            );
            console.log(`[Worker] Crawl complete for ${targetUrl}`);

            // Step 1.5: Extract links for multi-page crawling
            let discoveredLinks: string[] = [];
            try {
                if (scanId) {
                    await this.prismaService.scanLog.create({
                        data: {
                            scanId,
                            logLevel: 'info',
                            message: 'Extracting internal links for crawling...',
                            urlPath: new URL(targetUrl).pathname,
                        },
                    });
                }

                discoveredLinks = await this.linkExtractor.extractInternalLinks(
                    result.page,
                    job.data.baseUrl || targetUrl  // Use baseUrl from job data
                );
                console.log(`[Worker] Found ${discoveredLinks.length} internal links`);
            } catch (linkError) {
                console.error('[Worker] Link extraction failed, continuing with 0 links', linkError.message);
            }

            // Close the page after extraction
            try {
                await result.page.close();
            } catch (closeError) {
                console.error('[Worker] Failed to close page', closeError.message);
            }

            // Step 2: Convert PNG to WebP and upload
            let screenshotUrl = '';
            if (result.screenshot) {
                try {
                    // Convert to WebP (80% smaller)
                    const webpBuffer = await sharp(result.screenshot)
                        .webp({ quality: 80 })
                        .toBuffer();

                    const filename = `${projectId}/${scanId}/${Date.now()}.webp`;
                    screenshotUrl = await this.storageService.uploadScreenshot(
                        filename,
                        webpBuffer,
                    );
                    console.log(`[Worker] Screenshot uploaded (WebP): ${screenshotUrl}`);

                    // Log screenshot captured
                    if (scanId) {
                        await this.prismaService.scanLog.create({
                            data: {
                                scanId,
                                logLevel: 'info',
                                message: 'Screenshot captured and uploaded',
                                urlPath: new URL(targetUrl).pathname,
                            },
                        });
                    }
                } catch (e) {
                    console.error('[Worker] Screenshot upload failed', e);
                }
            }

            // Step 3: AI Analysis with fallback
            console.log(`[Worker]            // Step 3: AI Analysis (simulated for now)`);
            let aiAnalysis = null;
            try {
                if (scanId) {
                    await this.prismaService.scanLog.create({
                        data: {
                            scanId,
                            logLevel: 'info',
                            message: 'Starting AI analysis of page structure...',
                            urlPath: new URL(targetUrl).pathname,
                        },
                    });
                }

                console.log(`[Worker] Starting AI analysis for ${targetUrl}`);
                aiAnalysis = await this.withTimeout(
                    this.aiService.analyzePage(
                        result.html,
                        result.screenshot_base64
                    ),
                    120000, // 2 minutes timeout (increased from 60s)
                    'AI analysis timeout'
                );
                console.log(`[Worker] AI analysis complete for ${targetUrl}: ${aiAnalysis.suggestedTests?.length || 0} tests found`);
            } catch (aiError) {
                console.error(`[Worker] AI analysis failed for ${targetUrl}:`, aiError.message);
                aiAnalysis = {
                    pageType: 'unknown',
                    formsFound: 0,
                    suggestedTests: [
                        {
                            title: 'AI Analysis Unavailable',
                            description: `AI service error: ${aiError.message}. Manual review recommended.`,
                            priority: 'low',
                            testSteps: ['Manual verification required due to AI service failure'],
                        },
                    ],
                };
            }

            // Step 4: Save Results to DB
            if (scanId) {
                try {
                    // Create ScanLog
                    await this.prismaService.scanLog.create({
                        data: {
                            scanId,
                            logLevel: 'info',
                            message: `Scanned ${targetUrl} successfully`,
                            urlPath: new URL(targetUrl).pathname,
                            screenshotUrl,
                            aiAnalysis: aiAnalysis as any,
                        },
                    });

                    // Update SiteMap entry
                    await this.prismaService.siteMap.create({
                        data: {
                            scanId,
                            url: targetUrl,
                            parentUrl,
                            depth,
                            status: 'scanned',
                            pageTitle: result.title,
                        },
                    });

                    // Increment scan page count
                    await this.prismaService.scan.update({
                        where: { id: scanId },
                        data: {
                            totalPagesScanned: { increment: 1 },
                            totalBugsFound: { increment: aiAnalysis.suggestedTests?.length || 0 },
                        },
                    });
                    console.log(`[Worker] DB updated for scan ${scanId}`);
                } catch (dbError) {
                    console.error('[Worker] DB Save failed', dbError.message);
                }
            }

            // Step 5: Queue discovered links (if not at max depth/pages)
            const currentPageCount = await this.prismaService.siteMap.count({
                where: { scanId },
            });

            if (currentPageCount < maxPages && depth < maxDepth && discoveredLinks.length > 0) {
                for (const link of discoveredLinks) {
                    // Add to queue
                    await this.scanQueue.add('initial-scan', {
                        projectId,
                        scanId,
                        baseUrl,
                        projectName,
                        url: link,
                        depth: depth + 1,
                        parentUrl: targetUrl,
                    });
                }
                console.log(`[Worker] Queued ${discoveredLinks.length} new pages`);
            } else {
                // Mark scan as completed if:
                // 1. No links discovered (discoveredLinks.length === 0)
                // 2. Reached max pages limit
                // 3. Reached max depth limit
                const reason = discoveredLinks.length === 0
                    ? 'no more links'
                    : currentPageCount >= maxPages
                        ? 'max pages reached'
                        : 'max depth reached';

                console.log(`[Worker] Scan complete: ${reason}`);

                await this.prismaService.scan.update({
                    where: { id: scanId },
                    data: { status: 'completed', completedAt: new Date() },
                });
            }

            return {
                success: true,
                title: result.title,
                screenshotUrl,
                aiAnalysis,
            };
        } catch (error) {
            console.error(`[Worker] Job ${job.id} failed:`, error);
            await this.markScanFailed(scanId, this.getUserFriendlyError(error));
            throw error;
        }
    }

    // Helper: Timeout wrapper
    private async withTimeout<T>(
        promise: Promise<T>,
        timeoutMs: number,
        errorMessage: string
    ): Promise<T> {
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
        );
        return Promise.race([promise, timeout]);
    }

    // Helper: Mark scan as failed
    private async markScanFailed(scanId: string, errorMessage: string): Promise<void> {
        if (!scanId) return;

        try {
            await this.prismaService.scan.update({
                where: { id: scanId },
                data: { status: 'failed', completedAt: new Date() },
            });

            await this.prismaService.scanLog.create({
                data: {
                    scanId,
                    logLevel: 'error',
                    message: errorMessage,
                    urlPath: '/',
                },
            });
        } catch (dbError) {
            console.error('[Worker] Failed to mark scan as failed', dbError.message);
        }
    }

    // Helper: Convert technical errors to user-friendly messages
    private getUserFriendlyError(error: any): string {
        const message = error.message || 'Unknown error';

        if (message.includes('ENOTFOUND')) {
            return 'Website not found - please check the URL';
        }
        if (message.includes('ETIMEDOUT') || message.includes('timeout')) {
            return 'Website took too long to respond - please try again';
        }
        if (message.includes('ECONNREFUSED')) {
            return 'Connection refused - website may be down';
        }
        if (message.includes('SSL') || message.includes('certificate')) {
            return 'SSL certificate error - website may be insecure';
        }
        if (message.includes('Navigation failed')) {
            return 'Failed to load page - website may have blocked the request';
        }

        return `Scan failed: ${message}`;
    }
}
