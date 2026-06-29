import React from "react";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, FolderKanban, Send, Users, Code2, Cpu } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading, error } = useGetDashboardStats();

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg">
          Failed to load dashboard data. Ensure the API is running.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground mt-1">System status and pipeline overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/projects">
            <Button variant="outline" className="gap-2">
              <FolderKanban className="w-4 h-4" />
              Manage Projects
            </Button>
          </Link>
          <Link href="/chat">
            <Button className="gap-2">
              <Cpu className="w-4 h-4" />
              Engage Co-Pilot
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Projects" value={stats?.totalProjects} icon={FolderKanban} isLoading={isLoading} />
        <StatCard
          title="Analyzed"
          value={stats?.analyzedProjects}
          icon={Code2}
          isLoading={isLoading}
          trend={stats ? `${Math.round((stats.analyzedProjects / Math.max(stats.totalProjects, 1)) * 100)}% coverage` : undefined}
        />
        <StatCard title="Contacts" value={stats?.totalContacts} icon={Users} isLoading={isLoading} />
        <StatCard
          title="Emails Sent"
          value={stats?.totalEmailsSent}
          icon={Send}
          isLoading={isLoading}
          trend={stats && stats.totalEmailsDraft > 0 ? `${stats.totalEmailsDraft} in draft` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-black/40 backdrop-blur border-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Pipeline Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(stats?.projectsByStatus || {}).map(([status, count]) => (
                  <div key={status} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize text-muted-foreground font-mono">{status}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(count / Math.max(stats?.totalProjects || 1, 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(!stats?.projectsByStatus || Object.keys(stats.projectsByStatus).length === 0) && (
                  <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                    No active projects. Import repositories to begin.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur border-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-2 h-2 mt-2 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity, i) => (
                    <div key={i} className="flex gap-4 relative">
                      {i !== (stats.recentActivity?.length ?? 0) - 1 && (
                        <div className="absolute left-[5px] top-6 bottom-[-16px] w-[1px] bg-border" />
                      )}
                      <div className="w-3 h-3 mt-1.5 rounded-full bg-primary/20 border border-primary z-10 shrink-0" />
                      <div className="space-y-1 text-sm">
                        <p className="text-foreground leading-snug">{activity.description}</p>
                        <p className="text-muted-foreground text-xs font-mono">
                          {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : "Unknown"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No recent activity
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  isLoading,
  trend
}: {
  title: string;
  value?: number;
  icon: React.ElementType;
  isLoading: boolean;
  trend?: string;
}) {
  return (
    <Card className="bg-black/20 border-white/5 overflow-hidden group">
      <CardContent className="p-6 relative">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Icon className="w-16 h-16" />
        </div>
        <div className="flex flex-col gap-1 relative z-10">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {isLoading ? (
            <Skeleton className="h-10 w-20 mt-2" />
          ) : (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold tracking-tighter">{value || 0}</span>
              {trend && <span className="text-xs text-primary font-mono">{trend}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
