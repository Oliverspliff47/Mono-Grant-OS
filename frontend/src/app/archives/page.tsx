"use client";

import { useEffect, useState } from "react";
import { getDashboardStats, Asset } from "@/lib/api";
import { Image as ImageIcon, FileText, Database } from "lucide-react";

export default function ArchivesPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [totalAssets, setTotalAssets] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardStats().then((data) => {
            setAssets(data.recent_assets || []);
            setTotalAssets(data.counts?.assets || 0);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const getAssetIcon = (type: string) => {
        if (type === "Photo") return <ImageIcon className="h-6 w-6 text-amber-400" />;
        return <FileText className="h-6 w-6 text-stone-400" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Archives</h1>
                <div className="flex items-center gap-2 text-sm text-stone-500">
                    <Database className="h-4 w-4" />
                    {totalAssets} assets indexed
                </div>
            </div>
            <p className="text-stone-400">
                Browse all indexed assets across your projects.
            </p>

            {loading && (
                <div className="flex justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
                </div>
            )}

            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                {assets.map((asset) => (
                    <div
                        key={asset.id}
                        className="aspect-square rounded-xl border border-stone-800 bg-stone-900/50 flex flex-col items-center justify-center p-4 hover:border-stone-700 transition-colors"
                        title={asset.file_path}
                    >
                        {getAssetIcon(asset.type)}
                        <p className="mt-2 text-xs text-stone-500 text-center truncate w-full">
                            {asset.type}
                        </p>
                    </div>
                ))}
                {assets.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-stone-500 border border-dashed border-stone-800 rounded-xl">
                        No assets indexed yet. Assets are scanned from project directories.
                    </div>
                )}
            </div>
        </div>
    );
}
