"use client";

import { useEffect, useState, use } from "react";
import { getProject, getSections, createSection, Project, Section } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Plus, Lock, FileText, Calendar, Archive, Clock, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<Project | null>(null);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState("");

    useEffect(() => {
        Promise.all([getProject(id), getSections(id)]).then(([proj, secs]) => {
            setProject(proj);
            setSections(secs);
            setLoading(false);
        });
    }, [id]);

    const handleAddSection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newSectionTitle.trim()) {
            const newSection = await createSection(id, newSectionTitle);
            setSections([...sections, newSection]);
            setNewSectionTitle("");
            setIsModalOpen(false);
        }
    };

    const statusColors: Record<string, string> = {
        "Draft": "bg-stone-800 text-stone-400",
        "Review": "bg-amber-500/10 text-amber-400",
        "Locked": "bg-emerald-500/10 text-emerald-500",
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }
    if (!project) return <div className="text-red-500 text-center py-12">Project not found</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/projects" className="text-stone-500 hover:text-white transition-colors">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight text-white">{project.title}</h1>
                    <div className="flex items-center gap-4 mt-1 text-sm text-stone-500">
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs",
                            project.status === "In Progress" ? "bg-amber-500/10 text-amber-400" :
                                project.status === "Completed" ? "bg-emerald-500/10 text-emerald-400" :
                                    "bg-blue-500/10 text-blue-400"
                        )}>{project.status}</span>
                        {project.start_date && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                Started: {new Date(project.start_date).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
                <Link
                    href={`/projects/${id}/archives`}
                    className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-900/50 px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 transition-colors"
                >
                    <Archive className="h-4 w-4" />
                    View Archives
                </Link>
            </div>

            {/* Sections */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Sections</h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        New Section
                    </button>
                </div>

                <div className="rounded-xl border border-stone-800 bg-stone-900/50 overflow-hidden">
                    {sections.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText className="h-12 w-12 text-stone-700 mx-auto mb-4" />
                            <p className="text-stone-500">No sections yet. Create your first section to get started.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-800">
                            {sections.map((section, index) => (
                                <Link
                                    key={section.id}
                                    href={`/sections/${section.id}`}
                                    className="flex items-center justify-between p-4 hover:bg-stone-900/80 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-stone-600 text-sm font-mono w-6">{String(index + 1).padStart(2, '0')}</span>
                                        <div>
                                            <h3 className="font-medium text-stone-200 group-hover:text-white">{section.title}</h3>
                                            <p className="text-xs text-stone-500 flex items-center gap-2">
                                                <Clock className="h-3 w-3" />
                                                Version {section.version}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                                            statusColors[section.status] || statusColors["Draft"]
                                        )}>
                                            {section.status === "Locked" && <Lock className="h-3 w-3" />}
                                            {section.status === "Review" && <Send className="h-3 w-3" />}
                                            {section.status}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Section Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-xl border border-stone-800 bg-stone-900 p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-4">Create New Section</h2>
                        <form onSubmit={handleAddSection} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-400 mb-1">Section Title</label>
                                <input
                                    value={newSectionTitle}
                                    onChange={(e) => setNewSectionTitle(e.target.value)}
                                    placeholder="e.g., Introduction, Chapter 1, Credits..."
                                    required
                                    className="w-full rounded bg-stone-950 border border-stone-800 px-3 py-2 text-stone-200 outline-none focus:border-indigo-500"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-stone-400 hover:text-white">Cancel</button>
                                <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500">Create Section</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

