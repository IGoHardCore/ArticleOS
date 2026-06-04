import Parser from 'rss-parser';
import { db } from './db';

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'ArticleOS/1.0 RSS Reader' },
});

interface FeedSource {
  name: string;
  url: string;
}

const FEEDS: FeedSource[] = [
  { name: 'PubMed Latest', url: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/?term=medicine+pharmacy&sort=date&format=rss' },
  { name: 'STAT News', url: 'https://www.statnews.com/feed/' },
  { name: 'MedPage Today', url: 'https://www.medpagetoday.com/rss/headlines.xml' },
  { name: 'Pharmacy Times', url: 'https://www.pharmacytimes.com/rss/news' },
  { name: 'Drug Topics', url: 'https://www.drugtopics.com/rss/all' },
  { name: 'NEJM', url: 'https://www.nejm.org/action/showFeed?jc=nejm&type=etoc&feed=rss' },
  { name: 'The Lancet', url: 'https://www.thelancet.com/rssfeed/lancet_online.xml' },
  { name: 'FDA News', url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/fda-news-releases/rss.xml' },
  { name: 'NIH News', url: 'https://www.nih.gov/news-events/news-releases/feed' },
  { name: 'Science Daily - Medicine', url: 'https://www.sciencedaily.com/rss/health_medicine/pharmaceuticals.xml' },
  { name: 'Reuters Health', url: 'https://feeds.reuters.com/reuters/healthNews' },
  { name: 'Fierce Pharma', url: 'https://www.fiercepharma.com/rss/xml' },
  { name: 'BioPharma Dive', url: 'https://www.biopharmadive.com/feeds/news/' },
  { name: 'Cancer Research UK', url: 'https://news.cancerresearchuk.org/feed/' },
  { name: 'Healio', url: 'https://www.healio.com/rss/pharmacy' },
];

export interface ScrapedArticle {
  title: string;
  url: string;
  summary: string | null;
  source: string;
  author: string | null;
  image_url: string | null;
  published_at: string | null;
  full_text: string | null;
}

export async function scrapeFeeds(): Promise<{ added: number; skipped: number; errors: string[] }> {
  let added = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const feed of FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      for (const item of parsed.items.slice(0, 20)) {
        if (!item.title || !item.link) continue;
        const rssSnippet = stripHtml(item.contentSnippet || item.summary || '');
        const rssContent = stripHtml(item.content || item['content:encoded'] || '');
        const fullText = rssContent.length > rssSnippet.length ? rssContent : rssSnippet;
        const imageUrl = extractImageUrl(item);
        const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : null;

        const { data, error } = await db.from('articles').insert({
          title: item.title.trim(),
          url: item.link,
          summary: null,
          source: feed.name,
          author: item.creator || item.author || null,
          image_url: imageUrl,
          published_at: publishedAt,
          full_text: fullText || null,
        }).select('id');
        if (error) {
          if (error.code === '23505') skipped++; // unique URL violation
          else errors.push(`${feed.name}: ${error.message}`);
        } else if (data?.length) {
          added++;
        } else {
          skipped++;
        }
      }
    } catch (err) {
      errors.push(`${feed.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { added, skipped, errors };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractImageUrl(item: Record<string, unknown>): string | null {
  if (item.enclosure && typeof item.enclosure === 'object') {
    const enc = item.enclosure as Record<string, unknown>;
    if (typeof enc.url === 'string' && enc.url) return enc.url;
  }
  const content = String(item['content:encoded'] || item.content || '');
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match) return match[1];
  return null;
}
