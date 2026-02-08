'use client';

import { motion } from 'framer-motion';
import { useProjects } from '@/lib/hooks/use-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function ProjectsPage() {
    const { data: projects, isLoading } = useProjects();

    if (isLoading) {
        return (
            <div className="container mx-auto p-8">
                <div className="mb-8">
                    <Skeleton className="h-10 w-64 mb-2" />
                    <Skeleton className="h-6 w-96" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8"
            >
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Projects</h1>
                        <p className="text-muted-foreground">
                            Manage your automated testing projects
                        </p>
                    </div>
                    <Link href="/projects/new">
                        <Button size="lg">Create Project</Button>
                    </Link>
                </div>
            </motion.div>

            {!projects || projects.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-16"
                >
                    <div className="text-6xl mb-4">🚀</div>
                    <h2 className="text-2xl font-semibold mb-2">No projects yet</h2>
                    <p className="text-muted-foreground mb-6">
                        Create your first project to start automated testing
                    </p>
                    <Link href="/projects/new">
                        <Button size="lg">Create Your First Project</Button>
                    </Link>
                </motion.div>
            ) : (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: {
                            transition: {
                                staggerChildren: 0.1,
                            },
                        },
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {projects.map((project) => (
                        <motion.div
                            key={project.id}
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 },
                            }}
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Link href={`/projects/${project.id}`}>
                                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-xl">{project.name}</CardTitle>
                                            <Badge variant="outline">Active</Badge>
                                        </div>
                                        <CardDescription className="truncate">
                                            {project.baseUrl}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm text-muted-foreground">
                                            Created {formatDistanceToNow(new Date(project.createdAt))} ago
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
