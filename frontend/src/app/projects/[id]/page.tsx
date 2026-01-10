"use client";

import { useEffect, useState, use } from "react";
import { getProject, getSections, createSection, Project, Section } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Plus, Lock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<Project | null>(null);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getProject(id), getSections(id)]).then(([proj, secs]) => {
            setProject(proj);
            setSections(secs);
            setLoading(false);
        });
    }, [id]);

    const handleAddSection = async () => {
        const title = prompt("Enter section title:");
        if (title) {
            const newSection = await createSection(id, title);
            setSections([...sections, newSection]);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!project) return <div>Project not found</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/" className="text-stone-500 hover:text-white transition-colors">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">{project.title}</h1>
                    <p className="text-stone-500">Status: <span className="text-indigo-400">{project.status}</span></p>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Sections</h2>
                <button
                    onClick={handleAddSection}
                    className="flex items-center gap-2 rounded-md bg-stone-800 px-3 py-1.5 text-sm font-medium text-stone-200 hover:bg-stone-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Add Section
                </button>
            </div>

            <div className="rounded-xl border border-stone-800 bg-stone-900/50 overflow-hidden">
                {sections.length === 0 ? (
                    <div className="p-8 text-center text-stone-500">No sections yet.</div>
                ) : (
                    <div className="divide-y divide-stone-800">
                        {sections.map((section) => (
                            <Link
                                key={section.id}
                                href={`/sections/${section.id}`}
                                className="flex items-center justify-between p-4 hover:bg-stone-900/80 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-stone-600 group-hover:text-indigo-400" />
                                    <div>
                                        <h3 className="font-medium text-stone-200 group-hover:text-white">{section.title}</h3>
                                        <p className="text-xs text-stone-500">Version {section.version}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                                        section.status === "Locked" ? "bg-emerald-500/10 text-emerald-500" : "bg-stone-800 text-stone-400"
                                    )}>
                                        {section.status === "Locked" && <Lock className="h-3 w-3" />}
                                        {section.status}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
