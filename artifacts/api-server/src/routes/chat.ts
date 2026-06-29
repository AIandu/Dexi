import { Router } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable } from "@workspace/db/schema";
import { projectsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { chatWithAI } from "../lib/ai.js";

const router = Router();

router.get("/", async (req, res) => {
  const projectId = Number(req.query.projectId);
  if (isNaN(projectId)) return res.status(400).json({ error: "projectId required" });

  const messages = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.projectId, projectId))
    .orderBy(chatMessagesTable.createdAt);

  res.json(messages);
});

router.post("/", async (req, res) => {
  const { projectId, content } = req.body as { projectId: number; content: string };
  if (!content) return res.status(400).json({ error: "content required" });

  await db.insert(chatMessagesTable).values({
    projectId: projectId ?? 0,
    role: "user",
    content,
  });

  const history = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.projectId, projectId ?? 0))
    .orderBy(chatMessagesTable.createdAt)
    .limit(50);

  let projectContext = "";
  if (projectId > 0) {
    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
    if (project) {
      projectContext = `
Project context:
Name: ${project.name}
Description: ${project.description || "N/A"}
Summary: ${project.summary || "Not analyzed"}
Value Proposition: ${project.valueProp || "Unknown"}
Target Audience: ${project.targetAudience || "Unknown"}
Language: ${project.language || "Unknown"}
Status: ${project.status}
Estimated Value: ${project.estimatedValue || "TBD"}
`;
    }
  }

  const systemPrompt = projectId > 0
    ? `You are Dexi, an AI business co-pilot specializing in helping developers sell, license, and monetize software projects. You have deep knowledge of business development, outreach strategy, and investor relations.

${projectContext}

Help the user analyze, position, pitch, and monetize this project. Be direct, strategic, and actionable. No fluff.`
    : `You are Dexi, an AI business co-pilot for software entrepreneurs. You help with:
- Analyzing and positioning software projects
- Writing pitch emails and investor outreach
- Identifying buyers, investors, and collaboration opportunities
- Building sales strategies and pricing models
- GitHub project monetization

Be direct, strategic, and actionable. You are the user's partner in growing their software business.`;

  const aiMessages = history.map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

  const reply = await chatWithAI(aiMessages, systemPrompt);

  const [aiMessage] = await db.insert(chatMessagesTable).values({
    projectId: projectId ?? 0,
    role: "assistant",
    content: reply,
  }).returning();

  res.json(aiMessage);
});

export default router;
