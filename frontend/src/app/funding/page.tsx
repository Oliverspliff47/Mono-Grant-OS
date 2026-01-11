"use client";

import { useEffect, useState } from "react";
import { getOpportunities, createOpportunity, createApplication, importOpportunities, importOpportunitiesFile, Opportunity } from "@/lib/api";
import { Plus, Calendar, ArrowRight, Search, Loader2, Sparkles, ClipboardPaste, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FundingPage() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const router = useRouter();

    useEffect(() => {
        getOpportunities().then((data) => {
            setOpportunities(data);
            setLoading(false);
        });
    }, []);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            const newOpp = await createOpportunity({
                funder_name: formData.get("funder") as string,
                programme_name: formData.get("programme") as string,
                deadline: formData.get("deadline") as string,
            });
            setOpportunities([...opportunities, newOpp]);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to create opportunity", error);
        }
    };

    const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setImporting(true);
        try {
            const discovered = await importOpportunities(
                formData.get("importText") as string
            );
            handleImportSuccess(discovered);
        } catch (error) {
            console.error("Import failed", error);
            alert("Import failed. Please try again.");
        } finally {
            setImporting(false);
        }
    };

    const handleImportFile = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];

        setImporting(true);
        try {
            const discovered = await importOpportunitiesFile(file);
            handleImportSuccess(discovered);
        } catch (error) {
            console.error("File Import failed", error);
            alert("File Import failed. Please try again.");
        } finally {
            setImporting(false);
        }
    };

    const handleImportSuccess = (discovered: Opportunity[]) => {
        setOpportunities([...opportunities, ...discovered]);
        setIsImportModalOpen(false);
        if (discovered.length > 0) {
            alert(`Success! Parsed and imported ${discovered.length} opportunities.`);
        } else {
            alert("No opportunities found using Gemini parsing. Ensure the content is clear.");
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImportFile(e.dataTransfer.files);
        }
    };

    const handleStartApplication = async (oppId: string) => {
        try {
            const app = await createApplication(oppId);
            router.push(`/funding/${app.id}`);
        } catch {
            alert("Failed to start application (or one already exists!)");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Funding Pipeline</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-medium text-white hover:from-emerald-500 hover:to-teal-500 transition-colors"
                    >
                        <ClipboardPaste className="h-4 w-4" />
                        Import from Research
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-stone-200 hover:bg-stone-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Add Manually
                    </button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {opportunities.map((opp) => (
                    <div key={opp.id} className="relative rounded-xl border border-stone-800 bg-stone-900/50 p-6 flex flex-col justify-between hover:border-indigo-500/50 transition-colors group">
                        <div>
                            <h3 className="text-lg font-semibold text-white">{opp.programme_name}</h3>
                            <p className="text-sm text-stone-400">{opp.funder_name}</p>

                            <div className="mt-4 flex items-center gap-2 text-sm text-stone-500">
                                <Calendar className="h-4 w-4" />
                                <span>Deadline: {new Date(opp.deadline).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <span className="rounded-full bg-stone-800 px-2.5 py-0.5 text-xs text-stone-400">
                                {opp.status}
                            </span>
                            <button
                                onClick={() => handleStartApplication(opp.id)}
                                className="flex items-center gap-1 text-sm font-medium text-indigo-400 hover:text-indigo-300"
                            >
                                Start Draft <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {opportunities.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-stone-500 border border-dashed border-stone-800 rounded-xl">
                        No funding opportunities tracked yet.
                    </div>
                )}
            </div>

            {/* Add Opportunity Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-xl border border-stone-800 bg-stone-900 p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-4">Track New Opportunity</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-400">Funder Name</label>
                                <input name="funder" required className="mt-1 w-full rounded bg-stone-950 border border-stone-800 px-3 py-2 text-stone-200 outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-400">Programme Name</label>
                                <input name="programme" required className="mt-1 w-full rounded bg-stone-950 border border-stone-800 px-3 py-2 text-stone-200 outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-400">Deadline</label>
                                <input name="deadline" type="date" required className="mt-1 w-full rounded bg-stone-950 border border-stone-800 px-3 py-2 text-stone-200 outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-stone-400 hover:text-white">Cancel</button>
                                <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500">Add Opportunity</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Smart Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl rounded-xl border border-teal-500/30 bg-stone-900 p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                <ClipboardPaste className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Import from Research</h2>
                                <p className="text-sm text-stone-400">Paste text or upload a document (PDF/Text) to extract opportunities.</p>
                            </div>
                        </div>

                        {/* File Upload Zone */}
                        <div
                            className={`mb-6 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${dragActive ? 'border-teal-500 bg-teal-500/10' : 'border-stone-800 bg-stone-950/50 hover:border-stone-700'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <UploadCloud className="mb-2 h-8 w-8 text-stone-500" />
                            <p className="mb-2 text-sm text-stone-400">
                                <span className="font-semibold text-teal-500">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-stone-500">PDF, TXT, or MD (max 10MB)</p>
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.txt,.md"
                                id="file-upload"
                                onChange={(e) => handleImportFile(e.target.files)}
                            />
                            <label htmlFor="file-upload" className="absolute inset-0 cursor-pointer" />
                        </div>

                        <div className="relative mb-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-stone-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-stone-900 px-2 text-stone-500">Or paste text</span>
                            </div>
                        </div>

                        <form onSubmit={handleImport} className="space-y-4">
                            <div>
                                <textarea
                                    name="importText"
                                    placeholder="Paste your conversation with Gemini here. For example: 'Here are 5 grants I found... 1. Org Name...'"
                                    className="mt-1 w-full h-32 rounded bg-stone-950 border border-stone-800 px-3 py-2 text-stone-200 outline-none focus:border-teal-500 font-mono text-sm resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsImportModalOpen(false)} disabled={importing} className="px-4 py-2 text-sm text-stone-400 hover:text-white disabled:opacity-50">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={importing}
                                    className="flex items-center gap-2 rounded bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm text-white hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
                                >
                                    {importing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Parsing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4" />
                                            Parse & Import
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

