'use client';

import { useParams } from 'next/navigation';
import { useScan, useScanLogs } from '@/lib/hooks/use-api';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ScanDetailPage() {
    const params = useParams();
    const projectId = params.id as string;
    const scanId = params.scanId as string;

    const [activeTab, setActiveTab] = useState<'overview' | 'logs'>('overview');

    // Fetch scan data with auto-refresh if running
    const { data: scan, isLoading: scanLoading, error: scanError } = useScan(scanId, {
        refetchInterval: (query) => {
            const scanData = query.state.data;
            return scanData?.status === 'running' || scanData?.status === 'queued' ? 3000 : false;
        },
    });

    // Fetch logs
    const { data: logs = [], isLoading: logsLoading } = useScanLogs(scanId);

    if (scanLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white">Loading scan details...</div>
            </div>
        );
    }

    if (scanError || !scan) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Scan Not Found</h1>
                    <p className="text-gray-400 mb-4">
                        The scan you're looking for doesn't exist or has been deleted.
                    </p>
                    <Link
                        href={`/projects/${projectId}`}
                        className="text-[var(--color-neon-cyan)] hover:underline"
                    >
                        ← Back to Project
                    </Link>
                </div>
            </div>
        );
    }

    const statusColors = {
        queued: 'text-yellow-400',
        running: 'text-blue-400',
        completed: 'text-green-400',
        failed: 'text-red-400',
        stopped: 'text-gray-400',
    };

    return (
        <div className="min-h-screen p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href={`/projects/${projectId}`}
                        className="text-[var(--color-neon-cyan)] hover:underline mb-4 inline-block"
                    >
                        ← Back to Project
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Scan Details</h1>
                    <p className="text-gray-400 text-sm mt-1">ID: {scanId}</p>
                </div>

                {/* Status Card */}
                <div className="bg-gray-900 border border-[var(--color-neon-purple)] rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-gray-400 text-sm">Status</p>
                            <p className={`text-lg font-bold ${statusColors[scan.status]}`}>
                                {scan.status.toUpperCase()}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Pages Scanned</p>
                            <p className="text-lg font-bold text-white">{scan.totalPagesScanned}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Bugs Found</p>
                            <p className="text-lg font-bold text-white">{scan.totalBugsFound}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Started</p>
                            <p className="text-sm text-white">
                                {scan.startedAt ? new Date(scan.startedAt).toLocaleString() : 'Not started'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-700 mb-6">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`pb-2 px-4 ${activeTab === 'overview'
                                    ? 'border-b-2 border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)]'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`pb-2 px-4 ${activeTab === 'logs'
                                    ? 'border-b-2 border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)]'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Logs ({logs.length})
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Scan Overview</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-gray-400 text-sm">Scan ID</p>
                                <p className="text-white font-mono text-sm">{scan.id}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Project ID</p>
                                <p className="text-white font-mono text-sm">{scan.projectId}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Created At</p>
                                <p className="text-white">{new Date(scan.startedAt || Date.now()).toLocaleString()}</p>
                            </div>
                            {scan.completedAt && (
                                <div>
                                    <p className="text-gray-400 text-sm">Completed At</p>
                                    <p className="text-white">{new Date(scan.completedAt).toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Real-Time Logs</h2>
                        {logsLoading ? (
                            <p className="text-gray-400">Loading logs...</p>
                        ) : logs.length === 0 ? (
                            <p className="text-gray-400">No logs yet. Logs will appear as the scan progresses.</p>
                        ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                {logs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="border-l-4 border-blue-500 bg-gray-800 p-3 rounded"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-bold ${log.logLevel === 'error' ? 'text-red-400' :
                                                    log.logLevel === 'warning' ? 'text-yellow-400' :
                                                        'text-green-400'
                                                }`}>
                                                [{log.logLevel.toUpperCase()}]
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(log.createdAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-white text-sm">{log.message}</p>
                                        {log.urlPath && (
                                            <p className="text-gray-400 text-xs mt-1">Path: {log.urlPath}</p>
                                        )}
                                        {log.screenshotUrl && (
                                            <a
                                                href={log.screenshotUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[var(--color-neon-cyan)] text-xs hover:underline mt-1 inline-block"
                                            >
                                                View Screenshot →
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
