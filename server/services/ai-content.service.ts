/**
 * AI Content Generation Service
 *
 * Uses Hugging Face Inference API via the router with the Together provider
 * and Mistral-7B-Instruct to rewrite page content based on the user's niche.
 */

import { createServiceLogger } from '../utils/logger.js';
import * as wpService from './wordpress.service.js';

const logger = createServiceLogger('ai-content');

// HF Router with Together provider (supports Mistral-7B-Instruct-v0.2)
const HF_API_URL = 'https://router.huggingface.co/together/v1/chat/completions';
const HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';

function getHfToken(): string {
  const token = process.env.HF_API_TOKEN;
  if (!token) {
    throw new Error('HF_API_TOKEN environment variable is not set. Add it to your .env file.');
  }
  return token;
}

/**
 * Build the system prompt for rewriting page content.
 */
function buildSystemPrompt(niche: string): string {
  return `You are a WordPress page-copy rewriting engine.

Task: Rewrite the provided WordPress page content so it is specifically tailored to the niche: ${niche}.

Rules:
- Preserve the original structure exactly: section order, headings, formatting, WordPress blocks, HTML, shortcodes, lists, links, buttons, placeholders, and layout must remain unchanged.
- Only rewrite user-visible text content. Do not modify attribute values such as URLs, image references, IDs, classes, shortcode attributes, alt, aria-*, or data-* fields.
- Maintain the original intent, tone, and audience level of each section (e.g. hero, benefits, features, testimonials, FAQ, CTA), but replace generic language with concrete, ${niche}-specific terminology, services, value propositions, and use cases.
- Do not add new sections, remove sections, or reorganize content. Sentence length may be adjusted slightly for clarity and natural flow within the existing structure.
- Avoid vague or generic filler. Make the copy specific and relevant to ${niche}.
- Do not invent regulated claims, guarantees, certifications, or credentials unless they already exist in the original content.
- Keep the overall length of each section roughly comparable to the original unless minor expansion improves clarity.

Output:
- Return ONLY the rewritten WordPress-compatible content.
- No commentary, no explanations, no markdown wrappers, and no additional text.`;
}

/**
 * Call Hugging Face Inference API via the router (OpenAI-compatible chat completions format).
 */
async function callHuggingFace(systemPrompt: string, userContent: string): Promise<string> {
  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getHfToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: HF_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Hugging Face API error (${response.status}): ${errorBody}`);
  }

  const result = await response.json() as {
    choices?: Array<{
      message?: { content?: string };
    }>;
  };

  // OpenAI-compatible response format
  if (result.choices && result.choices.length > 0) {
    const content = result.choices[0].message?.content?.trim();
    if (content) return content;
  }

  throw new Error('Unexpected Hugging Face API response format');
}

/**
 * Rewrite a single page's content using AI.
 */
async function rewritePageContent(
  pageContent: string,
  niche: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt(niche);
  const userMessage = `Here is the WordPress page content to rewrite:\n\n${pageContent}`;

  const rewritten = await callHuggingFace(systemPrompt, userMessage);
  return rewritten;
}

/**
 * Discover all published pages in the WordPress site.
 * Returns an array of { id, title, content } objects.
 */
export async function discoverPages(
  sitePath: string
): Promise<Array<{ id: number; title: string; content: string }>> {
  logger.info({ sitePath }, 'Discovering published pages');

  // Get list of published pages
  const { stdout: pagesJson } = await wpService.wpCli(
    ['post', 'list', '--post_type=page', '--post_status=publish', '--format=json', '--fields=ID,post_title'],
    { sitePath }
  );

  const pages: Array<{ ID: number; post_title: string }> = JSON.parse(pagesJson);
  logger.info({ sitePath, pageCount: pages.length }, 'Found published pages');

  const result: Array<{ id: number; title: string; content: string }> = [];

  for (const page of pages) {
    try {
      const { stdout: content } = await wpService.wpCli(
        ['post', 'get', page.ID.toString(), '--field=post_content'],
        { sitePath }
      );
      result.push({
        id: page.ID,
        title: page.post_title,
        content: content,
      });
    } catch (err) {
      logger.warn({ sitePath, pageId: page.ID, err }, 'Failed to fetch page content');
    }
  }

  return result;
}

/**
 * Update a page's post_content in the WordPress database.
 * Uses positional `-` argument so WP-CLI reads content from stdin.
 * (NOTE: `--post_content=-` would literally set the value to "-".)
 */
async function updatePageContent(
  sitePath: string,
  pageId: number,
  newContent: string
): Promise<void> {
  await wpService.wpCli(
    ['post', 'update', pageId.toString(), '-'],
    { sitePath },
    newContent  // Passed as stdin
  );
}

/**
 * Generate AI content for all pages in the site.
 * This is the main entry point called by the site generator.
 */
export async function generateAiContent(
  sitePath: string,
  niche: string,
  onProgress?: (message: string) => void
): Promise<{ pagesProcessed: number; pagesSkipped: number }> {
  logger.info({ sitePath, niche }, 'Starting AI content generation');

  let pagesProcessed = 0;
  let pagesSkipped = 0;

  // Step 1: Discover pages
  const pages = await discoverPages(sitePath);

  if (pages.length === 0) {
    logger.warn({ sitePath }, 'No published pages found to rewrite');
    return { pagesProcessed: 0, pagesSkipped: 0 };
  }

  // Step 2: For each page, rewrite content with AI
  for (const page of pages) {
    // Skip pages with very little content (empty or placeholder)
    if (!page.content || page.content.trim().length < 50) {
      logger.info({ pageId: page.id, title: page.title }, 'Skipping page with insufficient content');
      pagesSkipped++;
      continue;
    }

    try {
      onProgress?.(`Rewriting: ${page.title}`);
      logger.info({ pageId: page.id, title: page.title, contentLength: page.content.length }, 'Rewriting page content');

      // Call Hugging Face API for this page
      const rewrittenContent = await rewritePageContent(page.content, niche);

      if (rewrittenContent && rewrittenContent.length > 50) {
        // Step 3: Write back to WordPress
        await updatePageContent(sitePath, page.id, rewrittenContent);
        logger.info({ pageId: page.id, title: page.title }, 'Page content updated with AI-generated copy');
        pagesProcessed++;
      } else {
        logger.warn({ pageId: page.id, title: page.title }, 'AI returned insufficient content, keeping original');
        pagesSkipped++;
      }
    } catch (err) {
      logger.error({ pageId: page.id, title: page.title, err }, 'Failed to rewrite page');
      pagesSkipped++;
    }
  }

  logger.info(
    { sitePath, niche, pagesProcessed, pagesSkipped, totalPages: pages.length },
    'AI content generation completed'
  );

  return { pagesProcessed, pagesSkipped };
}
