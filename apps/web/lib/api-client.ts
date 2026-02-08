// TypeScript interfaces for API responses
export interface Project {
    id: string;
    userId: string;
    name: string;
    baseUrl: string;
    createdAt: string;
    scanId?: string;
}

export interface Scan {
    id: string;
    projectId: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'stopped';
    startedAt: string | null;
    completedAt: string | null;
    totalPagesScanned: number;
    totalBugsFound: number;
}

export interface ScanLog {
    id: string;
    scanId: string;
    logLevel: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    urlPath: string | null;
    screenshotUrl: string | null;
    aiAnalysis: AIAnalysis | null;
    createdAt: string;
}

export interface AIAnalysis {
    pageType: string;
    formsFound: number;
    suggestedTests: TestSuggestion[];
}

export interface TestSuggestion {
    type: string;
    description: string;
    priority?: 'high' | 'medium' | 'low';
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class APIClient {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            let errorMessage = `API Error: ${response.statusText}`;
            try {
                const errorBody = await response.json();
                errorMessage = errorBody.message || errorBody.error || errorMessage;
            } catch (e) {
                // Ignore JSON parse error, use status text
            }
            throw new Error(errorMessage);
        }

        return response.json();
    }

    // Projects
    async getProjects(): Promise<Project[]> {
        return this.fetch<Project[]>('/projects');
    }

    async getProject(id: string): Promise<Project> {
        return this.fetch<Project>(`/projects/${id}`);
    }

    async createProject(data: { name: string; baseUrl: string; userId: string }): Promise<Project> {
        return this.fetch<Project>('/projects', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Scans
    async getScans(projectId: string): Promise<Scan[]> {
        return this.fetch<Scan[]>(`/projects/${projectId}/scans`);
    }

    async createScan(projectId: string): Promise<Scan> {
        return this.fetch<Scan>(`/projects/${projectId}/scans`, {
            method: 'POST',
        });
    }

    // Individual Scan
    async getScan(scanId: string): Promise<Scan> {
        return this.fetch<Scan>(`/scans/${scanId}`);
    }

    async stopScan(projectId: string, scanId: string): Promise<{ message: string; scan: Scan; removedJobs: number }> {
        return this.fetch(`/projects/${projectId}/scans/${scanId}/stop`, {
            method: 'POST',
        });
    }

    // Scan Logs
    async getScanLogs(scanId: string): Promise<ScanLog[]> {
        return this.fetch<ScanLog[]>(`/scans/${scanId}/logs`);
    }
}

export const apiClient = new APIClient();
