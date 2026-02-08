import { Test, TestingModule } from '@nestjs/testing';
import { LinkExtractorService } from './link-extractor.service';

describe('LinkExtractorService', () => {
    let service: LinkExtractorService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LinkExtractorService],
        }).compile();

        service = module.get<LinkExtractorService>(LinkExtractorService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('filterInternalLinks', () => {
        it('should filter to only internal links', () => {
            const links = [
                'https://example.com/page1',
                'https://example.com/page2',
                'https://google.com/search',
                'https://facebook.com',
            ];
            const result = service.filterInternalLinks(links, 'https://example.com');
            expect(result).toEqual([
                'https://example.com/page1',
                'https://example.com/page2',
            ]);
        });

        it('should handle different subdomains', () => {
            const links = [
                'https://www.example.com/page1',
                'https://example.com/page2',
            ];
            const result = service.filterInternalLinks(links, 'https://example.com');
            expect(result).toEqual(['https://example.com/page2']);
        });

        it('should handle invalid URLs gracefully', () => {
            const links = ['not-a-url', 'https://example.com/valid'];
            const result = service.filterInternalLinks(links, 'https://example.com');
            expect(result).toEqual(['https://example.com/valid']);
        });
    });

    describe('normalizeUrl', () => {
        it('should remove hash fragments', () => {
            expect(service.normalizeUrl('https://example.com/page#section')).toBe(
                'https://example.com/page'
            );
        });

        it('should remove trailing slashes', () => {
            expect(service.normalizeUrl('https://example.com/page/')).toBe(
                'https://example.com/page'
            );
        });

        it('should keep root trailing slash', () => {
            expect(service.normalizeUrl('https://example.com/')).toBe(
                'https://example.com/'
            );
        });

        it('should sort query parameters', () => {
            const url = service.normalizeUrl('https://example.com?z=1&a=2');
            expect(url).toBe('https://example.com/?a=2&z=1');
        });

        it('should handle invalid URLs', () => {
            const invalid = 'not-a-url';
            expect(service.normalizeUrl(invalid)).toBe(invalid);
        });
    });

    describe('deduplicateUrls', () => {
        it('should remove duplicate URLs', () => {
            const urls = [
                'https://example.com/page',
                'https://example.com/page/',
                'https://example.com/page#hash',
            ];
            const result = service.deduplicateUrls(urls);
            expect(result).toHaveLength(1);
            expect(result[0]).toBe('https://example.com/page');
        });

        it('should preserve unique URLs', () => {
            const urls = [
                'https://example.com/page1',
                'https://example.com/page2',
            ];
            const result = service.deduplicateUrls(urls);
            expect(result).toHaveLength(2);
        });
    });
});
