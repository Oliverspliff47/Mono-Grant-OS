"use client";

import { useState } from "react";
import { clearAllProjects } from "@/lib/api";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

export default function SettingsPage() {
    const [clearing, setClearing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleClearAll = async () => {
        setClearing(true);
        try {
            await clearAllProjects();
            setShowConfirm(false);
            alert("All data cleared successfully!");
            window.location.href = "/"; // Redirect to dashboard
        } catch {
            alert("Failed to clear data");
        } finally {
            setClearing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Settings</h1>
            </div>

            <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-8">
                <h2 className="text-lg font-semibold text-white mb-4">System Information</h2>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-stone-800 pb-3">
                        <span className="text-stone-400">Version</span>
                        <span className="text-white font-mono">1.0.0</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-800 pb-3">
                        <span className="text-stone-400">Environment</span>
                        <span className="text-emerald-400 font-mono">Production</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-800 pb-3">
                        <span className="text-stone-400">API Endpoint</span>
                        <span className="text-stone-300 font-mono text-xs">Railway</span>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-8">
                <h2 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                </h2>
                <p className="text-stone-400 text-sm mb-4">
                    These actions are destructive and cannot be undone.
                </p>
                <button
                    onClick={() => setShowConfirm(true)}
                    className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                >
                    <Trash2 className="h-4 w-4" />
                    Clear All Projects
                </button>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-stone-900 p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Clear All Data?</h2>
                                <p className="text-sm text-stone-400">This cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-stone-300 text-sm mb-6">
                            This will permanently delete all projects, sections, assets, funding opportunities, and applications.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={clearing}
                                className="px-4 py-2 text-sm text-stone-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearAll}
                                disabled={clearing}
                                className="flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                            >
                                {clearing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                                Yes, Delete Everything
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

