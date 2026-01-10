"use client";

import { useEffect, useState } from "react";
import { getProjects, Project } from "@/lib/api";
import { FileText, Folder } from "lucide-react";
import Link from "next/link";

export default function EditorialPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getProjects().then((data) => {
            setProjects(data);
            setLoading(false);
        });
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Editorial</h1>
            </div>
            <p className="text-stone-400">
                Manage the editorial workflow for your project sections. Select a project to view its sections.
            </p>

            {loading && (
                <div className="flex justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((proj) => (
                    <Link
                        href={`/projects/${proj.id}`}
                        key={proj.id}
                        className="rounded-xl border border-stone-800 bg-stone-900/50 p-6 hover:border-indigo-500/50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">{proj.title}</h3>
                                <p className="text-xs text-stone-500">{proj.status}</p>
                            </div>
                        </div>
                    </Link>
                ))}
                {projects.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-stone-500 border border-dashed border-stone-800 rounded-xl">
                        No projects available for editorial workflow.
                    </div>
                )}
            </div>
        </div>
    );
}
