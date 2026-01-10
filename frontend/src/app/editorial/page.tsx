"use client";

import { useEffect, useState } from "react";
import { getProjects, getSections, approveSection, rejectSection, Project, Section } from "@/lib/api";
import { FileText, CheckCircle, XCircle, Send, Loader2, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SectionWithProject extends Section {
    projectTitle: string;
}

export default function EditorialPage() {
    const [reviewQueue, setReviewQueue] = useState<SectionWithProject[]>([]);
    const [allSections, setAllSections] = useState<SectionWithProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const projects = await getProjects();
                const sectionsPromises = projects.map(async (proj: Project) => {
                    const sections = await getSections(proj.id);
                    return sections.map((s: Section) => ({ ...s, projectTitle: proj.title }));
                });
                const sectionsArrays = await Promise.all(sectionsPromises);
                const allSecs = sectionsArrays.flat();
                setAllSections(allSecs);
                setReviewQueue(allSecs.filter((s: SectionWithProject) => s.status === "Review"));
            } catch (e) {
                console.error("Failed to load editorial data", e);
            }
            setLoading(false);
        }
        loadData();
    }, []);

    const handleApprove = async (sectionId: string) => {
        setProcessingId(sectionId);
        try {
            await approveSection(sectionId);
            setReviewQueue((prev) => prev.filter((s) => s.id !== sectionId));
        } catch {
            alert("Failed to approve section");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (sectionId: string) => {
        setProcessingId(sectionId);
        try {
            await rejectSection(sectionId);
            setReviewQueue((prev) => prev.filter((s) => s.id !== sectionId));
        } catch {
            alert("Failed to reject section");
        } finally {
            setProcessingId(null);
        }
    };

    const draftCount = allSections.filter((s) => s.status === "Draft").length;
    const lockedCount = allSections.filter((s) => s.status === "Locked").length;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Editorial</h1>
                <p className="text-stone-400 mt-1">
                    Review and approve sections submitted for editorial review.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-4">
                    <div className="flex items-center gap-2 text-stone-500 text-sm mb-1">
                        <FileText className="h-4 w-4" />
                        Drafts
                    </div>
                    <p className="text-2xl font-bold text-white">{draftCount}</p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="flex items-center gap-2 text-amber-400 text-sm mb-1">
                        <Send className="h-4 w-4" />
                        Pending Review
                    </div>
                    <p className="text-2xl font-bold text-amber-400">{reviewQueue.length}</p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
                        <CheckCircle className="h-4 w-4" />
                        Locked
                    </div>
                    <p className="text-2xl font-bold text-emerald-400">{lockedCount}</p>
                </div>
            </div>

            {/* Review Queue */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-stone-400" />
                    Review Queue
                </h2>

                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
                    </div>
                )}

                {!loading && reviewQueue.length === 0 && (
                    <div className="rounded-xl border border-dashed border-stone-800 bg-stone-900/20 py-12 text-center text-stone-500">
                        No sections pending review. All clear! 🎉
                    </div>
                )}

                <div className="space-y-3">
                    {reviewQueue.map((section) => (
                        <div
                            key={section.id}
                            className="rounded-xl border border-stone-800 bg-stone-900/50 p-4 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                    <Send className="h-5 w-5 text-amber-400" />
                                </div>
                                <div>
                                    <Link
                                        href={`/sections/${section.id}`}
                                        className="font-semibold text-white hover:text-indigo-400 transition-colors"
                                    >
                                        {section.title}
                                    </Link>
                                    <p className="text-xs text-stone-500">
                                        From: {section.projectTitle} • Version {section.version}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleReject(section.id)}
                                    disabled={processingId === section.id}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50",
                                        processingId === section.id && "cursor-not-allowed"
                                    )}
                                >
                                    {processingId === section.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <XCircle className="h-3.5 w-3.5" />
                                    )}
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleApprove(section.id)}
                                    disabled={processingId === section.id}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500 transition-colors disabled:opacity-50",
                                        processingId === section.id && "cursor-not-allowed"
                                    )}
                                >
                                    {processingId === section.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <CheckCircle className="h-3.5 w-3.5" />
                                    )}
                                    Approve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

