'use client';

import { motion } from 'framer-motion';
import { use } from 'react';
import { useProject, useScans, useCreateScan } from '@/lib/hooks/use-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ExternalLink, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: project, isLoading: projectLoading } = useProject(id, {
        refetchInterval: 3000, // Poll every 3 seconds for real-time updates
    });
    const { data: scans, isLoading: scansLoading } = useScans(id, {
        refetchInterval: 3000, // Poll every 3 seconds for real-time updates
    });
    const createScan = useCreateScan();

    const handleNewScan = () => {
        console.log('[Frontend] Creating new scan for project:', id);
        createScan.mutate(id, {
            onSuccess: (scan) => {
                console.log('[Frontend] New scan created:', scan.id);
                toast.success('New scan started!');
            },
            onError: (error: any) => {
                console.error('[Frontend] Failed to create scan:', error);
                toast.error(error.message || 'Failed to start scan');
            },
        });
    };

    if (projectLoading) {
        return (
            <div className="container mx-auto p-8">
                <Skeleton className="h-10 w-64 mb-8" />
                <Skeleton className="h-96" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="container mx-auto p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Project not found</h1>
                <Link href="/projects">
                    <Button>Back to Projects</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <Link href="/projects" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Projects
                </Link>

                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
                        <a
                            href={project.baseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground inline-flex items-center"
                        >
                            {project.baseUrl}
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </div>
                    <Button onClick={handleNewScan} disabled={createScan.isPending}>
                        <Play className="mr-2 h-4 w-4" />
                        {createScan.isPending ? 'Starting...' : 'Run New Scan'}
                    </Button>
                </div>

                <Tabs defaultValue="scans" className="w-full">
                    <TabsList>
                        <TabsTrigger value="scans">Scans</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="scans" className="mt-6">
                        {scansLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-24" />
                                ))}
                            </div>
                        ) : !scans || scans.length === 0 ? (
                            <Card>
                                <CardContent className="pt-6 text-center">
                                    <p className="text-muted-foreground">No scans yet</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.05,
                                        },
                                    },
                                }}
                                className="space-y-4"
                            >
                                {scans.map((scan) => (
                                    <motion.div
                                        key={scan.id}
                                        variants={{
                                            hidden: { opacity: 0, x: -20 },
                                            visible: { opacity: 1, x: 0 },
                                        }}
                                    >
                                        <Link href={`/projects/${id}/scans/${scan.id}`}>
                                            <Card className="cursor-pointer hover:shadow-md transition-shadow">
                                                <CardHeader>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <CardTitle className="text-lg">
                                                                Scan #{scan.id.slice(0, 8)}
                                                            </CardTitle>
                                                            <CardDescription>
                                                                {scan.startedAt
                                                                    ? `Started ${formatDistanceToNow(new Date(scan.startedAt))} ago`
                                                                    : 'Not started'}
                                                            </CardDescription>
                                                        </div>
                                                        <Badge
                                                            className={
                                                                scan.status === 'completed'
                                                                    ? 'bg-green-500 hover:bg-green-600'
                                                                    : scan.status === 'failed'
                                                                        ? 'bg-red-500 hover:bg-red-600'
                                                                        : scan.status === 'running'
                                                                            ? 'bg-purple-500 hover:bg-purple-600'
                                                                            : 'bg-slate-500 hover:bg-slate-600'
                                                            }
                                                        >
                                                            {scan.status === 'running' && (
                                                                <motion.span
                                                                    animate={{ scale: [1, 1.2, 1] }}
                                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                                    className="mr-2 inline-block h-2 w-2 rounded-full bg-current"
                                                                />
                                                            )}
                                                            {scan.status}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex gap-6 text-sm text-muted-foreground">
                                                        <div>
                                                            <span className="font-medium">{scan.totalPagesScanned}</span> pages scanned
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">{scan.totalBugsFound}</span> issues found
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </TabsContent>

                    <TabsContent value="settings">
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Settings</CardTitle>
                                <CardDescription>Manage your project configuration</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Settings coming soon...</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </div>
    );
}
