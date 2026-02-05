import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';

export interface CrawlResult {
    title: string;
    screenshot: Buffer;
    url: string;
    timestamp: Date;
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

            return {
                title,
                screenshot,
                url,
                timestamp: new Date(),
            };
        } finally {
            await page.close();
        }
    }
}
