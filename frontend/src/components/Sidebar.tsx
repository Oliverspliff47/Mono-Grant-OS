"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FolderOpen, Archive, Banknote, Settings, Printer, Layers } from "lucide-react";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: FolderOpen },
    { name: "Editorial", href: "/editorial", icon: Layers },
    { name: "Archives", href: "/archives", icon: Archive },
    { name: "Funding", href: "/funding", icon: Banknote },
    { name: "Production", href: "/production", icon: Printer },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-64 flex-col justify-between border-r border-stone-800 bg-stone-950 px-4 py-8 text-stone-100">
            <div>
                <div className="mb-8 flex items-center gap-2 px-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 font-bold text-white">
                        M
                    </div>
                    <span className="text-xl font-bold tracking-tight">Mono-Grant OS</span>
                </div>
                <nav className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-stone-900 text-indigo-400"
                                        : "text-stone-400 hover:bg-stone-900 hover:text-stone-200"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200",
                                        isActive ? "text-indigo-400" : "text-stone-500 group-hover:text-stone-300"
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="px-2">
                <div className="rounded-lg bg-stone-900 p-4">
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">System Status</p>
                    <div className="flex items-center gap-2 text-xs text-emerald-500">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Agent Active
                    </div>
                </div>
            </div>
        </div>
    );
}
