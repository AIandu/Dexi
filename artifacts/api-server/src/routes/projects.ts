import { Router } from "express";
import { db } from "@workspace/db";
import { projectsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  analyzeProject,
  generateWhitepaper,
  generateSuggestions
} from "../lib/ai.js";

const router = Router();

router.get("/", async (req, res) => {
  const projects = await db.select().from(projectsTable).orderBy(projectsTable.createdAt);
  res.json(projects);
});

router.post("/", async (req, res) => {
  const { name, description, githubUrl, status = "draft" } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const [project] = await db.insert(projectsTable).values({ name, description, githubUrl, status }).returning();
  res.status(201).json(project);
});

router.post("/import-github", async (req, res) => {
  const { usernames } = req.body as { usernames: string[] };
  if (!usernames?.length) return res.status(400).json({ error: "usernames required" });

  const token = process.env.GITHUB_TOKEN;
  const ghHeaders: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchAllRepos = async (username: string): Promise<any[]> => {
    const all: any[] = [];
    let page = 1;
    while (true) {
      const url = token
        ? `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner`
        : `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=updated`;
      const resp = await fetch(url, { headers: ghHeaders });
      if (!resp.ok) break;
      const batch: any[] = await resp.json();
      if (!batch.length) break;
      all.push(...batch);
      if (batch.length < 100) break;
      page++;
    }
    return all;
  };

  const imported: any[] = [];

  for (const username of usernames) {
    try {
      const repos = await fetchAllRepos(username);

      for (const repo of repos) {
        if (repo.fork) continue;

        let readme: string | null = null;
        try {
          const readmeRes = await fetch(`https://api.github.com/repos/${repo.full_name}/readme`, {
            headers: { ...ghHeaders, Accept: "application/vnd.github.v3.raw" },
          });
          if (readmeRes.ok) readme = await readmeRes.text();
        } catch { /* no readme */ }

        const [project] = await db.insert(projectsTable).values({
          name: repo.name,
          description: repo.description,
          githubUrl: repo.html_url,
          repoOwner: repo.owner.login,
          repoName: repo.name,
          language: repo.language,
          stars: repo.stargazers_count,
          topics: repo.topics?.join(",") || null,
          readme: readme ? readme.slice(0, 20000) : null,
          status: "draft",
        }).returning();

        imported.push(project);
      }
    } catch (err: any) {
      req.log.warn({ err, username }, "Failed to import repos for user");
    }
  }

  res.json(imported);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, status, estimatedValue, summary, valueProp, targetAudience } = req.body;

  const [updated] = await db.update(projectsTable)
    .set({ name, description, status, estimatedValue, summary, valueProp, targetAudience, updatedAt: new Date() })
    .where(eq(projectsTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(projectsTable).where(eq(projectsTable.id, id));
  res.status(204).send();
});

router.post("/:id/refresh-readme", async (req, res) => {
  const id = Number(req.params.id);
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) return res.status(404).json({ error: "Not found" });
  if (!project.repoOwner || !project.repoName) return res.status(400).json({ error: "No GitHub repo linked to this project" });

  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3.raw",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const readmeRes = await fetch(`https://api.github.com/repos/${project.repoOwner}/${project.repoName}/readme`, { headers });
    if (!readmeRes.ok) return res.status(400).json({ error: `GitHub returned ${readmeRes.status} — repo may be private or have no README` });
    const readme = await readmeRes.text();
    const [updated] = await db.update(projectsTable)
      .set({ readme: readme.slice(0, 20000), updatedAt: new Date() })
      .where(eq(projectsTable.id, id))
      .returning();
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch README from GitHub" });
  }
});

router.post("/:id/analyze", async (req, res) => {
  const id = Number(req.params.id);
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) return res.status(404).json({ error: "Not found" });

  const analysis = await analyzeProject({
    name: project.name,
    description: project.description,
    readme: project.readme,
    language: project.language,
    topics: project.topics,
  });

  const [updated] = await db.update(projectsTable)
    .set({
      summary: analysis.summary,
      valueProp: analysis.valueProp,
      targetAudience: analysis.targetAudience,
      estimatedValue: analysis.estimatedValue,
      status: "analyzed",
      updatedAt: new Date(),
    })
    .where(eq(projectsTable.id, id))
    .returning();

  res.json(updated);
});

router.post("/:id/whitepaper", async (req, res) => {
  const id = Number(req.params.id);
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) return res.status(404).json({ error: "Not found" });

  const content = await generateWhitepaper({
    name: project.name,
    summary: project.summary,
    valueProp: project.valueProp,
    targetAudience: project.targetAudience,
    description: project.description,
    language: project.language,
    estimatedValue: project.estimatedValue,
  });

  await db.update(projectsTable)
    .set({ whitepaper: content, updatedAt: new Date() })
    .where(eq(projectsTable.id, id));

  res.json({ projectId: id, content });
});

router.get("/:id/suggestions", async (req, res) => {
  const id = Number(req.params.id);
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) return res.status(404).json({ error: "Not found" });

  const suggestions = await generateSuggestions({
    name: project.name,
    summary: project.summary,
    valueProp: project.valueProp,
    targetAudience: project.targetAudience,
    status: project.status,
  });

  res.json({ projectId: id, suggestions });
});

export default router;
