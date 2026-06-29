import React, { useEffect } from "react";
import { Sidebar } from "./Sidebar";

export default function Shell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
        <div className="h-full relative">
          <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.015] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          {children}
        </div>
      </main>
    </div>
  );
}
