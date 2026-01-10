"use client";

import { useEffect, useState } from "react";
import { getProjects, Project } from "@/lib/api";
import { Printer, CheckCircle2, Clock, AlertTriangle, Folder } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ProductionPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getProjects().then((data) => {
            // Filter to projects that are in Review or Completed status
            const productionProjects = data.filter(
                (p: Project) => p.status === "Review" || p.status === "Completed"
            );
            setProjects(productionProjects);
            setLoading(false);
        });
    }, []);

    const isDeadlineNear = (deadline: string | null) => {
        if (!deadline) return false;
        const daysUntil = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 7 && daysUntil >= 0;
    };

    const isOverdue = (deadline: string | null) => {
        if (!deadline) return false;
        return new Date(deadline).getTime() < Date.now();
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Production</h1>
                <p className="text-stone-400 mt-1">
                    Track projects moving through final production stages.
                </p>
            </div>

            {loading && (
                <div className="flex justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
                </div>
            )}

            {/* Pipeline Stages */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* In Review */}
                <div className="space-y-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-400">
                        <Clock className="h-5 w-5" />
                        In Review
                    </h2>
                    <div className="space-y-3">
                        {projects.filter((p) => p.status === "Review").map((project) => (
                            <Link
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="block rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 hover:bg-amber-500/10 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Folder className="h-5 w-5 text-amber-400" />
                                        <span className="font-medium text-white">{project.title}</span>
                                    </div>
                                    {project.print_deadline && (
                                        <span className={cn(
                                            "flex items-center gap-1 text-xs",
                                            isOverdue(project.print_deadline) ? "text-red-400" :
                                                isDeadlineNear(project.print_deadline) ? "text-amber-400" :
                                                    "text-stone-500"
                                        )}>
                                            {isOverdue(project.print_deadline) && <AlertTriangle className="h-3 w-3" />}
                                            {new Date(project.print_deadline).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                        {projects.filter((p) => p.status === "Review").length === 0 && !loading && (
                            <div className="rounded-xl border border-dashed border-stone-800 py-8 text-center text-stone-500 text-sm">
                                No projects in review
                            </div>
                        )}
                    </div>
                </div>

                {/* Completed */}
                <div className="space-y-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" />
                        Completed
                    </h2>
                    <div className="space-y-3">
                        {projects.filter((p) => p.status === "Completed").map((project) => (
                            <Link
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="block rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 hover:bg-emerald-500/10 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Folder className="h-5 w-5 text-emerald-400" />
                                    <span className="font-medium text-white">{project.title}</span>
                                </div>
                            </Link>
                        ))}
                        {projects.filter((p) => p.status === "Completed").length === 0 && !loading && (
                            <div className="rounded-xl border border-dashed border-stone-800 py-8 text-center text-stone-500 text-sm">
                                No completed projects
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Print Checklist */}
            <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-6">
                <h3 className="flex items-center gap-2 font-semibold text-white mb-4">
                    <Printer className="h-5 w-5 text-stone-400" />
                    Pre-Print Checklist
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <label className="flex items-center gap-3 text-stone-300">
                        <input type="checkbox" className="rounded border-stone-700 bg-stone-900" />
                        All sections approved and locked
                    </label>
                    <label className="flex items-center gap-3 text-stone-300">
                        <input type="checkbox" className="rounded border-stone-700 bg-stone-900" />
                        Asset rights cleared
                    </label>
                    <label className="flex items-center gap-3 text-stone-300">
                        <input type="checkbox" className="rounded border-stone-700 bg-stone-900" />
                        Final proofreading complete
                    </label>
                    <label className="flex items-center gap-3 text-stone-300">
                        <input type="checkbox" className="rounded border-stone-700 bg-stone-900" />
                        Export to print format
                    </label>
                </div>
            </div>
        </div>
    );
}

