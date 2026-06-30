import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import {
  useGetProject,
  useAnalyzeProject,
  useGenerateWhitepaper,
  useGetProjectSuggestions,
  useListChatMessages,
  useSendChatMessage,
  getGetProjectQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Cpu, FileText, Lightbulb, MessageSquare,
  ChevronLeft, ExternalLink, Code, Activity, Sparkles, SendIcon, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";

export default function ProjectDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [activeTab, setActiveTab] = useState<"overview" | "whitepaper" | "suggestions" | "chat">("overview");

  const { data: project, isLoading: isLoadingProject } = useGetProject(id, { query: { enabled: !!id } });

  if (isLoadingProject) {
    return <div className="p-8"><Skeleton className="h-8 w-64 mb-8" /><div className="grid grid-cols-3 gap-6"><Skeleton className="col-span-1 h-96" /><Skeleton className="col-span-2 h-96" /></div></div>;
  }

  if (!project) return <div className="p-8 text-destructive">Project not found</div>;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="px-8 py-6 border-b border-white/5 bg-black/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="p-2 hover:bg-white/5 rounded-md transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge variant={project.status === 'draft' ? 'outline' : 'secondary'} className="capitalize">{project.status}</Badge>
            </div>
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mt-1 w-fit">
                <ExternalLink className="w-3 h-3" /> {project.repoOwner}/{project.repoName}
              </a>
            )}
          </div>
        </div>
        <ProjectActions project={project} />
      </header>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <div className="w-full lg:w-[400px] border-r border-white/5 bg-black/10 overflow-y-auto p-6 space-y-6 shrink-0">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" /> Assessment
            </h3>

            <div className="space-y-3">
              <div className="bg-black/30 border border-white/5 p-4 rounded-lg space-y-2">
                <label className="text-xs text-primary font-mono">Summary</label>
                <p className="text-sm">{project.summary || <span className="text-muted-foreground italic">Requires analysis</span>}</p>
              </div>

              <div className="bg-black/30 border border-white/5 p-4 rounded-lg space-y-2">
                <label className="text-xs text-primary font-mono">Value Proposition</label>
                <p className="text-sm">{project.valueProp || <span className="text-muted-foreground italic">Requires analysis</span>}</p>
              </div>

              <div className="bg-black/30 border border-white/5 p-4 rounded-lg space-y-2">
                <label className="text-xs text-primary font-mono">Target Audience</label>
                <p className="text-sm">{project.targetAudience || <span className="text-muted-foreground italic">Requires analysis</span>}</p>
              </div>

              <div className="bg-black/30 border border-white/5 p-4 rounded-lg space-y-2 flex justify-between items-center">
                <label className="text-xs text-primary font-mono">Est. Value</label>
                <span className="font-mono font-medium">{project.estimatedValue || "TBD"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
          <div className="px-6 border-b border-white/5 flex gap-6 shrink-0 pt-4">
            <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={Code} label="Repository" />
            <TabButton active={activeTab === "whitepaper"} onClick={() => setActiveTab("whitepaper")} icon={FileText} label="Whitepaper" />
            <TabButton active={activeTab === "suggestions"} onClick={() => setActiveTab("suggestions")} icon={Lightbulb} label="Suggestions" />
            <TabButton active={activeTab === "chat"} onClick={() => setActiveTab("chat")} icon={MessageSquare} label="AI Chat" />
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "overview" && <RepoOverview project={project} />}
            {activeTab === "whitepaper" && <WhitepaperView project={project} />}
            {activeTab === "suggestions" && <SuggestionsView projectId={project.id} />}
            {activeTab === "chat" && <ProjectChat projectId={project.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 pb-3 border-b-2 font-medium text-sm transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function ProjectActions({ project }: { project: any }) {
  const queryClient = useQueryClient();
  const analyze = useAnalyzeProject();
  const [refreshingReadme, setRefreshingReadme] = useState(false);

  const handleAnalyze = () => {
    analyze.mutate({ id: project.id }, {
      onSuccess: () => {
        toast.success("Analysis complete");
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(project.id) });
      },
      onError: () => toast.error("Analysis failed")
    });
  };

  const handleRefreshReadme = async () => {
    setRefreshingReadme(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/refresh-readme`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to refresh README");
      } else {
        toast.success("README refreshed — run Analyze AI to update the assessment");
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(project.id) });
      }
    } catch {
      toast.error("Failed to refresh README");
    } finally {
      setRefreshingReadme(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {project.repoOwner && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={handleRefreshReadme}
          disabled={refreshingReadme}
          title="Re-fetch README from GitHub"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshingReadme ? "animate-spin" : ""}`} />
          {refreshingReadme ? "Fetching..." : "Refresh README"}
        </Button>
      )}
      <Button
        variant="outline"
        className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
        onClick={handleAnalyze}
        disabled={analyze.isPending}
      >
        {analyze.isPending ? (
          <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {analyze.isPending ? "Analyzing..." : "Analyze AI"}
      </Button>
    </div>
  );
}

