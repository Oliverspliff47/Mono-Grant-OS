"use client";

import { useEffect, useState } from "react";
import { getProjects, createProject, Project } from "@/lib/api";
import { Plus, Folder, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        getProjects().then((data) => {
            setProjects(data);
            setLoading(false);
        });
    }, []);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            const newProject = await createProject({
                title: formData.get("title") as string,
                start_date: (formData.get("start_date") as string) || undefined,
            });
            setProjects([...projects, newProject]);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to create project", error);
        }
    };

    const statusColors: Record<string, string> = {
        "Planning": "bg-blue-500/10 text-blue-400 border-blue-500/20",
        "In Progress": "bg-amber-500/10 text-amber-400 border-amber-500/20",
        "Review": "bg-purple-500/10 text-purple-400 border-purple-500/20",
        "Completed": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Projects</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    New Project
                </button>
            </div>

            {loading && (
                <div className="flex justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((proj) => (
                    <Link
                        href={`/projects/${proj.id}`}
                        key={proj.id}
                        className="relative rounded-xl border border-stone-800 bg-stone-900/50 p-6 flex flex-col justify-between hover:border-indigo-500/50 transition-colors group"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                    <Folder className="h-5 w-5 text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">{proj.title}</h3>
                            </div>
                            <p className="text-sm text-stone-500">
                                Started: {proj.start_date ? new Date(proj.start_date).toLocaleDateString() : "Not set"}
                            </p>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <span className={cn(
                                "rounded-full px-2.5 py-0.5 text-xs border",
                                statusColors[proj.status] || "bg-stone-800 text-stone-400"
                            )}>
                                {proj.status}
                            </span>
                            <span className="flex items-center gap-1 text-sm font-medium text-stone-500 group-hover:text-indigo-400 transition-colors">
                                Open <ArrowRight className="h-4 w-4" />
                            </span>
                        </div>
                    </Link>
                ))}
                {projects.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-stone-500 border border-dashed border-stone-800 rounded-xl">
                        No projects created yet. Click &quot;New Project&quot; to get started.
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-xl border border-stone-800 bg-stone-900 p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-4">Create New Project</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-400">Project Title</label>
                                <input name="title" required className="mt-1 w-full rounded bg-stone-950 border border-stone-800 px-3 py-2 text-stone-200 outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-400">Start Date (Optional)</label>
                                <input name="start_date" type="date" className="mt-1 w-full rounded bg-stone-950 border border-stone-800 px-3 py-2 text-stone-200 outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-stone-400 hover:text-white">Cancel</button>
                                <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500">Create Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
