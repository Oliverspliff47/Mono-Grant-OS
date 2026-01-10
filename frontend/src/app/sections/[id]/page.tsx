"use client";

import { useEffect, useState, use } from "react";
import { getSection, updateSection, lockSection, reviewSection, Section } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Save, Lock, Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SectionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [section, setSection] = useState<Section | null>(null);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reviewing, setReviewing] = useState(false);
    const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

    useEffect(() => {
        getSection(id).then((s) => {
            setSection(s);
            setContent(s?.content_text || "");
            setLoading(false);
        });
    }, [id]);

    const handleSave = async () => {
        if (!section) return;
        setSaving(true);
        try {
            const updated = await updateSection(section.id, content);
            setSection(updated);
            // Maybe toast success
        } catch {
            alert("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleLock = async () => {
        if (!section) return;
        setError(null);
        try {
            const locked = await lockSection(section.id);
            setSection(locked);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Unknown error");
        }
    };

    const handleReview = async () => {
        if (!section) return;
        setReviewing(true);
        setReviewFeedback(null);
        try {
            const feedback = await reviewSection(section.id);
            setReviewFeedback(feedback);
        } catch (e: unknown) {
            setError("Review failed: " + (e instanceof Error ? e.message : "Unknown error"));
        } finally {
            setReviewing(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!section) return <div>Section not found</div>;

    return (
        <div className="flex h-full flex-col space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/projects/${section.project_id}`} className="text-stone-500 hover:text-white transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{section.title}</h1>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-medium border",
                                section.status === "Locked" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-stone-800 text-stone-400 border-stone-700"
                            )}>{section.status}</span>
                            <span className="text-xs text-stone-500">v{section.version}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleReview}
                        disabled={reviewing || section.status === "Locked"}
                        className="flex items-center gap-2 rounded-md bg-purple-600/10 border border-purple-500/20 px-4 py-2 text-sm font-medium text-purple-400 hover:bg-purple-600/20 disabled:opacity-50 transition-colors"
                        title="AI Critique"
                    >
                        {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                        AI Review
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || section.status === "Locked"}
                        className="flex items-center gap-2 rounded-md bg-stone-100 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-white transition-colors disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        Save Draft
                    </button>
                    <button
                        onClick={handleLock}
                        disabled={section.status === "Locked"}
                        className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:bg-stone-800 disabled:text-stone-500"
                    >
                        <Lock className="h-4 w-4" />
                        {section.status === "Locked" ? "Locked" : "Lock Version"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-500">
                    {error}
                </div>
            )}

            <div className="flex-1 flex gap-4 min-h-0">
                <textarea
                    className="flex-1 rounded-xl border border-stone-800 bg-stone-900 p-6 text-lg text-stone-200 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-serif leading-relaxed"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start writing..."
                    disabled={section.status === "Locked"}
                />

                {reviewFeedback && (
                    <div className="w-1/3 rounded-xl border border-purple-500/20 bg-purple-900/10 p-6 overflow-y-auto">
                        <h3 className="text-sm font-bold text-purple-400 mb-4 flex items-center gap-2">
                            <Bot className="h-4 w-4" /> AI Feedback
                        </h3>
                        <div className="prose prose-invert prose-sm text-stone-300 whitespace-pre-wrap">
                            {reviewFeedback}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
