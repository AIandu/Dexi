import React, { useState } from "react";
import { Link } from "wouter";
import {
  useListProjects,
  useImportGithubRepos,
  useCreateProject,
  useDeleteProject,
  getListProjectsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { FolderKanban, Github, Plus, Search, Code, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";

export default function ProjectList() {
  const [search, setSearch] = useState("");
  const { data: projects, isLoading } = useListProjects();

  const filteredProjects = projects?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Your software portfolio and acquisitions.</p>
        </div>
        <div className="flex items-center gap-3">
          <ImportGithubDialog />
          <CreateProjectDialog />
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          className="pl-9 bg-black/20 border-white/10 w-full max-w-md"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <ProjectSkeleton key={i} />)}
          </div>
        ) : filteredProjects?.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-black/10">
            <FolderKanban className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No projects found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">
              Import repositories from GitHub or create one manually to start analyzing and pitching.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects?.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: any }) {
  const queryClient = useQueryClient();
  const deleteProject = useDeleteProject();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProject.mutate({ params: { id: project.id } }, {
        onSuccess: () => {
          toast.success("Project deleted");
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        },
        onError: () => toast.error("Failed to delete project")
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'analyzed': return 'info';
      case 'pitching': return 'warning';
      case 'sold': return 'success';
      default: return 'outline';
    }
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="group cursor-pointer hover:border-primary/50 transition-colors h-full flex flex-col bg-black/40 backdrop-blur">
        <CardContent className="p-5 flex flex-col h-full gap-4">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <Badge variant={getStatusColor(project.status) as any} className="capitalize shrink-0">
              {project.status}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
            {project.description || "No description provided."}
          </p>

          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono mt-auto pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              {project.language && (
                <span className="flex items-center gap-1">
                  <Code className="w-3 h-3" />
                  {project.language}
                </span>
              )}
              {project.stars !== null && project.stars !== undefined && (
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {project.stars}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>{formatDateTime(project.updatedAt || project.createdAt)}</span>
              <button
                onClick={handleDelete}
                className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive rounded transition-all"
                disabled={deleteProject.isPending}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProjectSkeleton() {
  return (
    <Card className="bg-black/20 border-white/5">
      <CardContent className="p-5 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="pt-4 mt-auto">
          <Skeleton className="h-4 w-1/3" />
        </div>
      </CardContent>
    </Card>
  );
}

function ImportGithubDialog() {
  const [open, setOpen] = useState(false);
  const [usernames, setUsernames] = useState("");
  const queryClient = useQueryClient();
  const importRepos = useImportGithubRepos();

  const handleImport = () => {
    const list = usernames.split(",").map(s => s.trim()).filter(Boolean);
    if (list.length === 0) return;

    importRepos.mutate({ data: { usernames: list } }, {
      onSuccess: (data) => {
        toast.success(`Imported ${data.length} projects`);
        setOpen(false);
        setUsernames("");
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      },
      onError: (err: any) => {
        toast.error(err.message || "Import failed");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-black/40">
          <Github className="w-4 h-4" />
          Import GitHub
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from GitHub</DialogTitle>
          <DialogDescription>
            Enter GitHub usernames or organization names (comma separated) to import all public repositories.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="e.g. facebook, microsoft"
            value={usernames}
            onChange={e => setUsernames(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleImport}
            disabled={importRepos.isPending || !usernames.trim()}
            className="gap-2"
          >
            {importRepos.isPending ? <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" /> : <Github className="w-4 h-4" />}
            Import Repos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const queryClient = useQueryClient();
  const createProject = useCreateProject();

  const handleCreate = () => {
    if (!name.trim()) return;

    createProject.mutate({ data: { name, description: desc } }, {
      onSuccess: () => {
        toast.success("Project created");
        setOpen(false);
        setName("");
        setDesc("");
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      },
      onError: () => toast.error("Failed to create project")
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Manual
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="E.g. Apollo" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief overview..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={createProject.isPending || !name.trim()}>
            {createProject.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
