import React, { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, X } from "lucide-react";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/30">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-30 w-11 h-11 rounded-xl bg-black/60 border border-white/10 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all shadow-lg"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="h-full relative">
          <div className="pointer-events-none fixed inset-0 z-20 opacity-[0.015] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          {children}
        </div>
      </main>
    </div>
  );
}
