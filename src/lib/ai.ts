import { GoogleGenerativeAI } from '@google/generative-ai';
import { Mistral } from '@mistralai/mistralai';
import { getDb } from './db';

// ── Provider detection ────────────────────────────────────────────────────────

type Provider = 'mistral' | 'google';

function getProviderConfig(): { provider: Provider; key: string } {
  const db = getDb();
  const get = (k: string) =>
    (db.prepare('SELECT value FROM settings WHERE key = ?').get(k) as { value: string } | undefined)?.value || '';

  const mistralKey = get('mistral_api_key') || process.env.MISTRAL_API_KEY || '';
  const googleKey  = get('api_key')         || process.env.GOOGLE_API_KEY  || '';

  // Mistral takes priority when both are set
  if (mistralKey) return { provider: 'mistral', key: mistralKey };
  if (googleKey)  return { provider: 'google',  key: googleKey };

  throw new Error('No AI API key configured. Add your Mistral or Google key in Settings.');
}

// ── Shared helpers ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = [
  'You are a medical AI assistant for a pharmacist/clinician.',
  'Format responses clearly: use short paragraphs, numbered lists for steps, and plain bold for drug names.',
  'Never use raw markdown symbols like ** or * — write naturally.',
  'Be concise, specific, and clinically relevant.',
].join('\n');

function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
}

// ── Mistral implementations ───────────────────────────────────────────────────

const MISTRAL_MODEL = 'mistral-small-latest';

async function mistralGenerateText(key: string, prompt: string): Promise<string> {
  const client = new Mistral({ apiKey: key });
  const res = await client.chat.complete({
    model: MISTRAL_MODEL,
    messages: [{ role: 'user', content: prompt }],
  });
  return (res.choices?.[0]?.message?.content as string) ?? '';
}

async function* mistralChatStream(
  key: string,
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  articleContext?: string
): AsyncGenerator<string> {
  const client = new Mistral({ apiKey: key });
  const systemMsg = articleContext
    ? `${SYSTEM_PROMPT}\n\nThe user has recently engaged with these articles:\n${articleContext}`
    : SYSTEM_PROMPT;

  const messages = [
    { role: 'system' as const, content: systemMsg },
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: message },
  ];

  const stream = await client.chat.stream({ model: MISTRAL_MODEL, messages });
  for await (const chunk of stream) {
    const text = chunk.data.choices?.[0]?.delta?.content;
    if (text) yield text as string;
  }
}

async function mistralChat(
  key: string,
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  articleContext?: string
): Promise<string> {
  let result = '';
  for await (const chunk of mistralChatStream(key, message, history, articleContext)) result += chunk;
  return result;
}

// ── Google implementations ────────────────────────────────────────────────────

const GOOGLE_MODEL_CHAIN = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];

function buildGoogleChatModel(key: string, modelName: string, articleContext?: string) {
  const genAI = new GoogleGenerativeAI(key);
  const systemInstruction = articleContext
    ? `${SYSTEM_PROMPT}\n\nThe user has recently engaged with these articles:\n${articleContext}`
    : SYSTEM_PROMPT;
  return genAI.getGenerativeModel({ model: modelName, systemInstruction });
}

async function googleGenerateText(key: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(key);
  let lastErr: unknown;
  for (const modelName of GOOGLE_MODEL_CHAIN) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      lastErr = err;
      if (!isQuotaError(err)) throw err;
    }
  }
  throw lastErr;
}

async function* googleChatStream(
  key: string,
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  articleContext?: string
): AsyncGenerator<string> {
  const mappedHistory = history.map(m => ({
    role: m.role === 'assistant' ? 'model' as const : 'user' as const,
    parts: [{ text: m.content }],
  }));
  let lastErr: unknown;
  for (const modelName of GOOGLE_MODEL_CHAIN) {
    try {
      const model = buildGoogleChatModel(key, modelName, articleContext);
      const chat = model.startChat({ history: mappedHistory });
      const result = await chat.sendMessageStream(message);
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
      }
      return;
    } catch (err) {
      lastErr = err;
      if (!isQuotaError(err)) throw err;
    }
  }
  throw lastErr;
}

// ── Public API ────────────────────────────────────────────────────────────────

async function generateText(prompt: string): Promise<string> {
  const { provider, key } = getProviderConfig();
  if (provider === 'mistral') return mistralGenerateText(key, prompt);
  return googleGenerateText(key, prompt);
}

export async function generateChat(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  articleContext?: string
): Promise<string> {
  const { provider, key } = getProviderConfig();
  if (provider === 'mistral') return mistralChat(key, message, history, articleContext);

  const mappedHistory = history.map(m => ({
    role: m.role === 'assistant' ? 'model' as const : 'user' as const,
    parts: [{ text: m.content }],
  }));
  let lastErr: unknown;
  for (const modelName of GOOGLE_MODEL_CHAIN) {
    try {
      const model = buildGoogleChatModel(key, modelName, articleContext);
      const chat = model.startChat({ history: mappedHistory });
      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (err) {
      lastErr = err;
      if (!isQuotaError(err)) throw err;
    }
  }
  throw lastErr;
}

export async function generateChatStream(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  articleContext?: string
): Promise<AsyncIterable<string>> {
  const { provider, key } = getProviderConfig();
  if (provider === 'mistral') return mistralChatStream(key, message, history, articleContext);
  return googleChatStream(key, message, history, articleContext);
}

// ── Article analysis ──────────────────────────────────────────────────────────

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
  const normalized = text.replace(/\r\n/g, '\n');
  const paragraphs = normalized.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  if (paragraphs.length >= 2) return paragraphs.join('\n\n');

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

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 5000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const isRateLimit = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
      if (isRateLimit && i < retries - 1) {
        await new Promise(r => setTimeout(r, delayMs * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
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
      const result = await withRetry(() => analyzeArticle(article.title, article.full_text || article.title));
      if (result.summary) updateSummary.run(result.summary, article.id);
      for (const tagName of result.tags) {
        const tag = getTags.get(tagName) as { id: number } | undefined;
        if (tag) insertTag.run(article.id, tag.id);
      }
      processed++;
      if (processed < articles.length) await new Promise(r => setTimeout(r, 2000));
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