function RepoOverview({ project }: { project: any }) {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex gap-4 flex-wrap">
        <Badge variant="outline">{project.language || "Unknown Language"}</Badge>
        {project.topics && project.topics.split(',').map((t: string) => (
          <Badge key={t} variant="secondary">{t.trim()}</Badge>
        ))}
      </div>

      <div className="bg-black/30 rounded-lg border border-white/5 p-6 font-mono text-sm whitespace-pre-wrap text-muted-foreground overflow-auto">
        {project.readme ? (
          <div dangerouslySetInnerHTML={{ __html: project.readme.replace(/</g, "&lt;").replace(/>/g, "&gt;").substring(0, 5000) + (project.readme.length > 5000 ? "\n\n...[truncated]" : "") }} />
        ) : (
          "No README found."
        )}
      </div>
    </div>
  );
}

function WhitepaperView({ project }: { project: any }) {
  const queryClient = useQueryClient();
  const generate = useGenerateWhitepaper();

  const handleGenerate = () => {
    generate.mutate({ id: project.id }, {
      onSuccess: () => {
        toast.success("Whitepaper generated");
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(project.id) });
      },
      onError: () => toast.error("Failed to generate whitepaper")
    });
  };

  if (!project.whitepaper) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <FileText className="w-16 h-16 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">No whitepaper generated yet.</p>
        <Button onClick={handleGenerate} disabled={generate.isPending} className="gap-2">
          {generate.isPending ? "Generating..." : "Generate Whitepaper"}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleGenerate} disabled={generate.isPending} variant="outline" size="sm" className="gap-2">
          <Sparkles className="w-3 h-3" /> Regenerate
        </Button>
      </div>
      <div className="prose prose-invert max-w-none bg-black/20 p-8 rounded-lg border border-white/5 leading-relaxed">
        {project.whitepaper.split('\n').map((para: string, i: number) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </div>
  );
}

function SuggestionsView({ projectId }: { projectId: number }) {
  const { data, isLoading } = useGetProjectSuggestions(projectId, { query: { enabled: !!projectId } });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>;

  if (!data || !data.suggestions || data.suggestions.length === 0) {
    return <div className="text-muted-foreground text-center mt-12">Analyze the project to get AI suggestions.</div>;
  }

  return (
    <div className="max-w-3xl space-y-4">
      {data.suggestions.map((s, i) => (
        <Card key={i} className="bg-black/20 border-primary/20">
          <CardContent className="p-4 flex gap-4">
            <div className="shrink-0 mt-1">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm leading-relaxed">{s}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProjectChat({ projectId }: { projectId: number }) {
  const { data: messages, isLoading } = useListChatMessages({ projectId });
  const sendMsg = useSendChatMessage();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const msg = content;
    setContent("");

    sendMsg.mutate({ data: { projectId, content: msg } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/chat", { projectId }] });
      },
      onError: () => toast.error("Failed to send message")
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] max-w-4xl mx-auto">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 p-4 rounded-t-lg bg-black/10 border border-white/5 border-b-0">
        {isLoading ? (
          <div className="flex justify-center"><div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
        ) : messages?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm space-y-2">
            <Cpu className="w-8 h-8 opacity-50" />
            <p>Ask Dexi to draft emails, analyze code, or plan strategy.</p>
          </div>
        ) : (
          messages?.map(msg => (
            <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-black border border-white/10'}`}>
                {msg.role === 'user' ? <div className="w-3 h-3 bg-primary rounded-full" /> : <Cpu className="w-4 h-4" />}
              </div>
              <div className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <div className="text-[10px] opacity-50 mt-2 text-right">{formatDateTime(msg.createdAt)}</div>
              </div>
            </div>
          ))
        )}
        {sendMsg.isPending && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-lg bg-secondary text-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSend} className="p-3 bg-black/30 border border-white/5 rounded-b-lg flex gap-2">
        <Input
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Message Co-Pilot..."
          className="bg-black/50 border-white/10 focus-visible:ring-primary/50"
          disabled={sendMsg.isPending}
        />
        <Button type="submit" size="icon" disabled={!content.trim() || sendMsg.isPending}>
          <SendIcon className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
