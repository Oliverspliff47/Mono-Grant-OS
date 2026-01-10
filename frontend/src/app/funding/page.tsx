"use client";

import { useEffect, useState } from "react";
import { getOpportunities, createOpportunity, createApplication, Opportunity } from "@/lib/api";
import { Plus, Calendar, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FundingPage() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        getOpportunities().then((data) => {
            setOpportunities(data);
            setLoading(false);
        });
    }, []);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            const newOpp = await createOpportunity({
                funder_name: formData.get("funder") as string,
                programme_name: formData.get("programme") as string,
                deadline: formData.get("deadline") as string,
            });
            setOpportunities([...opportunities, newOpp]);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to create opportunity", error);
        }
    };

    const handleStartApplication = async (oppId: string) => {
        try {
            const app = await createApplication(oppId);
            router.push(`/funding/${app.id}`);
        } catch {
            alert("Failed to start application (or one already exists!)");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Funding Pipeline</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Add Opportunity
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {opportunities.map((opp) => (
                    <div key={opp.id} className="relative rounded-xl border border-stone-800 bg-stone-900/50 p-6 flex flex-col justify-between hover:border-indigo-500/50 transition-colors group">
                        <div>
                            <h3 className="text-lg font-semibold text-white">{opp.programme_name}</h3>
                            <p className="text-sm text-stone-400">{opp.funder_name}</p>

                            <div className="mt-4 flex items-center gap-2 text-sm text-stone-500">
                                <Calendar className="h-4 w-4" />
                                <span>Deadline: {new Date(opp.deadline).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <span className="rounded-full bg-stone-800 px-2.5 py-0.5 text-xs text-stone-400">
                                {opp.status}
                            </span>
                            <button
                                onClick={() => handleStartApplication(opp.id)}
                                className="flex items-center gap-1 text-sm font-medium text-indigo-400 hover:text-indigo-300"
                            >
                                Start Draft <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {opportunities.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-stone-500 border border-dashed border-stone-800 rounded-xl">
                        No funding opportunities tracked yet.
                    </div>
                )}
            </div>

            {/* Simple Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-xl border border-stone-800 bg-stone-900 p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-4">Track New Opportunity</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-400">Funder Name</label>
                                <input name="funder" required className="mt-1 w-full rounded bg-stone-950 border border-stone-800 px-3 py-2 text-stone-200 outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-400">Programme Name</label>
                                <input name="programme" required className="mt-1 w-full rounded bg-stone-950 border border-stone-800 px-3 py-2 text-stone-200 outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-400">Deadline</label>
                                <input name="deadline" type="date" required className="mt-1 w-full rounded bg-stone-950 border border-stone-800 px-3 py-2 text-stone-200 outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-stone-400 hover:text-white">Cancel</button>
                                <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500">Add Opportunity</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
