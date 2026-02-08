import { Injectable } from '@nestjs/common';
import { Page } from 'playwright';

@Injectable()
export class LinkExtractorService {
    /**
     * Extract all links from a page
     */
    async extractLinks(page: Page): Promise<string[]> {
        const links = await page.$$eval('a[href]', (anchors) =>
            anchors.map((a) => (a as HTMLAnchorElement).href)
        );
        return links;
    }

    /**
     * Filter to only internal links (same domain)
     */
    filterInternalLinks(links: string[], baseDomain: string): string[] {
        try {
            const baseUrl = new URL(baseDomain);
            const baseHostname = baseUrl.hostname;

            return links.filter((link) => {
                try {
                    // Handle relative URLs by resolving against base
                    const absoluteUrl = new URL(link, baseDomain);
                    return absoluteUrl.hostname === baseHostname;
                } catch (error) {
                    console.error(`[LinkExtractor] Invalid URL: ${link}`, error.message);
                    return false; // Invalid URL
                }
            });
        } catch (error) {
            console.error(`[LinkExtractor] Invalid base domain: ${baseDomain}`, error.message);
            return [];
        }
    }

    /**
     * Normalize URL (remove fragments, trailing slashes, sort query params)
     */
    normalizeUrl(url: string): string {
        try {
            const parsed = new URL(url);

            // Remove fragment
            parsed.hash = '';

            // Remove trailing slash
            if (parsed.pathname.endsWith('/') && parsed.pathname !== '/') {
                parsed.pathname = parsed.pathname.slice(0, -1);
            }

            // Sort query parameters for consistency
            const params = Array.from(parsed.searchParams.entries());
            params.sort((a, b) => a[0].localeCompare(b[0]));
            parsed.search = new URLSearchParams(params).toString();

            return parsed.toString();
        } catch {
            return url; // Return as-is if parsing fails
        }
    }

    /**
     * Remove duplicate URLs
     */
    deduplicateUrls(urls: string[]): string[] {
        return Array.from(new Set(urls.map((url) => this.normalizeUrl(url))));
    }

    /**
     * Extract and filter links from a page
     */
    async extractInternalLinks(page: Page, baseUrl: string): Promise<string[]> {
        const allLinks = await this.extractLinks(page);
        const internalLinks = this.filterInternalLinks(allLinks, baseUrl);
        const uniqueLinks = this.deduplicateUrls(internalLinks);

        return uniqueLinks;
    }
}
