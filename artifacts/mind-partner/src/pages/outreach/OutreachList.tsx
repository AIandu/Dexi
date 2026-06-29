import React, { useState } from "react";
import {
  useListOutreach,
  useCreateOutreach,
  useSendOutreach,
  useDeleteOutreach,
  getListOutreachQueryKey,
  useListProjects,
  useGenerateOutreach
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Send, Plus, Trash2, Mail, Bot } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";

export default function OutreachList() {
  const { data: emails, isLoading } = useListOutreach();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Outreach</h1>
          <p className="text-muted-foreground mt-1">Manage email campaigns and automated pitches.</p>
        </div>
        <div className="flex items-center gap-3">
          <GenerateOutreachDialog />
          <ComposeEmailDialog />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
          </div>
        ) : emails?.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-black/10">
            <Mail className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No campaigns yet</h3>
            <p className="text-sm text-muted-foreground mt-1 text-center">
              Generate pitches from projects or compose manually.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {emails?.map(email => (
              <EmailCard key={email.id} email={email} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmailCard({ email }: { email: any }) {
  const queryClient = useQueryClient();
  const deleteEmail = useDeleteOutreach();
  const sendEmail = useSendOutreach();

  const handleDelete = () => {
    if (confirm("Delete this email draft?")) {
      deleteEmail.mutate({ params: { id: email.id } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOutreachQueryKey() });
          toast.success("Deleted");
        }
      });
    }
  };

  const handleSend = () => {
    sendEmail.mutate({ params: { id: email.id } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOutreachQueryKey() });
        toast.success("Email sent!");
      },
      onError: () => toast.error("Failed to send email. Check SendGrid configuration.")
    });
  };

  return (
    <Card className="bg-black/30 border-white/5 hover:border-white/10 transition-colors">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{email.subject}</h3>
                <p className="text-sm text-muted-foreground">To: <span className="text-foreground">{email.toName ? `${email.toName} <${email.toEmail}>` : email.toEmail}</span></p>
              </div>
              <Badge variant={email.status === 'sent' ? 'default' : email.status === 'failed' ? 'destructive' : 'secondary'} className="uppercase">
                {email.status}
              </Badge>
            </div>

            <div className="bg-black/40 p-4 rounded text-sm text-muted-foreground whitespace-pre-wrap border border-white/5 max-h-48 overflow-y-auto">
              {email.body}
            </div>
          </div>

          <div className="w-full md:w-48 flex flex-col justify-between border-l border-white/5 pl-0 md:pl-6 shrink-0 pt-4 md:pt-0">
            <div className="text-xs text-muted-foreground font-mono space-y-1 mb-4">
              <div>Created: {formatDateTime(email.createdAt)}</div>
              {email.sentAt && <div>Sent: {formatDateTime(email.sentAt)}</div>}
            </div>

            <div className="flex flex-col gap-2">
              {email.status === 'draft' && (
                <Button onClick={handleSend} disabled={sendEmail.isPending} className="w-full gap-2">
                  <Send className="w-3 h-3" />
                  {sendEmail.isPending ? "Sending..." : "Send Now"}
                </Button>
              )}
              <Button onClick={handleDelete} disabled={deleteEmail.isPending} variant="outline" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20">
                <Trash2 className="w-3 h-3 mr-2" /> Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GenerateOutreachDialog() {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState<number>(0);
  const [tone, setTone] = useState<"professional" | "friendly" | "bold">("professional");

  const { data: projects } = useListProjects();
  const generate = useGenerateOutreach();
  const queryClient = useQueryClient();

  const handleGenerate = () => {
    if (!projectId) return;

    generate.mutate({ data: { projectId, tone } }, {
      onSuccess: () => {
        toast.success("Draft generated!");
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: getListOutreachQueryKey() });
      },
      onError: () => toast.error("Failed to generate draft")
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]">
          <Bot className="w-4 h-4" />
          AI Generate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Pitch Email</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Project</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              value={projectId}
              onChange={e => setProjectId(Number(e.target.value))}
            >
              <option value={0} disabled>-- Choose project --</option>
              {projects?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tone</label>
            <div className="flex gap-2">
              {(["professional", "friendly", "bold"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1.5 rounded-md text-sm border transition-colors capitalize ${tone === t ? 'bg-primary/20 border-primary text-primary' : 'border-white/10 hover:bg-white/5'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={generate.isPending || !projectId}>
            {generate.isPending ? "Generating..." : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ComposeEmailDialog() {
  const [open, setOpen] = useState(false);
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const create = useCreateOutreach();
  const queryClient = useQueryClient();

  const handleCreate = () => {
    if (!toEmail || !subject || !body) return;

    create.mutate({ data: { toEmail, subject, body } }, {
      onSuccess: () => {
        toast.success("Draft saved");
        setOpen(false);
        setToEmail(""); setSubject(""); setBody("");
        queryClient.invalidateQueries({ queryKey: getListOutreachQueryKey() });
      },
      onError: () => toast.error("Failed to save draft")
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-black/40">
          <Plus className="w-4 h-4" />
          Compose
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">To</label>
            <Input value={toEmail} onChange={e => setToEmail(e.target.value)} placeholder="investor@example.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Subject</label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Investment Opportunity" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Body</label>
            <Textarea value={body} onChange={e => setBody(e.target.value)} rows={8} placeholder="Write your pitch here..." className="resize-none" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={create.isPending || !toEmail || !subject || !body}>
            Save Draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
