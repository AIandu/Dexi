import React, { useState, useEffect, useRef } from "react";
import {
  useListChatMessages,
  useSendChatMessage
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendIcon, Cpu, BrainCircuit } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function GlobalChat() {
  const projectId = 0;
  const { data: messages, isLoading } = useListChatMessages({ projectId });
  const sendMsg = useSendChatMessage();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMsg.isPending]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const msg = content;
    setContent("");

    sendMsg.mutate({ data: { projectId, content: msg } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/chat", { projectId }] });
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] pointer-events-none mix-blend-overlay z-0" />

      <header className="px-8 py-5 border-b border-white/5 bg-black/20 flex items-center gap-3 shrink-0 z-10">
        <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
          <BrainCircuit className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dexi</h1>
          <p className="text-xs text-primary font-mono mt-0.5">AI Co-Pilot is active and ready.</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 z-10">
        {isLoading ? (
          <div className="flex justify-center pt-10"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
        ) : messages?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm space-y-4 max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-black border border-white/5 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.1)]">
              <Cpu className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-medium text-foreground">I'm Dexi, your AI Co-Pilot</h2>
            <p>I have context on all your projects, contacts, and emails. How can we grow the empire today?</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages?.map((msg, i) => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`} style={{ animationDelay: `${i * 50}ms` }}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-black border border-white/10 shadow-[0_0_15px_rgba(124,58,237,0.15)]'}`}>
                  {msg.role === 'user' ? <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(124,58,237,1)]" /> : <BrainCircuit className="w-5 h-5 text-primary" />}
                </div>
                <div className={`p-4 rounded-xl text-[15px] leading-relaxed max-w-[80%] ${msg.role === 'user' ? 'bg-primary/10 border border-primary/20 text-foreground' : 'bg-black/40 border border-white/5 backdrop-blur-sm'}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <div className={`text-[10px] opacity-50 mt-3 font-mono ${msg.role === 'user' ? 'text-right text-primary' : 'text-left'}`}>
                    {formatDateTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            ))}
            {sendMsg.isPending && (
              <div className="flex gap-4 animate-in fade-in">
                <div className="w-10 h-10 rounded-lg bg-black border border-white/10 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(124,58,237,0.15)]">
                  <BrainCircuit className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 backdrop-blur-sm flex items-center">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce shadow-[0_0_5px_rgba(124,58,237,0.8)]" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-100 shadow-[0_0_5px_rgba(124,58,237,0.8)]" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200 shadow-[0_0_5px_rgba(124,58,237,0.8)]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-6 bg-black/40 border-t border-white/5 z-10 shrink-0 backdrop-blur-md">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
          <Input
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Ask Dexi anything..."
            className="w-full pl-6 pr-14 py-6 bg-black/60 border-white/10 rounded-xl text-base shadow-[0_0_15px_rgba(0,0,0,0.5)] focus-visible:ring-primary focus-visible:border-primary transition-all placeholder:font-mono placeholder:text-muted-foreground/50"
            disabled={sendMsg.isPending}
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg"
            disabled={!content.trim() || sendMsg.isPending}
          >
            <SendIcon className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
