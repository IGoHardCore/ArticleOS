import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDb } from './db';

function getGoogleKey(): string {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('api_key') as { value: string } | undefined;
  const key = row?.value || process.env.GOOGLE_API_KEY || '';
  if (!key) throw new Error('No Google AI Studio API key configured. Add your key in Settings.');
  return key;
}

async function generateText(prompt: string): Promise<string> {
  const key = getGoogleKey();
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateChat(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const key = getGoogleKey();
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: 'You are a medical AI assistant for a pharmacist/clinician. Answer questions about medical topics, drug interactions, clinical research, and pharmacy practice. Be concise, accurate, and clinically relevant. Use plain language.',
  });
  const chat = model.startChat({
    history: history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  });
  const result = await chat.sendMessage(message);
  return result.response.text();
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
  const content = text?.slice(0, 4000) || '';
  const prompt = `You are a medical/pharmacy news analyst. Analyze this article and respond with valid JSON only.\n\nArticle Title: ${title}\nArticle Content: ${content}\n\nAvailable tags: ${TAG_LIST.join(', ')}\n\nRespond with this exact JSON structure (no markdown, no extra text):\n{\n  "summary": "Write 2-3 paragraphs in plain English that a pharmacy professional can quickly absorb. Paragraph 1: What was discovered or changed and the key findings. Paragraph 2: Clinical or practical implications — how this affects patient care, prescribing, or pharmacy practice. Paragraph 3 (optional): Context, limitations, or what comes next. Use \\n\\n to separate paragraphs.",\n  "tags": ["tag1", "tag2"]\n}\n\nRules:\n- summary: Minimum 2 paragraphs separated by \\n\\n. Be specific with numbers/percentages when available.\n- tags: Pick 1-4 most relevant tags from the available list only`;

  const raw = await generateText(prompt);

  // Strip markdown code fences if present (Gemini sometimes wraps in ```json)
  const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      summary: parsed.summary || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t: string) => TAG_LIST.includes(t)) : [],
    };
  } catch {
    return { summary: raw.slice(0, 800), tags: [] };
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
  const prompt = `You are a research assistant for a pharmacy/medicine professional. Based on their research notes and interests, provide actionable guidance.\n\nResearch focus areas: ${tags.join(', ')}\n\nTheir current notes:\n${notes}\n\nProvide:\n1. A brief assessment of their research progress (2-3 sentences)\n2. 3 specific next steps they should take\n3. Any knowledge gaps you notice\n4. One key question they should be trying to answer\n\nKeep it practical and concise. Plain language, no fluff.`;
  return generateText(prompt);
}
