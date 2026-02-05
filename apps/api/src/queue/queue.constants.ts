export const SCAN_JOBS_QUEUE = 'scan-jobs';

export interface ScanJobData {
    projectId: string;
    scanId: string;
    baseUrl: string;
    projectName: string;
}
