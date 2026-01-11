"use client";

import { useEffect, useState, use } from "react";
import { updateApplication, getApplication, ApplicationPackage } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Send, CheckCircle2, FileText, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [app, setApp] = useState<(ApplicationPackage & { opportunity?: any }) | null>(null);
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
                        <h1 className="text-2xl font-bold text-white">{app.opportunity?.programme_name || "Application Draft"}</h1>
                        <p className="text-sm text-stone-400">{app.opportunity?.funder_name}</p>
                        <div className="flex items-center gap-3 mt-2">
                            <span className={cn(
                                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                                status.color
                            )}>
                                {status.icon}
                                {app.submission_status}
                            </span>
                            {app.opportunity?.deadline && (
                                <span className={cn(
                                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border",
                                    new Date(app.opportunity.deadline) < new Date() ? "border-red-500/50 text-red-500" :
                                        new Date(app.opportunity.deadline) < new Date(Date.now() + 7 * 86400000) ? "border-amber-500/50 text-amber-500" :
                                            "border-stone-700 text-stone-400"
                                )}>
                                    Due: {new Date(app.opportunity.deadline).toLocaleDateString()}
                                </span>
                            )}
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
                    <div className="bg-stone-950 px-4 py-3 border-b border-stone-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-stone-500" />
                            <span className="text-sm font-medium text-stone-300">Budget Builder</span>
                        </div>
                        <span className="text-xs font-mono text-stone-500">
                            Total: ${Object.values(JSON.parse(budgetJson || "{}") as Record<string, any>).reduce((a: any, b: any) => a + (Number(b) || 0), 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                        {["personnel", "equipment", "travel", "other"].map((category) => {
                            const currentBudget = JSON.parse(budgetJson || "{}");
                            return (
                                <div key={category} className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">{category}</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
                                        <input
                                            type="number"
                                            className="w-full bg-stone-950 border border-stone-800 rounded-md py-2 pl-7 pr-3 text-sm text-stone-200 focus:outline-none focus:border-stone-600 disabled:opacity-50"
                                            value={currentBudget[category] || ""}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                const newBudget = { ...currentBudget, [category]: val };
                                                setBudgetJson(JSON.stringify(newBudget));
                                            }}
                                            disabled={app.submission_status !== "Draft"}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

