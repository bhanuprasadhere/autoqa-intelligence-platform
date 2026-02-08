'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateProject } from '@/lib/hooks/use-api';
import { toast } from 'sonner';

export default function CreateProjectPage() {
    const router = useRouter();
    const createProject = useCreateProject();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name') as string,
            baseUrl: formData.get('baseUrl') as string,
            userId: '00000000-0000-0000-0000-000000000001', // Hardcoded test UUID for walking skeleton
        };

        createProject.mutate(data, {
            onSuccess: (project: any) => {
                if (project._isExisting) {
                    toast.info(project.message || 'This project already exists. Redirecting...');
                } else {
                    toast.success('Project created successfully!');
                }
                // Navigate to projects list - cache will auto-update
                router.push('/projects');
            },
            onError: (error: any) => {
                console.error(error);
                toast.error(error.message || 'Failed to create project');
            },
        });
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 font-sans">
            <main className="w-full max-w-md space-y-8">
                <h1 className="text-4xl font-bold text-center text-[var(--color-neon-green)] drop-shadow-[0_0_10px_var(--color-neon-green)]">
                    AutoQA Init
                </h1>

                <div className="bg-gray-900 border border-[var(--color-neon-purple)] rounded-lg p-6 shadow-[0_0_20px_rgba(188,19,254,0.3)]">
                    <h2 className="text-xl font-semibold mb-4 text-white">New Target Project</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Project Name</label>
                            <input
                                name="name"
                                type="text"
                                placeholder="My E-commerce App"
                                required
                                className="w-full bg-black border border-gray-700 rounded p-2 focus:border-[var(--color-neon-cyan)] focus:outline-none text-white transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Base URL</label>
                            <input
                                name="baseUrl"
                                type="url"
                                placeholder="https://example.com"
                                required
                                className="w-full bg-black border border-gray-700 rounded p-2 focus:border-[var(--color-neon-cyan)] focus:outline-none text-white transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={createProject.isPending}
                            className="w-full py-2 bg-[var(--color-neon-purple)] hover:bg-[#a010d8] text-white font-bold rounded shadow-[0_0_15px_var(--color-neon-purple)] transition-all disabled:opacity-50"
                        >
                            {createProject.isPending ? 'Initializing...' : 'Initialize Scans'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
