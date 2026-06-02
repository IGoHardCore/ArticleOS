import Anthropic from '@anthropic-ai/sdk';
import { getDb } from './db';

function getClient(): Anthropic {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('api_key') as { value: string } | undefined;
  const key = row?.value || process.env.ANTHROPIC_API_KEY || '';
  if (!key) throw new Error('No API key configured. Add your Anthropic API key in Settings.');
  return new Anthropic({ apiKey: key });
}

const TAG_LIST = [
  'cancer', 'cardiology', 'neurology', 'pharmacology', 'drug approval',
  'oncology', 'diabetes', 'immunology', 'genetics', 'clinical trial',
  'surgery', 'psychiatry', 'pediatrics', 'infectious disease', 'radiology',
  'pharmacy', 'breakthrough', 'FDA', 'research', 'public health',
];

export interface AIResult {
  summary: string;
  tags: string[];
}

export async function analyzeArticle(title: string, text: string): Promise<AIResult> {
  const client = getClient();
  const content = text?.slice(0, 3000) || '';

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `You are a medical/pharmacy news analyst. Analyze this article and respond with valid JSON only.\n\nArticle Title: ${title}\nArticle Content: ${content}\n\nAvailable tags: ${TAG_LIST.join(', ')}\n\nRespond with this exact JSON structure (no markdown, no extra text):\n{\n  "summary": "2-3 sentence plain English summary a non-expert can understand. Focus on what changed or was discovered and why it matters.",\n  "tags": ["tag1", "tag2"]\n}\n\nRules:\n- summary: Keep it clear, concise, and jargon-free\n- tags: Pick 1-4 most relevant tags from the available list only`,
      },
    ],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const parsed = JSON.parse(raw.trim());
    return {
      summary: parsed.summary || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t: string) => TAG_LIST.includes(t)) : [],
    };
  } catch {
    return { summary: raw.slice(0, 500), tags: [] };
  }
}

export async function processUnanalyzedArticles(limit = 10): Promise<number> {
  const db = getDb();
  const articles = db
    .prepare(`SELECT id, title, full_text, summary FROM articles WHERE summary IS NULL OR summary = '' LIMIT ?`)
    .all(limit) as Array<{ id: number; title: string; full_text: string; summary: string }>;

  const getTags = db.prepare(`SELECT t.id FROM tags t WHERE t.name = ?`);
  const insertTag = db.prepare(`INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)`);
  const updateSummary = db.prepare(`UPDATE articles SET summary = ? WHERE id = ?`);

  let processed = 0;

  for (const article of articles) {
    try {
      const result = await analyzeArticle(article.title, article.full_text || article.title);
      if (result.summary) updateSummary.run(result.summary, article.id);
      for (const tagName of result.tags) {
        const tag = getTags.get(tagName) as { id: number } | undefined;
        if (tag) insertTag.run(article.id, tag.id);
      }
      processed++;
    } catch (err) {
      console.error(`Failed to analyze article ${article.id}:`, err);
    }
  }

  return processed;
}

export async function getResearchGuidance(notes: string, tags: string[]): Promise<string> {
  const client = getClient();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: `You are a research assistant for a pharmacy/medicine professional. Based on their research notes and interests, provide actionable guidance.\n\nResearch focus areas: ${tags.join(', ')}\n\nTheir current notes:\n${notes}\n\nProvide:\n1. A brief assessment of their research progress (2-3 sentences)\n2. 3 specific next steps they should take\n3. Any knowledge gaps you notice\n4. One key question they should be trying to answer\n\nKeep it practical and concise. Plain language, no fluff.`,
      },
    ],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}
