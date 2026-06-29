import { Router } from "express";
import { db } from "@workspace/db";
import { contactsTable } from "@workspace/db/schema";
import { projectsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { discoverContacts } from "../lib/ai.js";

const router = Router();

router.get("/", async (req, res) => {
  const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;

  let contacts;
  if (projectId) {
    contacts = await db.select().from(contactsTable).where(eq(contactsTable.projectId, projectId));
  } else {
    contacts = await db.select().from(contactsTable).orderBy(contactsTable.createdAt);
  }

  res.json(contacts);
});

router.post("/", async (req, res) => {
  const { name, email, company, title, type = "other", projectId, notes } = req.body;
  if (!name || !email) return res.status(400).json({ error: "name and email required" });

  const [contact] = await db.insert(contactsTable)
    .values({ name, email, company, title, type, projectId: projectId || null, notes })
    .returning();

  res.status(201).json(contact);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [contact] = await db.select().from(contactsTable).where(eq(contactsTable.id, id));
  if (!contact) return res.status(404).json({ error: "Not found" });
  res.json(contact);
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, company, title, type, notes } = req.body;

  const [updated] = await db.update(contactsTable)
    .set({ name, email, company, title, type, notes })
    .where(eq(contactsTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(contactsTable).where(eq(contactsTable.id, id));
  res.status(204).send();
});

router.post("/discover", async (req, res) => {
  const { projectId } = req.body as { projectId: number };
  if (!projectId) return res.status(400).json({ error: "projectId required" });

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) return res.status(404).json({ error: "Project not found" });

  const contacts = await discoverContacts({
    name: project.name,
    summary: project.summary,
    targetAudience: project.targetAudience,
    language: project.language,
  });

  res.json(contacts);
});

export default router;
