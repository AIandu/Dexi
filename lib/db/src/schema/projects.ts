import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  githubUrl: text("github_url"),
  repoOwner: text("repo_owner"),
  repoName: text("repo_name"),
  language: text("language"),
  stars: integer("stars"),
  summary: text("summary"),
  valueProp: text("value_prop"),
  targetAudience: text("target_audience"),
  whitepaper: text("whitepaper"),
  estimatedValue: text("estimated_value"),
  status: text("status").notNull().default("draft"),
  readme: text("readme"),
  topics: text("topics"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
