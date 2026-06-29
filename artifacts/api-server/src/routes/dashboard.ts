import { Router } from "express";
import { db } from "@workspace/db";
import { projectsTable, contactsTable, outreachEmailsTable, chatMessagesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const projects = await db.select().from(projectsTable).orderBy(desc(projectsTable.createdAt));
  const contacts = await db.select().from(contactsTable);
  const outreachEmails = await db.select().from(outreachEmailsTable).orderBy(desc(outreachEmailsTable.createdAt));

  const totalProjects = projects.length;
  const analyzedProjects = projects.filter(p => p.status !== "draft").length;
  const totalContacts = contacts.length;
  const totalEmailsSent = outreachEmails.filter(e => e.status === "sent").length;
  const totalEmailsDraft = outreachEmails.filter(e => e.status === "draft").length;

  const projectsByStatus = projects.reduce((acc: Record<string, number>, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const recentActivity = [
    ...projects.slice(0, 3).map(p => ({
      type: "project",
      description: `Project "${p.name}" was ${p.status === "draft" ? "imported" : "updated"}`,
      createdAt: p.updatedAt?.toISOString() || p.createdAt.toISOString(),
    })),
    ...outreachEmails.slice(0, 3).map(e => ({
      type: "outreach",
      description: `Email "${e.subject}" ${e.status === "sent" ? "was sent" : "saved as draft"}`,
      createdAt: e.createdAt.toISOString(),
    })),
    ...contacts.slice(0, 2).map(c => ({
      type: "contact",
      description: `${c.name} added to network`,
      createdAt: c.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  res.json({
    totalProjects,
    analyzedProjects,
    totalContacts,
    totalEmailsSent,
    totalEmailsDraft,
    projectsByStatus,
    recentActivity,
  });
});

export default router;
