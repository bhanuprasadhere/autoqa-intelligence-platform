'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Chrome } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error('Error logging in:', error.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full mx-4"
            >
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                    {/* Logo/Title */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="inline-block"
                        >
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl font-bold text-white">AQ</span>
                            </div>
                        </motion.div>
                        <h1 className="text-3xl font-bold text-white mb-2">AutoQA Intelligence</h1>
                        <p className="text-slate-300">AI-Powered Testing Platform</p>
                    </div>

                    {/* Login Button */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full bg-white hover:bg-slate-50 text-slate-900 font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 hover:scale-105 shadow-lg"
                        >
                            <Chrome className="w-5 h-5" />
                            Sign in with Google
                        </button>
                    </motion.div>

                    {/* Footer */}
                    <p className="text-center text-slate-400 text-sm mt-8">
                        Secure authentication powered by Supabase
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
