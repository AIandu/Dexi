import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Send,
  Users,
  MessageSquare,
  TerminalSquare,
  X
} from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/outreach", label: "Outreach", icon: Send },
    { href: "/contacts", label: "Contacts", icon: Users },
    { href: "/chat", label: "Global Chat", icon: MessageSquare },
  ];

  return (
    <aside className="w-72 flex flex-col h-full border-r border-sidebar-border bg-sidebar shrink-0">
      <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3" onClick={onClose}>
          <div className="bg-primary/20 p-1.5 rounded-md border border-primary/30">
            <TerminalSquare className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold tracking-tight text-lg glow-text">MindPartner</span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {links.map((link) => {
          const isActive = link.href === "/" ? location === "/" : location.startsWith(link.href);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 text-base font-medium",
                isActive
                  ? "bg-sidebar-accent text-primary shadow-[inset_2px_0_0_0_hsl(var(--primary))] bg-gradient-to-r from-primary/10 to-transparent"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* --- THE COGNITIVE PARTNER FOOTER SECTION --- */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-4 p-3 rounded-xl bg-black/20 border border-white/5">
          {/* Beautiful 3D Glowing Avatar */}
          <div className="relative flex-shrink-0">
            <img
              src="/ainu-avatar.png" 
              alt="Ainu Avatar"
              className="w-14 h-14 rounded-full object-cover border-2 border-[#dfb76c] shadow-[0_4px_12px_rgba(157,78,221,0.35),_0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-300 hover:scale-105"
            />
            {/* Small pulsing online status indicator */}
            <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-sidebar animate-pulse" />
          </div>

          {/* AI Info Text */}
          <div className="flex flex-col min-w-0">
            <h2 className="text-base font-semibold tracking-wide text-foreground truncate">
              Ainu
            </h2>
            <p className="text-[11px] font-medium text-[#b370f7] tracking-normal mt-0.5 uppercase font-mono">
              Twin Mind • Active
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
