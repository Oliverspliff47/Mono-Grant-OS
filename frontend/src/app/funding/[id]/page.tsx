"use client";

import { useEffect, useState, use } from "react";
import { updateApplication, getApplication, ApplicationPackage } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Send, CheckCircle2, FileText, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [app, setApp] = useState<ApplicationPackage | null>(null);
    const [narrative, setNarrative] = useState("");
    const [budgetJson, setBudgetJson] = useState("{}");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const data = await getApplication(id);
                if (data) {
                    setApp(data);
                    setNarrative(data.narrative_draft || "");
                    setBudgetJson(data.budget_json ? JSON.stringify(data.budget_json, null, 2) : "{\n  \"personnel\": 0,\n  \"equipment\": 0,\n  \"travel\": 0,\n  \"other\": 0\n}");
                }
            } catch (e) { console.error(e) }
            setLoading(false);
        }
        load();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            let parsedBudget = {};
            try {
                parsedBudget = JSON.parse(budgetJson);
            } catch {
                alert("Invalid JSON in budget field");
                setSaving(false);
                return;
            }
            const updated = await updateApplication(id, {
                narrative_draft: narrative,
                budget_json: parsedBudget
            });
            setApp(updated);
        } catch {
            alert("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        if (!confirm("Submit this application for approval?")) return;
        setSaving(true);
        try {
            const updated = await updateApplication(id, { submission_status: "Approved" });
            setApp(updated);
        } catch {
            alert("Failed to submit");
        } finally {
            setSaving(false);
        }
    };

    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
        "Draft": { color: "bg-stone-800 text-stone-400", icon: <FileText className="h-3.5 w-3.5" /> },
        "Approved": { color: "bg-emerald-500/10 text-emerald-400", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
        "Submitted": { color: "bg-indigo-500/10 text-indigo-400", icon: <Send className="h-3.5 w-3.5" /> },
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }
    if (!app) return <div className="text-red-500 text-center py-12">Application not found</div>;

    const status = statusConfig[app.submission_status] || statusConfig["Draft"];

    return (
        <div className="flex h-full flex-col space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/funding" className="text-stone-500 hover:text-white transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Application Draft</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className={cn(
                                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                                status.color
                            )}>
                                {status.icon}
                                {app.submission_status}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saving || app.submission_status !== "Draft"}
                        className="flex items-center gap-2 rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-stone-200 hover:bg-stone-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Draft
                    </button>
                    {app.submission_status === "Draft" && (
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                            Submit for Approval
                        </button>
                    )}
                </div>
            </div>

            {/* Editor Panels */}
            <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Narrative Panel */}
                <div className="flex flex-col rounded-xl border border-stone-800 bg-stone-900 overflow-hidden">
                    <div className="bg-stone-950 px-4 py-3 border-b border-stone-800 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-stone-500" />
                        <span className="text-sm font-medium text-stone-300">Narrative Draft</span>
                    </div>
                    <textarea
                        className="flex-1 bg-transparent p-4 text-stone-200 resize-none focus:outline-none font-serif leading-relaxed disabled:opacity-50"
                        value={narrative}
                        onChange={(e) => setNarrative(e.target.value)}
                        placeholder="Start writing your application narrative...

Include:
• Project description
• Goals and objectives
• Expected outcomes
• Timeline"
                        disabled={app.submission_status !== "Draft"}
                    />
                </div>

                {/* Budget Panel */}
                <div className="flex flex-col rounded-xl border border-stone-800 bg-stone-900 overflow-hidden">
                    <div className="bg-stone-950 px-4 py-3 border-b border-stone-800 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-stone-500" />
                        <span className="text-sm font-medium text-stone-300">Budget (JSON)</span>
                    </div>
                    <textarea
                        className="flex-1 bg-transparent p-4 text-stone-200 resize-none focus:outline-none font-mono text-sm leading-relaxed disabled:opacity-50"
                        value={budgetJson}
                        onChange={(e) => setBudgetJson(e.target.value)}
                        placeholder='{\n  "personnel": 0,\n  "equipment": 0,\n  "travel": 0,\n  "other": 0\n}'
                        disabled={app.submission_status !== "Draft"}
                    />
                </div>
            </div>
        </div>
    );
}

