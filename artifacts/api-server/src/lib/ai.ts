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
  const prompt = `You are an expert business analyst and venture scout. Analyze this software project and return a JSON object with these fields:
- summary: A compelling 2-3 sentence description of what this project does and why it matters
- valueProp: The core value proposition in 1-2 punchy sentences (what problem it solves, who benefits)
- targetAudience: Who should buy or invest in this — be specific (e.g. "Series A B2B SaaS startups needing X", "Record labels scouting AI tools")
- estimatedValue: A realistic valuation/licensing range (e.g. "$5k-$25k freelance build", "$50k-$200k acquisition target", "MVP worth $10k-$50k to investors")

Project name: ${project.name}
Description: ${project.description || "Not provided"}
Language: ${project.language || "Unknown"}
Topics: ${project.topics || "None"}
README excerpt: ${project.readme ? project.readme.slice(0, 2000) : "Not available"}

Return only valid JSON, no markdown.`;

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
  const prompt = `You are a technical writer and business development expert. Write a professional 1-page pitch document / white paper for this software project that could be sent to investors, acquirers, or licensing partners.

Project: ${project.name}
Summary: ${project.summary || project.description}
Value Proposition: ${project.valueProp || "Not analyzed yet"}
Target Audience: ${project.targetAudience || "Not analyzed yet"}
Technology: ${project.language || "Unknown"}
Estimated Value: ${project.estimatedValue || "TBD"}

Structure it as:
1. Executive Summary (2-3 sentences)
2. The Problem
3. Our Solution
4. Technology Overview
5. Market Opportunity
6. Target Buyers / Use Cases
7. Value & Pricing
8. Next Steps / Call to Action

Keep it under 600 words. Professional but energetic. No fluff. End with a clear CTA.`;

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
  const prompt = `You are a startup advisor and sales strategist. Give 5-7 specific, actionable suggestions to improve and sell this software project. Focus on: landing pages, demo assets, pricing strategies, partnership opportunities, cold outreach tactics, technical improvements that increase value.

Project: ${project.name}
Summary: ${project.summary || "Not analyzed yet"}
Value Prop: ${project.valueProp || "Unknown"}
Target Audience: ${project.targetAudience || "Unknown"}
Current Status: ${project.status}

Return a JSON object with a "suggestions" array of strings. Each suggestion should be 1-2 sentences. No platitudes.`;

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
  const prompt = `You are a business development expert writing a cold outreach email to sell or license a software project. Write a compelling ${toneDesc} email.

Project: ${opts.project.name}
What it does: ${opts.project.summary || opts.project.valueProp || "A software project"}
Estimated value: ${opts.project.estimatedValue || "negotiable"}
Recipient name: ${opts.toName || "there"}

Return a JSON object with:
- subject: Email subject line (punchy, specific, no clickbait)
- body: Email body (under 200 words, ${toneDesc} tone, ends with a specific CTA like "15-min call this week?")

No markdown in the email body. Plain text only.`;

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
