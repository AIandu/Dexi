import React, { useState } from "react";
import {
  useListContacts,
  useCreateContact,
  useDeleteContact,
  getListContactsQueryKey,
  useDiscoverContacts,
  useListProjects
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Users, Plus, Trash2, Search, Sparkles, Building2 } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";

export default function ContactList() {
  const { data: contacts, isLoading } = useListContacts({});
  const [search, setSearch] = useState("");

  const filtered = contacts?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rolodex</h1>
          <p className="text-muted-foreground mt-1">Network of buyers, investors, and collaborators.</p>
        </div>
        <div className="flex items-center gap-3">
          <DiscoverContactsDialog />
          <AddContactDialog />
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search network..."
          className="pl-9 bg-black/20 border-white/10 w-full max-w-md"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 bg-black/20 border border-white/5 rounded-lg overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered?.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Users className="w-12 h-12 opacity-20 mb-4" />
            <p>No contacts found in network.</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="bg-black/40 sticky top-0 z-10">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.map(contact => (
                  <ContactRow key={contact.id} contact={contact} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function ContactRow({ contact }: { contact: any }) {
  const queryClient = useQueryClient();
  const deleteContact = useDeleteContact();

  const handleDelete = () => {
    if (confirm("Remove contact?")) {
      deleteContact.mutate({ params: { id: contact.id } }, {
        onSuccess: () => {
          toast.success("Contact removed");
          queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
        }
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'investor': return 'success';
      case 'buyer': return 'default';
      case 'collaborator': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <TableRow className="border-white/5 hover:bg-white/[0.02]">
      <TableCell>
        <div className="font-medium">{contact.name}</div>
        <div className="text-xs text-muted-foreground font-mono">{contact.email}</div>
      </TableCell>
      <TableCell>
        {contact.company ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Building2 className="w-3 h-3 text-muted-foreground" />
            {contact.company}
          </div>
        ) : <span className="text-muted-foreground opacity-50">-</span>}
      </TableCell>
      <TableCell>
        <Badge variant={getTypeColor(contact.type) as any} className="capitalize text-[10px]">
          {contact.type}
        </Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground font-mono">
        {formatDateTime(contact.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          disabled={deleteContact.isPending}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function AddContactDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", company: "", type: "other" });

  const create = useCreateContact();
  const queryClient = useQueryClient();

  const handleSubmit = () => {
    if (!formData.name || !formData.email) return;

    create.mutate({ data: formData }, {
      onSuccess: () => {
        toast.success("Contact added");
        setOpen(false);
        setFormData({ name: "", email: "", company: "", type: "other" });
        queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
      },
      onError: () => toast.error("Failed to add contact")
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-black/40">
          <Plus className="w-4 h-4" /> Add Manual
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm">Name</label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Email</label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm">Company</label>
              <Input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Type</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="investor">Investor</option>
                <option value="buyer">Buyer</option>
                <option value="collaborator">Collaborator</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={create.isPending || !formData.name || !formData.email}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DiscoverContactsDialog() {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState<number>(0);

  const { data: projects } = useListProjects();
  const discover = useDiscoverContacts();
  const create = useCreateContact();
  const queryClient = useQueryClient();

  const handleDiscover = () => {
    if (!projectId) return;
    discover.mutate({ data: { projectId } });
  };

  const handleAddDiscovered = (suggestion: any) => {
    const email = `${suggestion.name.split(' ')[0].toLowerCase()}@${suggestion.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

    create.mutate({
      data: {
        name: suggestion.name,
        email: email,
        company: suggestion.company,
        type: suggestion.type,
        projectId: projectId,
        notes: suggestion.reason
      }
    }, {
      onSuccess: () => {
        toast.success(`Added ${suggestion.name} to network`);
        queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Sparkles className="w-4 h-4" /> AI Discover
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Discover Contacts</DialogTitle>
        </DialogHeader>
        <div className="py-4 flex gap-2 shrink-0">
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            value={projectId}
            onChange={e => setProjectId(Number(e.target.value))}
          >
            <option value={0} disabled>-- Select project context --</option>
            {projects?.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <Button onClick={handleDiscover} disabled={discover.isPending || !projectId} className="shrink-0 gap-2">
            {discover.isPending ? <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" /> : <Search className="w-4 h-4" />}
            Find Targets
          </Button>
        </div>

        <div className="flex-1 overflow-auto bg-black/20 rounded-md border border-white/5 p-4">
          {discover.isPending ? (
            <div className="h-full flex items-center justify-center text-muted-foreground gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Scanning for relevant buyers and investors...
            </div>
          ) : discover.data ? (
            <div className="space-y-3">
              {discover.data.map((s, i) => (
                <div key={i} className="bg-black/40 border border-white/5 p-4 rounded-lg flex justify-between items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{s.name}</h4>
                      <Badge variant="outline" className="text-[10px]">{s.type}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" /> {s.company}
                    </div>
                    <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2">{s.reason}</p>
                  </div>
                  <Button size="sm" onClick={() => handleAddDiscovered(s)} className="shrink-0">Add</Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Select a project to discover relevant contacts
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
