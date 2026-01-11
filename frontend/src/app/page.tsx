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
        <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
        <p>Loading Funding Overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-red-500 gap-2">
        <AlertCircle className="h-8 w-8 mb-2" />
        <h3 className="font-bold">Connection Failed</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!stats) return <div className="text-stone-500 text-center p-12">No data available.</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Funding Overview</h1>
          <p className="text-stone-400 mt-1">Track your grants, deadlines, and application status.</p>
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
        <div className="group relative overflow-hidden rounded-xl border border-stone-800 bg-stone-900/50 p-6">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-stone-400">Total Opportunities</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.counts?.opportunities || 0}</h3>
            </div>
            <Banknote className="h-8 w-8 text-emerald-500/80" />
          </div>
          <div className="mt-4 text-xs text-stone-500">
            Total grants tracked in database
          </div>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all" />
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-stone-800 bg-stone-900/50 p-6">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-stone-400">Upcoming Deadlines</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.upcoming_deadlines?.length || 0}</h3>
            </div>
            <Clock className="h-8 w-8 text-amber-500/80" />
          </div>
          <div className="mt-4 text-xs text-stone-500">
            Deadlines in the next 30 days
          </div>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-all" />
        </div>

        <Link href="/funding" className="group relative overflow-hidden rounded-xl border border-stone-800 bg-stone-900/50 p-6 hover:bg-stone-800/80 transition-all hover:border-emerald-500/50">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-stone-400">Quick Action</p>
              <h3 className="text-xl font-bold text-white mt-2">Manage Pipeline</h3>
            </div>
            <ArrowRight className="h-8 w-8 text-stone-600 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="mt-4 text-xs text-stone-500">
            Go to Funding Board
          </div>
        </Link>
      </div>

      {/* Upcoming Deadlines List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          Approaching Deadlines
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
    </div>
  );
}
