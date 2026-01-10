"use client";

import { useEffect, useState, use } from "react";
import { getProject, scanDirectory, getAssets, updateAsset, Project, Asset } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, FolderSearch, FileImage, FileAudio, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ArchivesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<Project | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [scanPath, setScanPath] = useState("");
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    useEffect(() => {
        Promise.all([getProject(id), getAssets(id)]).then(([proj, assts]) => {
            setProject(proj);
            setAssets(assts);
        });
    }, [id]);

    const handleScan = async () => {
        if (!scanPath) return;
        setScanning(true);
        setError(null);
        try {
            const newAssets = await scanDirectory(id, scanPath);
            // Merge new assets avoiding duplicates visually if needed, but backend handles it.
            // Simplest is to refetch or append.
            setAssets((prev) => [...prev, ...newAssets.filter(na => !prev.some(pa => pa.id === na.id))]);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Scan failed");
        } finally {
            setScanning(false);
        }
    };

    const handleUpdateAsset = async (assetId: string, rights: string, credit: string) => {
        try {
            const updated = await updateAsset(assetId, { rights_status: rights, credit_line: credit });
            setAssets(assets.map(a => a.id === assetId ? updated : a));
            setSelectedAsset(updated);
        } catch (e) {
            console.error("Failed to update asset", e);
        }
    };

    if (!project) return <div>Loading...</div>;

    return (
        <div className="flex h-full flex-col space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/projects/${id}`} className="text-stone-500 hover:text-white transition-colors">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Archives & Assets</h1>
            </div>

            {/* Scan Controls */}
            <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-6">
                <h3 className="text-sm font-medium text-stone-400 mb-4">Intake New Materials</h3>
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <FolderSearch className="absolute left-3 top-2.5 h-5 w-5 text-stone-500" />
                        <input
                            type="text"
                            value={scanPath}
                            onChange={(e) => setScanPath(e.target.value)}
                            placeholder="/absolute/path/to/archive/folder"
                            className="w-full rounded-md border border-stone-800 bg-stone-950 py-2 pl-10 pr-4 text-sm text-stone-200 placeholder:text-stone-600 focus:border-indigo-500 focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={handleScan}
                        disabled={scanning || !scanPath}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {scanning ? "Scanning..." : "Scan Directory"}
                    </button>
                </div>
                {error && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex gap-6 min-h-0">

                {/* Gallery / Grid */}
                <div className="flex-1 overflow-y-auto pr-2">
                    {assets.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-stone-800 text-stone-500">
                            <p>No assets indexed yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {assets.map((asset) => (
                                <div
                                    key={asset.id}
                                    onClick={() => setSelectedAsset(asset)}
                                    className={cn(
                                        "group cursor-pointer rounded-lg border bg-stone-900/50 p-4 transition-all hover:bg-stone-800",
                                        selectedAsset?.id === asset.id ? "border-indigo-500 ring-1 ring-indigo-500/50" : "border-stone-800"
                                    )}
                                >
                                    <div className="flex items-center justify-center aspect-square rounded bg-stone-950 mb-3">
                                        {asset.type === "Photo" ? <FileImage className="h-8 w-8 text-stone-600" /> :
                                            asset.type === "Audio" ? <FileAudio className="h-8 w-8 text-stone-600" /> :
                                                <FileText className="h-8 w-8 text-stone-600" />}
                                    </div>
                                    <p className="truncate text-xs font-medium text-stone-300" title={asset.file_path}>
                                        {asset.file_path.split("/").pop()}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-[10px] uppercase text-stone-500">{asset.type}</span>
                                        <div className={cn(
                                            "h-1.5 w-1.5 rounded-full",
                                            asset.rights_status === "Cleared" ? "bg-emerald-500" :
                                                asset.rights_status === "Restricted" ? "bg-red-500" :
                                                    "bg-yellow-500"
                                        )} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Inspector Panel */}
                {selectedAsset ? (
                    <div className="w-80 rounded-xl border border-stone-800 bg-stone-900/80 p-6 flex flex-col gap-6 h-fit">
                        <div>
                            <h4 className="font-medium text-white break-all">{selectedAsset.file_path.split("/").pop()}</h4>
                            <p className="mt-1 text-xs text-stone-500 break-all">{selectedAsset.file_path}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-stone-400 mb-1">Rights Status</label>
                                <select
                                    value={selectedAsset.rights_status}
                                    onChange={(e) => handleUpdateAsset(selectedAsset.id, e.target.value, selectedAsset.credit_line || "")}
                                    className="w-full rounded bg-stone-950 border border-stone-800 px-2 py-1.5 text-sm text-stone-200 outline-none focus:border-indigo-500"
                                >
                                    <option value="Unknown">Unknown</option>
                                    <option value="Requested">Requested</option>
                                    <option value="Cleared">Cleared</option>
                                    <option value="Restricted">Restricted</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-stone-400 mb-1">Credit Line</label>
                                <input
                                    type="text"
                                    value={selectedAsset.credit_line || ""}
                                    onChange={(e) => handleUpdateAsset(selectedAsset.id, selectedAsset.rights_status, e.target.value)}
                                    className="w-full rounded bg-stone-950 border border-stone-800 px-2 py-1.5 text-sm text-stone-200 outline-none focus:border-indigo-500"
                                    placeholder="e.g. Photo by Jane Doe"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-stone-800 text-xs text-stone-500">
                            <p>Asset ID: {selectedAsset.id}</p>
                        </div>
                    </div>
                ) : (
                    <div className="w-80 flex items-center justify-center rounded-xl border border-dashed border-stone-800 bg-stone-900/20 text-stone-500 text-sm">
                        Select an asset to view details
                    </div>
                )}
            </div>
        </div>
    );
}
