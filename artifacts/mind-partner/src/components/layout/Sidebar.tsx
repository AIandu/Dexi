import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Send,
  Users,
  MessageSquare,
  TerminalSquare
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/outreach", label: "Outreach", icon: Send },
    { href: "/contacts", label: "Contacts", icon: Users },
    { href: "/chat", label: "Global Chat", icon: MessageSquare },
  ];

  return (
    <aside className="w-64 flex flex-col h-full border-r border-sidebar-border bg-sidebar shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-primary/20 p-1.5 rounded-md border border-primary/30">
            <TerminalSquare className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold tracking-tight text-lg glow-text">MindPartner</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {links.map((link) => {
          const isActive = link.href === "/" ? location === "/" : location.startsWith(link.href);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 text-sm font-medium",
                isActive
                  ? "bg-sidebar-accent text-primary shadow-[inset_2px_0_0_0_hsl(var(--primary))] bg-gradient-to-r from-primary/10 to-transparent"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-black/30 border border-white/5 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-500">SYSTEM ONLINE</span>
          </div>
          <p className="text-xs text-muted-foreground">Dexi is actively monitoring your projects.</p>
        </div>
      </div>
    </aside>
  );
}
