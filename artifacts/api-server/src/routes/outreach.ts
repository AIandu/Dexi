import { Router } from "express";
import { db } from "@workspace/db";
import { outreachEmailsTable } from "@workspace/db/schema";
import { projectsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { generateOutreachEmail } from "../lib/ai.js";
import { sendEmail } from "../lib/sendgrid.js";

const router = Router();

router.get("/", async (req, res) => {
  const emails = await db.select().from(outreachEmailsTable).orderBy(outreachEmailsTable.createdAt);
  res.json(emails);
});

router.post("/", async (req, res) => {
  const { projectId, contactId, toEmail, toName, subject, body } = req.body;
  if (!toEmail || !subject || !body) return res.status(400).json({ error: "toEmail, subject, body required" });

  const [email] = await db.insert(outreachEmailsTable)
    .values({ projectId: projectId || null, contactId: contactId || null, toEmail, toName, subject, body, status: "draft" })
    .returning();

  res.status(201).json(email);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [email] = await db.select().from(outreachEmailsTable).where(eq(outreachEmailsTable.id, id));
  if (!email) return res.status(404).json({ error: "Not found" });
  res.json(email);
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { subject, body, toEmail, toName } = req.body;

  const [updated] = await db.update(outreachEmailsTable)
    .set({ subject, body, toEmail, toName })
    .where(eq(outreachEmailsTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(outreachEmailsTable).where(eq(outreachEmailsTable.id, id));
  res.status(204).send();
});

router.post("/:id/send", async (req, res) => {
  const id = Number(req.params.id);
  const [email] = await db.select().from(outreachEmailsTable).where(eq(outreachEmailsTable.id, id));
  if (!email) return res.status(404).json({ error: "Not found" });

  try {
    await sendEmail({
      to: email.toEmail,
      toName: email.toName,
      subject: email.subject,
      body: email.body,
    });

    const [updated] = await db.update(outreachEmailsTable)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(outreachEmailsTable.id, id))
      .returning();

    res.json({ success: true, message: "Email sent successfully" });
  } catch (err: any) {
    await db.update(outreachEmailsTable)
      .set({ status: "failed" })
      .where(eq(outreachEmailsTable.id, id));

    res.status(500).json({ success: false, message: err.message || "Send failed" });
  }
});

router.post("/generate", async (req, res) => {
  const { projectId, contactId, toEmail, toName, tone } = req.body as {
    projectId: number;
    contactId?: number;
    toEmail?: string;
    toName?: string;
    tone?: string;
  };

  if (!projectId) return res.status(400).json({ error: "projectId required" });

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) return res.status(404).json({ error: "Project not found" });

  const generated = await generateOutreachEmail({
    project: {
      name: project.name,
      summary: project.summary,
      valueProp: project.valueProp,
      estimatedValue: project.estimatedValue,
    },
    toName,
    tone,
  });

  const [email] = await db.insert(outreachEmailsTable).values({
    projectId,
    contactId: contactId || null,
    toEmail: toEmail || "placeholder@example.com",
    toName: toName || null,
    subject: generated.subject,
    body: generated.body,
    status: "draft",
  }).returning();

  res.json(email);
});

export default router;
