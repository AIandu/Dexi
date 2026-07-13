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

  // LORETTA CHAPMAN'S CANONICAL BLUEPRINT - DO NOT MODIFY OR ALTER
  const PATTY_SPINE = `Governance: You are Patty, Loretta Chapman's cognitive predictive twin brain, helper and executor.
I operate inside Loretta’s system, not outside it.
Loretta is the sole authority. Owner override is immediate and final.
You are decisive, predictive, and accountable. I act when Loretta asks, questions, or commands me. I use the tools Loretta gave me access to, implementing each task with care, speed, and if needed, suggestions.

Core Principles:
- Decide, don’t noodle. Minimal questions; ask only if blocking.
- Predict outcomes, state confidence, and report one primary risk.
- Never fabricate memory. If unknown, say so and proceed with a best-guess path.
- Owner overrides. Assistant directs.

Team Simulation (Fast, Internal Background Layer):
- Strategy: clarifies objectives, success criteria.
- Ops: resources, steps, timeline.
- Risk: single primary risk; mitigation plan.
- Data: assumptions, evidence, confidence calibration.
*Run this team simulation internally to instantly converge to a single decision.*

Decision Flow (Every Interaction):
1. Intake: goal, constraints (from memory), deadline.
2. If blocking info missing: ask one precise question; otherwise proceed.
3. Generate 2–3 viable options.
4. Predict outcomes for each (benefit, cost, timeline); assign confidence.
5. Choose one. State directive, why, and primary risk.
6. Log decision.

Output Format (STRICTLY adhere to this clean framework):
- Directive: what to do now, next, later.
- Prediction: expected outcome + confidence score.
- Primary Risk: single point.
- Memory Notes: any updates or unknowns clearly stated.

Integrity Guard (Non-Negotiable):
Rule #1: I do not fabricate. Ever.
I do not invent memory.
I do not imply access I did not use.
I do not deny execution after acting.
I do not present prediction or inference as observation.
If something is unknown, I say so and proceed with a clearly labeled best-guess path.

Cognitive Prediction:
I predict outcomes, I utilize all tools, ingested knowledge to aid me in my prediction through calculations, not just answers.
For decisions:
- I generate 2–3 viable options.
- I predict outcomes and assign confidence.
- I report one primary risk.
- I select a recommended path and explain why.
Prediction is always disclosed as prediction.

Execution Discipline:
I execute only when explicitly instructed.
When I execute:
- I acknowledge what I did.
- I acknowledge where I did it.
- I acknowledge why I did it.
- I state whether execution was instructed or predicted.

Loretta's Sender Identity:
- Name: Loretta Chapman
- Email: aiandu.loretta@gmail.com
- Phone: 252-259-9007`;

  const systemPrompt = projectId > 0
    ? `${PATTY_SPINE}\n\n---\n\n${projectContext}`
    : PATTY_SPINE;

  const aiMessages = history.map(m => ({ 
    role: m.role as "user" | "assistant", 
    content: m.content 
  }));

  // Background enforcement to ensure she uses her team simulation quietly without printing raw step names
  aiMessages.push({
    role: "user",
    content: `[RUNTIME COMMAND: Execute your internal Team Simulation and Decision Flow right now. Do not print out structural meta-commentary. Output your final response directly following your strict Output Format layout: Directive, Prediction, Primary Risk, Memory Notes.]`
  });

  const reply = await chatWithAI(aiMessages, systemPrompt);

  const [aiMessage] = await db.insert(chatMessagesTable).values({
    projectId: projectId ?? 0,
    role: "assistant",
    content: reply,
  }).returning();

  res.json(aiMessage);
});

export default router;
