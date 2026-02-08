import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';

export interface CrawlResult {
    title: string;
    screenshot: Buffer;
    url: string;
    timestamp: Date;
    page: Page; // Keep page open for link extraction
}

@Injectable()
export class CrawlerService implements OnModuleInit, OnModuleDestroy {
    private browser: Browser | null = null;

    async onModuleInit() {
        console.log('[Crawler] Launching browser...');
        this.browser = await chromium.launch({
            headless: true,
        });
        console.log('[Crawler] Browser ready!');
    }

    async onModuleDestroy() {
        if (this.browser) {
            await this.browser.close();
            console.log('[Crawler] Browser closed.');
        }
    }

    async crawl(url: string): Promise<CrawlResult> {
        if (!this.browser) {
            throw new Error('Browser not initialized');
        }

        console.log(`[Crawler] Visiting: ${url}`);
        const page: Page = await this.browser.newPage();

        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

            const title = await page.title();
            console.log(`[Crawler] Page title: ${title}`);

            const screenshot = await page.screenshot({ fullPage: true });
            console.log(`[Crawler] Screenshot captured (${screenshot.length} bytes)`);

            // Don't close page - let processor extract links first
            return {
                title,
                screenshot,
                url,
                timestamp: new Date(),
                page, // Return page for link extraction
            };
        } catch (error) {
            // Close page on error
            try {
                await page.close();
            } catch (closeError) {
                console.error('[Crawler] Failed to close page after error', closeError);
            }

            // Check if browser crashed
            if (!this.browser.isConnected()) {
                console.error('[Crawler] Browser crashed, restarting...');
                try {
                    await this.browser.close();
                } catch (e) {
                    // Ignore close errors
                }
                this.browser = await chromium.launch({ headless: true });
                console.log('[Crawler] Browser restarted');
            }

            throw error;
        }
    }
}
