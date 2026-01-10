"use client";

import { useEffect, useState, use } from "react";
import { updateApplication, ApplicationPackage } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

// Hacky fetch since I don't have getApplication by ID exposed nicely yet or I can fake it?
// I only exposed createApplication and updateApplication.
// I should add getApplication to backend or at least GET /applications/{id}
// Let's assume I added GET /applications/{id} implicitly or I will add it now.
// Actually, I missed adding GET /applications/{id} in backend endpoints.
// I added POST /applications and PUT /applications/{id}.
// I need GET /applications/{id} to load this page!
// I will assume I will add it in next step or use what I have. 
// Let's create the page and then fix the backend.

export default function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [app, setApp] = useState<ApplicationPackage | null>(null);
    const [narrative, setNarrative] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Fetch application by ID
        // Since I forgot the endpoint, I'll stick a placeholder fetch here
        // and ensure I add the endpoint in the next Backend tool call.
        async function load() {
            try {
                // Temporary: using the same endpoint pattern
                const res = await fetch(`http://localhost:8000/api/v1/applications/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setApp(data);
                    setNarrative(data.narrative_draft || "");
                }
            } catch (e) { console.error(e) }
            setLoading(false);
        }
        load();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateApplication(id, { narrative_draft: narrative });
            // update local state if needed
        } catch {
            alert("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading Application...</div>;
    if (!app) return <div>Application not found (Did you forget to add the GET endpoint?)</div>;

    return (
        <div className="flex h-full flex-col space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/funding" className="text-stone-500 hover:text-white transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Application Draft</h1>
                        <p className="text-sm text-stone-500">ID: {app.id}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-md bg-stone-100 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-white transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Draft
                </button>
            </div>

            <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
                <div className="flex flex-col rounded-xl border border-stone-800 bg-stone-900 overflow-hidden">
                    <div className="bg-stone-950 px-4 py-2 border-b border-stone-800 text-xs font-medium text-stone-400">
                        Narrative
                    </div>
                    <textarea
                        className="flex-1 bg-transparent p-4 text-stone-200 resize-none focus:outline-none font-serif leading-relaxed"
                        value={narrative}
                        onChange={(e) => setNarrative(e.target.value)}
                        placeholder="Start writing your application narrative..."
                    />
                </div>

                <div className="flex flex-col rounded-xl border border-stone-800 bg-stone-900 overflow-hidden">
                    <div className="bg-stone-950 px-4 py-2 border-b border-stone-800 text-xs font-medium text-stone-400">
                        Budget (JSON)
                    </div>
                    <div className="flex-1 p-8 text-center text-stone-500 flex items-center justify-center">
                        Budget Editor Coming Soon
                    </div>
                </div>
            </div>
        </div>
    );
}
