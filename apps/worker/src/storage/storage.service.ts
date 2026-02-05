import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
    private supabase: SupabaseClient;
    private bucketName = 'screenshots';

    constructor() {
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        );
    }

    async uploadScreenshot(
        filename: string,
        buffer: Buffer,
        contentType: string = 'image/png',
    ): Promise<string> {
        const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .upload(filename, buffer, {
                contentType,
                upsert: true,
            });

        if (error) {
            console.error('[Storage] Upload failed:', error.message);
            // Fallback: Return empty string or throw
            throw error;
        }

        // Get public URL
        const { data: publicUrlData } = this.supabase.storage
            .from(this.bucketName)
            .getPublicUrl(filename);

        return publicUrlData.publicUrl;
    }
}
