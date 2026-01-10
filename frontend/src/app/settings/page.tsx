"use client";

import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
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

            <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-8">
                <h2 className="text-lg font-semibold text-white mb-4">Preferences</h2>
                <p className="text-stone-500 text-sm">
                    User preferences and configuration options will be available in a future update.
                </p>
            </div>
        </div>
    );
}
