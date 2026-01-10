"use client";

import { useEffect, useState } from "react";
import { getDashboardStats, DashboardStats } from "@/lib/api";
import Link from "next/link";
import {
  Folder,
  Banknote,
  Database,
  ArrowRight,
  Clock,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then((data) => setStats(data as DashboardStats))
      .catch((e) => setError(e instanceof Error ? e.message : "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-stone-500 gap-4">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
        <p>Loading Studio Overview...</p>
      </div>
    );
  }

  if (error) return <div className="text-red-500 text-center p-12">Error: {error}</div>;
  if (!stats) return <div className="text-stone-500 text-center p-12">No data available.</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Studio Overview</h1>
          <p className="text-stone-400 mt-1">Welcome back. Here is what is happening across your projects.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            System Nominal
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/projects" className="group relative overflow-hidden rounded-xl border border-stone-800 bg-stone-900/50 p-6 hover:bg-stone-800/80 transition-all hover:border-indigo-500/50">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-stone-400">Total Projects</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.counts.projects}</h3>
            </div>
            <Folder className="h-8 w-8 text-indigo-500/80" />
          </div>
          <div className="mt-4 flex items-center text-xs text-stone-500 group-hover:text-indigo-400 transition-colors">
            View all projects <ArrowRight className="ml-1 h-3 w-3" />
          </div>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl group-hover:bg-indigo-500/20 transition-all" />
        </Link>

        <Link href="/funding" className="group relative overflow-hidden rounded-xl border border-stone-800 bg-stone-900/50 p-6 hover:bg-stone-800/80 transition-all hover:border-emerald-500/50">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-stone-400">Active Grants</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.counts.opportunities}</h3>
            </div>
            <Banknote className="h-8 w-8 text-emerald-500/80" />
          </div>
          <div className="mt-4 flex items-center text-xs text-stone-500 group-hover:text-emerald-400 transition-colors">
            View funding pipeline <ArrowRight className="ml-1 h-3 w-3" />
          </div>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all" />
        </Link>

        <div className="group relative overflow-hidden rounded-xl border border-stone-800 bg-stone-900/50 p-6">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-stone-400">Total Assets</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.counts.assets}</h3>
            </div>
            <Database className="h-8 w-8 text-amber-500/80" />
          </div>
          <div className="mt-4 text-xs text-stone-500">
            Indexed across all projects
          </div>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Work */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-stone-400" />
            Recent Activity
          </h2>
          <div className="rounded-xl border border-stone-800 bg-stone-900/30 divide-y divide-stone-800/50">
            {stats.recent_projects?.map((proj) => (
              <Link href={`/projects/${proj.id}`} key={proj.id} className="flex items-center justify-between p-4 hover:bg-stone-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Folder className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-stone-200">{proj.title}</h4>
                    <p className="text-xs text-stone-500">Updated {proj.updated_at ? new Date(proj.updated_at).toLocaleDateString() : "recently"}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded text-xs",
                  proj.status === "Planning" ? "bg-blue-500/10 text-blue-400" :
                    proj.status === "In Progress" ? "bg-amber-500/10 text-amber-400" :
                      "bg-stone-800 text-stone-400"
                )}>{proj.status}</span>
              </Link>
            ))}
            {(!stats.recent_projects || stats.recent_projects.length === 0) && (
              <div className="p-8 text-center text-sm text-stone-500">No active projects</div>
            )}
          </div>
        </div>

        {/* Right Column: Funding & Assets */}
        <div className="space-y-8">
          {/* Upcoming Deadlines */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              Upcoming Deadlines
            </h2>
            <div className="rounded-xl border border-stone-800 bg-stone-900/30 divide-y divide-stone-800/50">
              {stats.upcoming_deadlines?.map((opp) => (
                <div key={opp.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium text-stone-200">{opp.programme_name}</div>
                    <div className="text-xs text-stone-500">{opp.funder_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-400">{new Date(opp.deadline).toLocaleDateString()}</div>
                    <div className="text-[10px] text-stone-600 uppercase tracking-wider">Due Date</div>
                  </div>
                </div>
              ))}
              {(!stats.upcoming_deadlines || stats.upcoming_deadlines.length === 0) && (
                <div className="p-6 text-center text-sm text-stone-500">No upcoming deadlines</div>
              )}
            </div>
          </div>

          {/* Recent Assets */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-stone-400" />
              Latest Assets
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {stats.recent_assets?.map((asset) => (
                <div key={asset.id} className="aspect-square rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center relative group" title={asset.file_path}>
                  {asset.type === "Photo" ? <ImageIcon className="h-6 w-6 text-stone-500" /> : <FileText className="h-6 w-6 text-stone-500" />}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <span className="text-[10px] text-white px-1 text-center truncate w-full">{asset.type}</span>
                  </div>
                </div>
              ))}
              {(!stats.recent_assets || stats.recent_assets.length === 0) && (
                <div className="col-span-4 p-4 text-center text-sm text-stone-500 border border-dashed border-stone-800 rounded-lg">
                  No recent assets
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
