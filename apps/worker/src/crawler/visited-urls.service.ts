import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class VisitedUrlsService {
    private redis: Redis;

    constructor() {
        this.redis = new Redis(process.env.REDIS_URL!);
    }

    /**
     * Check if a URL has been visited in this scan
     */
    async isVisited(scanId: string, url: string): Promise<boolean> {
        const key = `scan:${scanId}:visited`;
        const exists = await this.redis.sismember(key, url);
        return exists === 1;
    }

    /**
     * Mark a URL as visited
     */
    async markVisited(scanId: string, url: string): Promise<void> {
        const key = `scan:${scanId}:visited`;
        await this.redis.sadd(key, url);
        // Set TTL of 1 hour (auto-cleanup)
        await this.redis.expire(key, 3600);
    }

    /**
     * Get all visited URLs for a scan
     */
    async getVisitedUrls(scanId: string): Promise<string[]> {
        const key = `scan:${scanId}:visited`;
        return await this.redis.smembers(key);
    }

    /**
     * Clear visited URLs for a scan
     */
    async clearVisited(scanId: string): Promise<void> {
        const key = `scan:${scanId}:visited`;
        await this.redis.del(key);
    }
}
