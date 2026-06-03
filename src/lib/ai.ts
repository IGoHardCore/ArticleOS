import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDb } from './db';

function getGoogleKey(): string {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('api_key') as { value: string } | undefined;
  const key = row?.value || process.env.GOOGLE_API_KEY || '';
  if (!key) throw new Error('No Google AI Studio API key configured. Add your key in Settings.');
  return key;
}

// gemini-2.0-flash: 1500 free requests/day vs gemini-2.5-flash's 20/day
const CHAT_MODEL = 'gemini-2.0-flash';
const TEXT_MODEL = 'gemini-2.0-flash';

async function generateText(prompt: string): Promise<string> {
  const key = getGoogleKey();
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: TEXT_MODEL });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

function buildChatModel(key: string, articleContext?: string) {
  const genAI = new GoogleGenerativeAI(key);
  const systemInstruction = [
    'You are a medical AI assistant for a pharmacist/clinician.',
    'Format responses clearly: use short paragraphs, numbered lists for steps, and plain bold for drug names.',
    'Never use raw markdown symbols like ** or * — write naturally.',
    'Be concise, specific, and clinically relevant.',
    articleContext ? `The user has recently engaged with these articles:\n${articleContext}` : '',
  ].filter(Boolean).join('\n');
  return genAI.getGenerativeModel({ model: CHAT_MODEL, systemInstruction });
}

export async function generateChat(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  articleContext?: string
): Promise<string> {
  const key = getGoogleKey();
  const model = buildChatModel(key, articleContext);
  const chat = model.startChat({
    history: history.map(m => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: m.content }],
    })),
  });
  const result = await chat.sendMessage(message);
  return result.response.text();
}

export async function generateChatStream(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  articleContext?: string
): Promise<AsyncIterable<string>> {
  const key = getGoogleKey();
  const model = buildChatModel(key, articleContext);
  const chat = model.startChat({
    history: history.map(m => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: m.content }],
    })),
  });
  const result = await chat.sendMessageStream(message);
  async function* textStream() {
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }
  return textStream();
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

function ensureTwoParagraphs(text: string): string {
  if (!text) return text;
  // Normalize any \r\n or single \n between sentences into \n\n
  const normalized = text.replace(/\r\n/g, '\n');
  const paragraphs = normalized.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  if (paragraphs.length >= 2) return paragraphs.join('\n\n');

  // Only one paragraph — split at a sentence boundary near the midpoint
  const sentences = normalized.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) return normalized;
  const mid = Math.ceil(sentences.length / 2);
  const p1 = sentences.slice(0, mid).join(' ').trim();
  const p2 = sentences.slice(mid).join(' ').trim();
  return p2 ? `${p1}\n\n${p2}` : p1;
}

export async function analyzeArticle(title: string, text: string): Promise<AIResult> {
  const content = text?.slice(0, 4000) || '';
  const prompt = `You are a medical/pharmacy news analyst. Analyze this article and respond with valid JSON only.

Article Title: ${title}
Article Content: ${content}

Available tags: ${TAG_LIST.join(', ')}

Respond with ONLY this JSON (no markdown fences, no extra text):
{
  "summary": "<PARAGRAPH 1: Key findings — what was discovered, the study design, the numbers.>\\n\\n<PARAGRAPH 2: Clinical/practical implications — how this changes prescribing, patient care, or pharmacy practice.>",
  "tags": ["tag1", "tag2"]
}

Rules:
- summary MUST contain exactly the two-paragraph structure above, separated by the literal characters \\n\\n
- Each paragraph must be 2-4 sentences minimum
- Be specific: include percentages, drug names, patient populations when available
- tags: pick 1-4 from the available list only`;

  const raw = await generateText(prompt);

  const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    const summary = ensureTwoParagraphs(parsed.summary || '');
    return {
      summary,
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t: string) => TAG_LIST.includes(t)) : [],
    };
  } catch {
    return { summary: ensureTwoParagraphs(raw.slice(0, 1200)), tags: [] };
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
