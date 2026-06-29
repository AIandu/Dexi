import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const outreachEmailsTable = pgTable("outreach_emails", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id"),
  contactId: integer("contact_id"),
  toEmail: text("to_email").notNull(),
  toName: text("to_name"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("draft"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOutreachEmailSchema = createInsertSchema(outreachEmailsTable).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

export type InsertOutreachEmail = z.infer<typeof insertOutreachEmailSchema>;
export type OutreachEmail = typeof outreachEmailsTable.$inferSelect;
