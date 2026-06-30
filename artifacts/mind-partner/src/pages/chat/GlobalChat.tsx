import React, { useState, useEffect, useRef } from "react";
import {
  useListChatMessages,
  useSendChatMessage
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SendIcon, BrainCircuit } from "lucide-react";

export default function GlobalChat() {
  const projectId = 0;
  const { data: messages, isLoading } = useListChatMessages({ projectId });
  const sendMsg = useSendChatMessage();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(124,58,237,0.12),transparent)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(124,58,237,0.06),transparent)] pointer-events-none z-0" />

      <div className="shrink-0 pt-5 pb-3 flex flex-col items-center z-10 pl-16">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)] mb-2">
          <BrainCircuit className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dexi</h1>
        <p className="text-sm text-primary/80 font-mono">AI Co-Pilot · active</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto z-10 px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-5 pb-4">

          {isLoading ? (
            <div className="flex justify-center pt-16">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center pt-16 space-y-4 px-6">
              <p className="text-xl font-medium text-foreground">Hi, I'm Dexi</p>
              <p className="text-base text-muted-foreground leading-relaxed max-w-sm">
                Your AI co-pilot. Ask me anything about your projects, pitch strategy, or next steps.
              </p>
            </div>
          ) : (
            messages?.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className={`text-xs font-semibold mb-1.5 px-1 tracking-wide ${isUser ? "text-emerald-400" : "text-primary"}`}>
                    {isUser ? "YOU" : "DEXI"}
                  </div>
                  <div
                    className={`
                      relative max-w-[88%] px-5 py-4 rounded-2xl text-[17px] leading-relaxed font-medium
                      ${isUser
                        ? "bg-emerald-500/15 border-2 border-emerald-500/50 text-emerald-50 rounded-tr-sm shadow-[0_0_20px_rgba(52,211,153,0.15)]"
                        : "bg-primary/15 border-2 border-primary/50 text-purple-50 rounded-tl-sm shadow-[0_0_20px_rgba(124,58,237,0.2)]"
                      }
                    `}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })
          )}

          {sendMsg.isPending && (
            <div className="flex flex-col items-start animate-in fade-in duration-200">
              <div className="text-xs font-semibold mb-1.5 px-1 tracking-wide text-primary">DEXI</div>
              <div className="bg-primary/15 border-2 border-primary/50 rounded-2xl rounded-tl-sm px-5 py-4 shadow-[0_0_20px_rgba(124,58,237,0.2)]">
                <div className="flex gap-2 items-center">
                  <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce shadow-[0_0_6px_rgba(124,58,237,1)]" />
                  <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce delay-150 shadow-[0_0_6px_rgba(124,58,237,1)]" />
                  <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce delay-300 shadow-[0_0_6px_rgba(124,58,237,1)]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 z-10 px-4 pb-5 pt-2">
        <form onSubmit={handleSend} className="max-w-2xl mx-auto relative">
          <textarea
            ref={inputRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Dexi…"
            rows={2}
            disabled={sendMsg.isPending}
            className="w-full resize-none pl-5 pr-14 py-4 bg-black/60 border-2 border-white/10 rounded-2xl text-[17px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all shadow-lg leading-relaxed"
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-3 bottom-3 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(124,58,237,0.5)]"
            disabled={!content.trim() || sendMsg.isPending}
          >
            <SendIcon className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground/40 mt-2 font-mono">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
