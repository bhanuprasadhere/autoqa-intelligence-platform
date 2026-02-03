'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateProjectPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [projectId, setProjectId] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            baseUrl: formData.get('baseUrl'),
            userId: '00000000-0000-0000-0000-000000000001', // Hardcoded test UUID for walking skeleton
        };

        try {
            const res = await fetch('http://localhost:4000/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error('Failed to create project');

            const project = await res.json();
            setProjectId(project.id);
            // router.push('/dashboard'); // Stay on page to show success for now
        } catch (error) {
            console.error(error);
            alert('Error creating project');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 font-sans">
            <main className="w-full max-w-md space-y-8">
                <h1 className="text-4xl font-bold text-center text-[var(--color-neon-green)] drop-shadow-[0_0_10px_var(--color-neon-green)]">
                    AutoQA Init
                </h1>

                <div className="bg-gray-900 border border-[var(--color-neon-purple)] rounded-lg p-6 shadow-[0_0_20px_rgba(188,19,254,0.3)]">
                    <h2 className="text-xl font-semibold mb-4 text-white">New Target Project</h2>

                    {projectId ? (
                        <div className="text-center space-y-4">
                            <div className="text-[var(--color-neon-green)] text-lg">Project Created! 🚀</div>
                            <div className="text-sm text-gray-400">ID: {projectId}</div>
                            <button
                                onClick={() => setProjectId(null)}
                                className="text-[var(--color-neon-cyan)] hover:underline"
                            >
                                Create Another
                            </button>
                        </div>
                    ) : (
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
                                disabled={loading}
                                className="w-full py-2 bg-[var(--color-neon-purple)] hover:bg-[#a010d8] text-white font-bold rounded shadow-[0_0_15px_var(--color-neon-purple)] transition-all disabled:opacity-50"
                            >
                                {loading ? 'Initializing...' : 'Initialize Scans'}
                            </button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}
