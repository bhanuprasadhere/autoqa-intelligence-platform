'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, Project, Scan, ScanLog } from '@/lib/api-client';

// Query Keys
export const queryKeys = {
    projects: ['projects'] as const,
    project: (id: string) => ['projects', id] as const,
    scans: (projectId: string) => ['projects', projectId, 'scans'] as const,
    scan: (scanId: string) => ['scans', scanId] as const,
    scanLogs: (scanId: string) => ['scans', scanId, 'logs'] as const,
};

// Projects
export function useProjects() {
    return useQuery({
        queryKey: queryKeys.projects,
        queryFn: () => apiClient.getProjects(),
    });
}

export function useProject(id: string, options?: any) {
    return useQuery({
        queryKey: queryKeys.project(id),
        queryFn: () => apiClient.getProject(id),
        enabled: !!id,
        ...options,
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { name: string; baseUrl: string; userId: string }) =>
            apiClient.createProject(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.projects });
        },
    });
}

// Scans
export function useScans(projectId: string, options?: any) {
    return useQuery({
        queryKey: queryKeys.scans(projectId),
        queryFn: () => apiClient.getScans(projectId),
        enabled: !!projectId,
        // Auto-refetch if any scan is running
        refetchInterval: (query) => {
            const data = query.state.data;
            return data && Array.isArray(data) && data.some((scan) => scan.status === 'running')
                ? 5000
                : false;
        },
        ...options,
    });
}

export function useCreateScan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (projectId: string) => apiClient.createScan(projectId),
        onSuccess: (data, projectId) => {
            // Invalidate scans list to show new scan
            queryClient.invalidateQueries({ queryKey: queryKeys.scans(projectId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.projects });
        },
    });
}

export function useStopScan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ projectId, scanId }: { projectId: string; scanId: string }) =>
            apiClient.stopScan(projectId, scanId),
        onSuccess: (data, variables) => {
            // Invalidate and refetch scan data immediately
            queryClient.invalidateQueries({ queryKey: queryKeys.scan(variables.scanId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.scans(variables.projectId) });

            // Force refetch to get latest status
            queryClient.refetchQueries({ queryKey: queryKeys.scan(variables.scanId) });
        },
    });
}

export function useScan(scanId: string, options?: { refetchInterval?: number }) {
    return useQuery({
        queryKey: queryKeys.scan(scanId),
        queryFn: () => apiClient.getScan(scanId),
        refetchInterval: options?.refetchInterval,
        staleTime: 0, // Always fetch fresh data
        gcTime: 0, // Don't cache old data
    });
}

// Scan Logs
export function useScanLogs(scanId: string) {
    return useQuery({
        queryKey: queryKeys.scanLogs(scanId),
        queryFn: () => apiClient.getScanLogs(scanId),
        enabled: !!scanId,
        refetchInterval: 3000, // Auto-refresh every 3 seconds
    });
}
