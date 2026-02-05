import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface PageAnalysis {
    pageType: string;
    summary: string;
    forms: FormDetection[];
    suggestedTests: string[];
}

export interface FormDetection {
    type: string;
    fields: string[];
    action?: string;
}

@Injectable()
export class AiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('[AI] GEMINI_API_KEY not found - AI features disabled');
            return;
        }

        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // User verified gemini-2.5-flash works via Postman
        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
        });
        console.log('[AI] Gemini initialized with gemini-2.5-flash');
    }

    async analyzePageScreenshot(
        screenshot: Buffer,
        url: string,
        pageTitle: string,
    ): Promise<PageAnalysis> {
        if (!this.model) {
            return this.getFallbackAnalysis(url, pageTitle);
        }

        try {
            const prompt = `Analyze this webpage screenshot from ${url} (title: "${pageTitle}").

Provide a JSON response with:
1. pageType: (e.g., "login", "homepage", "search", "form", "content")
2. summary: Brief description of the page
3. forms: Array of detected forms with {type, fields[], action}
4. suggestedTests: Array of test ideas (SQL injection, XSS, edge cases)

Return ONLY valid JSON, no markdown.`;

            const result = await this.model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: screenshot.toString('base64'),
                        mimeType: 'image/png',
                    },
                },
            ]);

            const response = await result.response;
            const text = response.text();

            // Parse JSON from response (remove markdown if present)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                console.log(`[AI] ✅ Analysis complete for ${url}:`, analysis.pageType);
                return analysis;
            }

            throw new Error('Invalid JSON response from Gemini');
        } catch (error) {
            console.error('[AI] ❌ Analysis failed:', error.message);
            return this.getFallbackAnalysis(url, pageTitle);
        }
    }

    private getFallbackAnalysis(url: string, pageTitle: string): PageAnalysis {
        return {
            pageType: 'unknown',
            summary: `Page: ${pageTitle}`,
            forms: [],
            suggestedTests: [
                'Manual inspection required',
                'Check for broken links',
                'Verify page loads correctly',
            ],
        };
    }
}
