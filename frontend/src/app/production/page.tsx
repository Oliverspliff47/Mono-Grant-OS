"use client";

import { Package, Construction } from "lucide-react";

export default function ProductionPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Production</h1>
            </div>

            <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-12 text-center">
                <Construction className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Coming Soon</h2>
                <p className="text-stone-400 max-w-md mx-auto">
                    Production pipeline management features are under development.
                    This will include print preparation, quality checks, and delivery tracking.
                </p>
            </div>
        </div>
    );
}
