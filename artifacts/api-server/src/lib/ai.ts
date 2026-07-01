import OpenAI from "openai";

function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured. Add it in the Secrets panel.");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function analyzeProject(project: {
  name: string;
  description?: string | null;
  readme?: string | null;
  language?: string | null;
  topics?: string | null;
}): Promise<{
  summary: string;
  valueProp: string;
  targetAudience: string;
  estimatedValue: string;
}> {
  const hasReadme = !!project.readme;
  const hasDescription = !!project.description;

  const prompt = `You are Dexi, a business analyst working for Loretta Chapman. Analyze this specific software project and return a JSON object.

STRICT RULES — violating any of these makes the output worthless:
1. Every sentence must be grounded in a SPECIFIC detail from the data below. Name the actual thing: a real language, a real topic tag, a real line from the README, the actual repo name.
2. Do NOT write phrases like "innovative solution," "leverages advanced algorithms," "streamlines processes," "enhances productivity," "cutting-edge," or any phrase that could be copy-pasted onto a different project unchanged.
3. If the README is missing and the description is thin, say so honestly in the summary and work only from what IS there. Do not invent capabilities.
4. estimatedValue must be based on: language ecosystem, apparent complexity from the README/topics, and comparable open-source acquisitions — not a default range.

Project name: ${project.name}
Language: ${project.language || "Unknown"}
Topics: ${project.topics || "None"}
Description: ${hasDescription ? project.description : "None provided"}
README: ${hasReadme ? project.readme!.slice(0, 3000) : "No README available — work only from name, language, and topics"}

Return ONLY valid JSON with these fields:
- summary: 2-3 sentences describing what this project actually does, citing specific evidence from the data
- valueProp: 1-2 sentences on the specific problem it solves, grounded in real details above
- targetAudience: Specific buyer profile (e.g. "fintech startups building X on Y stack", not "tech companies")
- estimatedValue: Realistic range with brief reasoning tied to the actual tech and complexity shown`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content ?? "{}";
  return JSON.parse(content);
}

export async function generateWhitepaper(project: {
  name: string;
  summary?: string | null;
  valueProp?: string | null;
  targetAudience?: string | null;
  description?: string | null;
  language?: string | null;
  estimatedValue?: string | null;
}): Promise<string> {
  const prompt = `You are Dexi, writing a pitch document for Loretta Chapman's project. This document will be sent to real buyers and investors. Every claim must be specific and defensible.

STRICT RULES:
1. Do not write any sentence that could apply unchanged to a different project. Every claim must name something specific to ${project.name}.
2. Do not use: "innovative," "cutting-edge," "leverages advanced algorithms," "streamlines processes," "enhance productivity," or similar filler.
3. If data is thin (no summary, no value prop), say what IS known and be honest about what analysis is still needed — do not pad with generic market observations.
4. The Problem and Our Solution sections must be specific to the actual use case evident in the data, not a generic software category.

Project: ${project.name}
What it does: ${project.summary || project.description || "Insufficient data — base sections only on the name and technology below"}
Value Proposition: ${project.valueProp || "Not yet analyzed — note this gap in the document"}
Target Audience: ${project.targetAudience || "Not yet defined — note this gap"}
Technology: ${project.language || "Unknown"}
Estimated Value: ${project.estimatedValue || "Not yet assessed"}

Write a pitch document with these sections. Under 600 words. End with a direct call to action naming the specific ask (acquisition conversation, licensing discussion, pilot engagement — pick the one that fits the project):
1. Executive Summary
2. The Problem
3. Our Solution
4. Technology Overview
5. Target Buyers / Use Cases
6. Value & Pricing
7. Call to Action`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content ?? "";
}

export async function generateSuggestions(project: {
  name: string;
  summary?: string | null;
  valueProp?: string | null;
  targetAudience?: string | null;
  status: string;
}): Promise<string[]> {
  const prompt = `You are Dexi, a sales strategist working for Loretta Chapman. Give 5-7 specific, actionable suggestions for this project.

STRICT RULES:
1. Every suggestion must reference something specific to ${project.name} — a real capability, tech choice, or identified audience. No suggestion that could apply to any software project.
2. Do not suggest "build a landing page" or "write case studies" without specifying exactly what angle, what claim, what audience segment makes it specific to this project.
3. If data is thin, say so and give fewer, more honest suggestions rather than padding with generic advice.

Project: ${project.name}
Summary: ${project.summary || "Not yet analyzed — flag this gap"}
Value Prop: ${project.valueProp || "Unknown"}
Target Audience: ${project.targetAudience || "Unknown"}
Current Status: ${project.status}

Return a JSON object with a "suggestions" array of strings. Each 1-2 sentences. Specific, not generic.`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content ?? '{"suggestions":[]}';
  const parsed = JSON.parse(content);
  return parsed.suggestions ?? [];
}

export async function generateOutreachEmail(opts: {
  project: { name: string; summary?: string | null; valueProp?: string | null; estimatedValue?: string | null };
  toName?: string | null;
  tone?: string | null;
}): Promise<{ subject: string; body: string }> {
  const toneDesc = opts.tone === "bold" ? "bold and direct" : opts.tone === "friendly" ? "warm and conversational" : "professional and concise";
  const prompt = `You are Dexi, writing a cold outreach email for Loretta Chapman to sell or license a software project. The email must be ${toneDesc}, specific to this project, and ready to send.

RULES:
1. Subject line must reference the project name or a specific capability — no generic clickbait.
2. Body must mention at least one concrete, specific detail about what the project does (from the data below).
3. Do NOT use "innovative," "cutting-edge," "leverage," or filler phrases.
4. End with a specific CTA (e.g. "15-minute call this week?" or "Want a live demo?").
5. Close with Loretta's full signature exactly as shown below — do not alter it.

Project: ${opts.project.name}
What it does: ${opts.project.summary || opts.project.valueProp || "A software project"}
Estimated value: ${opts.project.estimatedValue || "negotiable"}
Recipient name: ${opts.toName || "there"}

Signature to use verbatim:
Loretta Chapman
aiandu.loretta@gmail.com
252-259-9007

Return a JSON object with:
- subject: Email subject line
- body: Full email body including the signature above, under 220 words total. Plain text only, no markdown.`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content ?? "{}";
  return JSON.parse(content);
}

export async function discoverContacts(project: {
  name: string;
  summary?: string | null;
  targetAudience?: string | null;
  language?: string | null;
}): Promise<Array<{
  name: string;
  company: string;
  type: string;
  reason: string;
  searchQuery: string;
}>> {
  const prompt = `You are a business development expert. Suggest 6-8 specific types of people and companies to reach out to for selling or licensing this software project.

Project: ${project.name}
Summary: ${project.summary || "A software project"}
Target Audience: ${project.targetAudience || "Not defined"}
Technology: ${project.language || "Unknown"}

Return a JSON object with a "contacts" array. Each item has:
- name: A realistic type of person (e.g. "CTO", "Head of Product", "VP Engineering")
- company: A specific type of company (e.g. "Series A fintech startup", "mid-size e-commerce brand")
- type: one of: investor, collaborator, buyer, label, publisher, other
- reason: 1 sentence why they'd want this project
- searchQuery: A LinkedIn/Google search query to find them

Be specific. No generic suggestions like "any tech company".`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content ?? '{"contacts":[]}';
  const parsed = JSON.parse(content);
  return parsed.contacts ?? [];
}

export async function chatWithAI(messages: Array<{ role: "user" | "assistant"; content: string }>, systemContext: string): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemContext },
      ...messages,
    ],
  });
  return response.choices[0].message.content ?? "I couldn't generate a response.";
}
