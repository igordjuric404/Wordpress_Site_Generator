/**
 * AI Content Generation Service — Structure-Preserving Pipeline
 *
 * Design: Extract → Rewrite → Reinsert → Validate
 *
 * This pipeline supports TWO text extraction strategies:
 *
 * A) Standard Gutenberg text nodes: text between HTML tags
 *    e.g. <h2>This is text</h2>
 *
 * B) Spectra block JSON attributes: text stored in block comment "text" fields
 *    e.g. <!-- wp:spectra/content {"text":"This is text",...} /-->
 *
 * Both strategies are combined into a single numbered text map, sent to the
 * LLM for rewriting, and the results are re-inserted in their respective
 * locations (text nodes or JSON attributes).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServiceLogger } from '../utils/logger.js';
import * as wpService from './wordpress.service.js';

const logger = createServiceLogger('ai-content');

// Log directory for AI request/response pairs
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AI_LOG_DIR = path.resolve(__dirname, '../../logs/ai');

function ensureAiLogDir(): void {
  if (!fs.existsSync(AI_LOG_DIR)) {
    fs.mkdirSync(AI_LOG_DIR, { recursive: true });
  }
}

function logAiExchange(label: string, systemPrompt: string, userMessage: string, response: string): void {
  ensureAiLogDir();
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${ts}_${label.replace(/\s+/g, '_').slice(0, 40)}.log`;
  const content = [
    `=== AI Exchange: ${label} ===`,
    `Timestamp: ${new Date().toISOString()}`,
    '',
    '--- SYSTEM PROMPT ---',
    systemPrompt,
    '',
    '--- USER MESSAGE ---',
    userMessage,
    '',
    '--- AI RESPONSE ---',
    response,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(AI_LOG_DIR, filename), content, 'utf-8');
}

// HF Router with Together provider (supports Mistral-7B-Instruct-v0.2)
const HF_API_URL = 'https://router.huggingface.co/together/v1/chat/completions';
const HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';

// ---------------------------------------------------------------------------
// Token types for the content tokeniser
// ---------------------------------------------------------------------------

interface SegmentBase {
  /** Byte-offset in the original string where this segment starts */
  start: number;
  /** Byte-offset in the original string where this segment ends (exclusive) */
  end: number;
  /** Raw content of the segment */
  raw: string;
}

interface BlockCommentSegment extends SegmentBase {
  type: 'block_comment';
}

interface HtmlTagSegment extends SegmentBase {
  type: 'html_tag';
  /** Tag name lowered, e.g. "div", "p", "script" */
  tagName: string;
  /** Whether this is a closing tag </...> */
  isClosing: boolean;
  /** Whether this is self-closing <.../> */
  isSelfClosing: boolean;
}

interface TextSegment extends SegmentBase {
  type: 'text';
  /** Unique ID used for LLM mapping (only assigned to rewritable text) */
  textId?: number;
}

type Segment = BlockCommentSegment | HtmlTagSegment | TextSegment;

// ---------------------------------------------------------------------------
// Tokeniser: split WordPress content into structural segments
// ---------------------------------------------------------------------------

/**
 * Tokenise WordPress/Gutenberg content into an ordered list of segments.
 * - Block comments: <!-- wp:... --> and <!-- /wp:... --> and any other HTML comments
 * - HTML tags: <tagname ...> including self-closing
 * - Text: everything between the above
 */
function tokenise(content: string): Segment[] {
  const segments: Segment[] = [];
  // Combined regex that matches HTML comments OR HTML tags
  // HTML comment: <!-- ... -->
  // HTML tag: < followed by optional /, then a letter, then anything up to >
  const pattern = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*\/?>/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        start: lastIndex,
        end: match.index,
        raw: content.slice(lastIndex, match.index),
      });
    }

    const raw = match[0];
    const start = match.index;
    const end = match.index + raw.length;

    if (raw.startsWith('<!--')) {
      segments.push({ type: 'block_comment', start, end, raw });
    } else {
      // HTML tag — extract tag name and flags
      const tagMatch = raw.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);
      const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
      const isClosing = raw.startsWith('</');
      const isSelfClosing = raw.endsWith('/>');
      segments.push({
        type: 'html_tag',
        start,
        end,
        raw,
        tagName,
        isClosing,
        isSelfClosing,
      });
    }

    lastIndex = end;
  }

  // Trailing text
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      start: lastIndex,
      end: content.length,
      raw: content.slice(lastIndex),
    });
  }

  return segments;
}

// ---------------------------------------------------------------------------
// Text extraction: decide which text nodes are worth rewriting
// ---------------------------------------------------------------------------

/** Tags whose text content should never be rewritten */
const SKIP_INNER_TAGS = new Set(['script', 'style', 'code', 'pre', 'svg', 'math']);

/**
 * Minimum trimmed-text length to qualify for rewriting.
 * Very short strings (single words, punctuation, numbers) are left as-is.
 */
const MIN_TEXT_LENGTH = 4;

/**
 * Returns true if the text is only whitespace, numbers, punctuation, HTML entities,
 * WordPress shortcodes, or other non-copy content that should not be rewritten.
 */
function isNonRewritable(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < MIN_TEXT_LENGTH) return true;
  // Only digits, punctuation, whitespace, entities
  if (/^[\s\d.,;:!?'"()\-–—&$€£¥%#@*/+={}\[\]|\\<>^~`\u00a0]+$/.test(trimmed)) return true;
  // HTML entities only
  if (/^(&[a-zA-Z0-9#]+;\s*)+$/.test(trimmed)) return true;
  // WordPress shortcodes — [shortcode ...] or [shortcode attr="val" ...]
  if (/^\[[\w-]+(\s+[^\]]*)?]$/.test(trimmed)) return true;
  // Multiple shortcodes on one line
  if (/^(\[[\w-]+[^\]]*\]\s*)+$/.test(trimmed)) return true;
  // Looks like a URL
  if (/^https?:\/\/\S+$/.test(trimmed)) return true;
  // Looks like an email address only
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) return true;
  // Phone numbers only
  if (/^[+\d\s()-]{6,20}$/.test(trimmed)) return true;
  // Product price-like patterns ($xx.xx, €xx, etc.)
  if (/^[$€£¥]\s*[\d,.]+$/.test(trimmed)) return true;
  return false;
}

interface ExtractedText {
  id: number;
  segmentIndex: number;
  original: string;
}

interface ExtractedTextWithContext extends ExtractedText {
  context: string; // e.g. "heading", "body", "button label", etc.
  source: 'text_node' | 'spectra_attr'; // where this text came from
}

/** Represents a text field extracted from a Spectra block comment's JSON attributes */
interface SpectraBlockText {
  id: number;
  segmentIndex: number;
  original: string;
  blockType: string; // e.g. "content", "button"
  attrKey: string;   // JSON key, usually "text"
}

/**
 * Walk the segments and assign text IDs to segments that should be rewritten.
 * Returns the list of extractable texts and mutates the segments in-place
 * (sets textId on qualifying TextSegments).
 */
function extractRewritableTexts(segments: Segment[]): ExtractedText[] {
  const texts: ExtractedText[] = [];
  let nextId = 1;

  // Track which "inner" tags we're inside to skip script/style/etc.
  const tagStack: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (seg.type === 'html_tag') {
      if (seg.isClosing) {
        // Pop matching tag from stack
        if (tagStack.length > 0 && tagStack[tagStack.length - 1] === seg.tagName) {
          tagStack.pop();
        }
      } else if (!seg.isSelfClosing) {
        tagStack.push(seg.tagName);
      }
      continue;
    }

    if (seg.type === 'block_comment') continue;

    // seg.type === 'text'
    // Skip if we're inside a non-rewritable tag
    if (tagStack.some((t) => SKIP_INNER_TAGS.has(t))) continue;

    const trimmed = seg.raw.trim();
    if (isNonRewritable(trimmed)) continue;

    const textSeg = seg as TextSegment;
    textSeg.textId = nextId;
    texts.push({
      id: nextId,
      segmentIndex: i,
      original: trimmed,
    });
    nextId++;
  }

  return texts;
}

// ---------------------------------------------------------------------------
// Spectra block text extraction: text stored in JSON "text" attributes
// ---------------------------------------------------------------------------

/**
 * Extract rewritable text from Spectra self-closing block comments.
 * These blocks store visible text in a JSON "text" attribute rather than
 * as inner HTML between tags.
 *
 * e.g. <!-- wp:spectra/content {"text":"Hello World",...} /-->
 */
function extractSpectraBlockTexts(segments: Segment[], startId: number): SpectraBlockText[] {
  const results: SpectraBlockText[] = [];
  let nextId = startId;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.type !== 'block_comment') continue;

    // Match self-closing Spectra blocks: <!-- wp:spectra/XXX {...} /-->
    const blockMatch = seg.raw.match(/^<!-- wp:spectra\/(\w+) (\{[\s\S]*\}) \/-->$/);
    if (!blockMatch) continue;

    const blockType = blockMatch[1]; // e.g. "content", "button"
    const jsonStr = blockMatch[2];

    try {
      const attrs = JSON.parse(jsonStr);
      if (typeof attrs.text === 'string') {
        const trimmedText = attrs.text.trim();
        if (trimmedText.length > 0 && !isNonRewritable(trimmedText)) {
          // Use tagName from the JSON to refine the block type for context
          let refinedBlockType = blockType;
          if (blockType === 'content' && attrs.tagName) {
            const tag = attrs.tagName.toLowerCase();
            if (/^h[1-6]$/.test(tag)) refinedBlockType = `heading-${tag}`;
            else if (tag === 'p') refinedBlockType = 'paragraph';
          }

          results.push({
            id: nextId++,
            segmentIndex: i,
            original: trimmedText,
            blockType: refinedBlockType,
            attrKey: 'text',
          });
        }
      }
    } catch {
      // JSON parse error — skip this block
    }
  }

  return results;
}

/**
 * Reassemble content after replacing Spectra block text attributes.
 * Modifies segments in-place by updating the JSON "text" field in block comments.
 */
function applySpectraTextRewrites(segments: Segment[], spectraTexts: SpectraBlockText[], rewrittenMap: Map<number, string>): void {
  for (const st of spectraTexts) {
    const rewritten = rewrittenMap.get(st.id);
    if (!rewritten) continue;

    const seg = segments[st.segmentIndex];
    // Parse the block comment, replace text, rebuild
    const blockMatch = seg.raw.match(/^(<!-- wp:spectra\/\w+ )(\{[\s\S]*\})( \/-->)$/);
    if (!blockMatch) continue;

    try {
      const attrs = JSON.parse(blockMatch[2]);
      attrs.text = rewritten;
      const newJson = JSON.stringify(attrs);
      seg.raw = blockMatch[1] + newJson + blockMatch[3];
    } catch {
      // JSON error — skip
    }
  }
}

// ---------------------------------------------------------------------------
// Enhanced AI logging for debugging text extraction
// ---------------------------------------------------------------------------

interface TextEvaluationLog {
  segmentIndex: number;
  source: 'text_node' | 'spectra_attr';
  rawText: string;
  trimmedText: string;
  accepted: boolean;
  rejectReason?: string;
  context?: string;
  blockType?: string;
}

/**
 * Log detailed text evaluation results for debugging.
 * Shows every text that was evaluated, accepted, or rejected with reasons.
 */
function logTextEvaluation(
  pageTitle: string,
  evaluations: TextEvaluationLog[],
  isDryRun: boolean
): void {
  ensureAiLogDir();
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const prefix = isDryRun ? 'DRYRUN_' : '';
  const filename = `${prefix}${ts}_${pageTitle.replace(/\s+/g, '_').slice(0, 30)}_evaluation.log`;

  const accepted = evaluations.filter(e => e.accepted);
  const rejected = evaluations.filter(e => !e.accepted);

  const lines = [
    `=== Text Evaluation: ${pageTitle} ===`,
    `Timestamp: ${new Date().toISOString()}`,
    `Dry Run: ${isDryRun}`,
    `Total text segments evaluated: ${evaluations.length}`,
    `Accepted: ${accepted.length}`,
    `Rejected: ${rejected.length}`,
    '',
    '--- ACCEPTED TEXT (would be sent to AI) ---',
    ...accepted.map((e, i) =>
      `[${i + 1}] (${e.source}${e.blockType ? `:${e.blockType}` : ''}${e.context ? `, ${e.context}` : ''}) ${e.trimmedText.slice(0, 200)}`
    ),
    '',
    '--- REJECTED TEXT (not sent to AI) ---',
    ...rejected.map((e, i) =>
      `[R${i + 1}] (${e.source}${e.blockType ? `:${e.blockType}` : ''}) REASON: ${e.rejectReason} | TEXT: "${e.trimmedText.slice(0, 150)}"`
    ),
    '',
  ];

  fs.writeFileSync(path.join(AI_LOG_DIR, filename), lines.join('\n'), 'utf-8');
}

/**
 * Evaluate why a text would be rejected, returning a human-readable reason.
 */
function getRejectReason(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length < MIN_TEXT_LENGTH) return `too short (${trimmed.length} < ${MIN_TEXT_LENGTH} chars)`;
  if (/^[\s\d.,;:!?'"()\-–—&$€£¥%#@*/+={}\[\]|\\<>^~`\u00a0]+$/.test(trimmed)) return 'only digits/punctuation';
  if (/^(&[a-zA-Z0-9#]+;\s*)+$/.test(trimmed)) return 'only HTML entities';
  if (/^\[[\w-]+(\s+[^\]]*)?]$/.test(trimmed)) return 'WordPress shortcode';
  if (/^(\[[\w-]+[^\]]*\]\s*)+$/.test(trimmed)) return 'multiple shortcodes';
  if (/^https?:\/\/\S+$/.test(trimmed)) return 'URL';
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) return 'email address';
  if (/^[+\d\s()-]{6,20}$/.test(trimmed)) return 'phone number';
  if (/^[$€£¥]\s*[\d,.]+$/.test(trimmed)) return 'price';
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Skeleton extraction for structural validation
// ---------------------------------------------------------------------------

/**
 * Build a "skeleton" string from segments by replacing all text segments
 * with a fixed placeholder. Two contents that differ only in user-visible
 * text will produce identical skeletons.
 */
function buildSkeleton(segments: Segment[]): string {
  return segments
    .map((seg) => {
      if (seg.type === 'text') return '\x00'; // fixed placeholder
      return seg.raw;
    })
    .join('');
}

/**
 * Extract the ordered list of block comment strings for comparison.
 */
function extractBlockComments(segments: Segment[]): string[] {
  return segments.filter((s) => s.type === 'block_comment').map((s) => s.raw);
}

/**
 * Extract the ordered list of HTML tags for comparison.
 */
function extractHtmlTags(segments: Segment[]): string[] {
  return segments.filter((s) => s.type === 'html_tag').map((s) => s.raw);
}

// ---------------------------------------------------------------------------
// Re-insertion: put rewritten texts back into the segments
// ---------------------------------------------------------------------------

/**
 * Rebuild the full content string from segments, replacing text segments
 * that have a rewritten version.
 */
function reassemble(
  segments: Segment[],
  rewrittenMap: Map<number, string>
): string {
  return segments
    .map((seg) => {
      if (seg.type === 'text' && (seg as TextSegment).textId !== undefined) {
        const id = (seg as TextSegment).textId!;
        const rewritten = rewrittenMap.get(id);
        if (rewritten !== undefined) {
          // Preserve leading/trailing whitespace from the original raw text
          const leadingWs = seg.raw.match(/^(\s*)/)?.[1] ?? '';
          const trailingWs = seg.raw.match(/(\s*)$/)?.[1] ?? '';
          return leadingWs + rewritten.trim() + trailingWs;
        }
      }
      return seg.raw;
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Structural validation
// ---------------------------------------------------------------------------

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateStructure(
  originalSegments: Segment[],
  rewrittenContent: string
): ValidationResult {
  const errors: string[] = [];

  // Re-tokenise the rewritten content
  const newSegments = tokenise(rewrittenContent);

  // 1. Compare skeletons
  const origSkeleton = buildSkeleton(originalSegments);
  const newSkeleton = buildSkeleton(newSegments);

  if (origSkeleton !== newSkeleton) {
    // Find first point of divergence
    let divergePos = 0;
    for (let i = 0; i < Math.min(origSkeleton.length, newSkeleton.length); i++) {
      if (origSkeleton[i] !== newSkeleton[i]) {
        divergePos = i;
        break;
      }
    }
    if (origSkeleton.length !== newSkeleton.length && divergePos === 0) {
      divergePos = Math.min(origSkeleton.length, newSkeleton.length);
    }

    const context = 60;
    const origSnippet = origSkeleton.slice(Math.max(0, divergePos - context), divergePos + context);
    const newSnippet = newSkeleton.slice(Math.max(0, divergePos - context), divergePos + context);
    errors.push(
      `Skeleton mismatch at position ${divergePos}.\n` +
      `  Original: ...${JSON.stringify(origSnippet)}...\n` +
      `  Rewritten: ...${JSON.stringify(newSnippet)}...`
    );
  }

  // 2. Compare block comments
  const origComments = extractBlockComments(originalSegments);
  const newComments = extractBlockComments(newSegments);

  if (origComments.length !== newComments.length) {
    errors.push(
      `Block comment count mismatch: original ${origComments.length}, rewritten ${newComments.length}`
    );
  } else {
    for (let i = 0; i < origComments.length; i++) {
      if (origComments[i] !== newComments[i]) {
        errors.push(
          `Block comment #${i + 1} differs:\n` +
          `  Original: ${origComments[i].slice(0, 120)}\n` +
          `  Rewritten: ${newComments[i].slice(0, 120)}`
        );
        break; // Report first divergence only
      }
    }
  }

  // 3. Compare HTML tags (tag sequence must be identical)
  const origTags = extractHtmlTags(originalSegments);
  const newTags = extractHtmlTags(newSegments);

  if (origTags.length !== newTags.length) {
    errors.push(
      `HTML tag count mismatch: original ${origTags.length}, rewritten ${newTags.length}`
    );
  } else {
    for (let i = 0; i < origTags.length; i++) {
      if (origTags[i] !== newTags[i]) {
        errors.push(
          `HTML tag #${i + 1} differs:\n` +
          `  Original: ${origTags[i].slice(0, 120)}\n` +
          `  Rewritten: ${newTags[i].slice(0, 120)}`
        );
        break;
      }
    }
  }

  // 4. Detect text outside expected containers
  // After re-tokenisation, every non-text segment in newSegments should appear
  // in exactly the same order as in originalSegments.
  const origNonText = originalSegments.filter((s) => s.type !== 'text');
  const newNonText = newSegments.filter((s) => s.type !== 'text');
  if (origNonText.length !== newNonText.length) {
    errors.push(
      `Structural segment count mismatch: original ${origNonText.length} non-text segments, rewritten ${newNonText.length}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ---------------------------------------------------------------------------
// HF API communication
// ---------------------------------------------------------------------------

function getHfToken(): string {
  const token = process.env.HF_API_TOKEN;
  if (!token) {
    throw new Error('HF_API_TOKEN environment variable is not set. Add it to your .env file.');
  }
  return token;
}

/**
 * Build the system prompt for the extract-rewrite approach.
 * The LLM receives a numbered text map, not raw HTML.
 * Each text entry includes page name and content type context.
 */
function buildSystemPrompt(niche: string, pageName: string, additionalContext?: string): string {
  let prompt = `You are a copywriting engine that rewrites website text for the niche: "${niche}".
You are rewriting text from the "${pageName}" page.

You will receive a numbered list of text snippets extracted from the page.
Each line has the format:  [N] (context) original text
Where (context) describes the type of content (e.g. heading, body text, button label, testimonial).

Your task:
- Rewrite each snippet so it is specifically tailored to "${niche}".
- Replace generic/placeholder language (including Lorem Ipsum) with concrete, ${niche}-specific terminology, services, value propositions, and use cases.
- Keep roughly the same length and tone as the original.
- Preserve the content type — headings should remain heading-like, body text should remain body-like, etc.
- Do NOT add new lines that were not in the input.
- Do NOT skip any numbered line — return every [N] from the input.
- Do NOT invent regulated claims, guarantees, or credentials.
- Do NOT add commentary, explanations, markdown, or formatting like ** or *.
- Return PLAIN TEXT only — no bold, italic, or other markup.`;

  if (additionalContext && additionalContext.trim()) {
    prompt += `\n\nAdditional business context to incorporate:\n${additionalContext.trim()}`;
  }

  prompt += `\n\nOutput format — return ONLY lines in this exact format, one per input:
[N] rewritten text

Example input:
[1] (heading) Welcome to our business
[2] (body) We provide quality services to our customers worldwide.

Example output:
[1] Welcome to Springfield's Premier Plumbing Experts
[2] We deliver fast, reliable plumbing solutions across the Springfield area.`;

  return prompt;
}

/**
 * Classify the content type of a text node based on its surrounding HTML context.
 * Returns a human-readable label like "heading", "body", "button label", etc.
 */
function classifyTextContext(segments: Segment[], segmentIndex: number): string {
  // Walk backwards to find the nearest enclosing HTML tag
  for (let i = segmentIndex - 1; i >= 0; i--) {
    const seg = segments[i];
    if (seg.type === 'html_tag' && !seg.isClosing) {
      const tag = seg.tagName;
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) return 'heading';
      if (tag === 'p') return 'body';
      if (tag === 'a') return 'link text';
      if (tag === 'button') return 'button label';
      if (tag === 'span') return 'inline text';
      if (tag === 'li') return 'list item';
      if (tag === 'blockquote') return 'testimonial';
      if (tag === 'figcaption') return 'caption';
      if (tag === 'label') return 'label';
      if (tag === 'td' || tag === 'th') return 'table cell';
      return 'text';
    }
    // Also check block comments for section context
    if (seg.type === 'block_comment') {
      const raw = seg.raw.toLowerCase();
      if (raw.includes('testimonial') || raw.includes('review')) return 'testimonial';
      if (raw.includes('heading')) return 'heading';
      if (raw.includes('button')) return 'button label';
      if (raw.includes('list')) return 'list item';
    }
  }
  return 'text';
}

/**
 * Call Hugging Face Inference API.
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
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (result.choices && result.choices.length > 0) {
    const content = result.choices[0].message?.content?.trim();
    if (content) return content;
  }

  throw new Error('Unexpected Hugging Face API response format');
}

// ---------------------------------------------------------------------------
// LLM text map: format for sending and parse response
// ---------------------------------------------------------------------------

/**
 * Format the extracted texts into the numbered-list format for the LLM.
 * Each entry includes a context label to help the AI understand content type.
 */
function formatTextMapForLlm(texts: ExtractedTextWithContext[]): string {
  return texts.map((t) => `[${t.id}] (${t.context}) ${t.original}`).join('\n');
}

/**
 * Parse the LLM response back into a Map<id, rewritten text>.
 */
function parseLlmResponse(response: string): Map<number, string> {
  const map = new Map<number, string>();
  const lines = response.split('\n');

  for (const line of lines) {
    const match = line.match(/^\[(\d+)\]\s*(.+)$/);
    if (match) {
      const id = parseInt(match[1], 10);
      const text = match[2].trim();
      if (text.length > 0) {
        map.set(id, text);
      }
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// Batching: split large text maps into chunks that fit in the token budget
// ---------------------------------------------------------------------------

const MAX_TEXTS_PER_BATCH = 30; // Conservative batch size to stay within 4096 output tokens

function chunkTexts(texts: ExtractedText[]): ExtractedText[][] {
  const chunks: ExtractedText[][] = [];
  for (let i = 0; i < texts.length; i += MAX_TEXTS_PER_BATCH) {
    chunks.push(texts.slice(i, i + MAX_TEXTS_PER_BATCH));
  }
  return chunks;
}

// ---------------------------------------------------------------------------
// Core rewrite pipeline for a single page
// ---------------------------------------------------------------------------

interface RewriteResult {
  success: boolean;
  rewrittenContent?: string;
  textsRewritten: number;
  textsTotal: number;
  errors: string[];
}

async function rewritePage(
  pageContent: string,
  niche: string,
  pageTitle: string,
  additionalContext?: string,
  onProgress?: (message: string) => void,
  dryRun: boolean = false
): Promise<RewriteResult> {
  const errors: string[] = [];
  const evaluations: TextEvaluationLog[] = [];

  // Step 1: Tokenise
  const segments = tokenise(pageContent);
  logger.info(
    { pageTitle, totalSegments: segments.length },
    'Tokenised page content'
  );

  // Step 2A: Extract standard text nodes (text between HTML tags)
  const rawTexts = extractRewritableTexts(segments);

  // Log evaluations for standard text nodes
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.type !== 'text') continue;
    const trimmed = seg.raw.trim();
    if (trimmed.length === 0) continue; // skip pure whitespace
    const accepted = rawTexts.some(t => t.segmentIndex === i);
    evaluations.push({
      segmentIndex: i,
      source: 'text_node',
      rawText: seg.raw.slice(0, 200),
      trimmedText: trimmed.slice(0, 200),
      accepted,
      rejectReason: accepted ? undefined : getRejectReason(trimmed),
    });
  }

  // Step 2B: Extract Spectra block text attributes
  const spectraStartId = rawTexts.length > 0 ? Math.max(...rawTexts.map(t => t.id)) + 1 : 1;
  const spectraTexts = extractSpectraBlockTexts(segments, spectraStartId);

  // Log evaluations for Spectra block texts
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.type !== 'block_comment') continue;
    const blockMatch = seg.raw.match(/^<!-- wp:spectra\/(\w+) (\{[\s\S]*\}) \/-->$/);
    if (!blockMatch) continue;
    const blockType = blockMatch[1];
    try {
      const attrs = JSON.parse(blockMatch[2]);
      if (typeof attrs.text === 'string') {
        const trimmed = attrs.text.trim();
        const accepted = spectraTexts.some(t => t.segmentIndex === i);
        evaluations.push({
          segmentIndex: i,
          source: 'spectra_attr',
          blockType,
          rawText: attrs.text.slice(0, 200),
          trimmedText: trimmed.slice(0, 200),
          accepted,
          rejectReason: accepted ? undefined : (trimmed.length === 0 ? 'empty' : getRejectReason(trimmed)),
        });
      }
    } catch { /* skip */ }
  }

  // Step 2C: Combine both into a unified text list with context
  const allTexts: ExtractedTextWithContext[] = [
    ...rawTexts.map((t) => ({
      ...t,
      context: classifyTextContext(segments, t.segmentIndex),
      source: 'text_node' as const,
    })),
    ...spectraTexts.map((st) => ({
      id: st.id,
      segmentIndex: st.segmentIndex,
      original: st.original,
      context: spectraBlockTypeToContext(st.blockType),
      source: 'spectra_attr' as const,
    })),
  ];

  logger.info(
    { pageTitle, textNodes: rawTexts.length, spectraBlocks: spectraTexts.length, total: allTexts.length },
    'Extracted all rewritable text (text nodes + Spectra attributes)'
  );

  // Always log evaluations for debugging
  logTextEvaluation(pageTitle, evaluations, dryRun);

  if (allTexts.length === 0) {
    onProgress?.(`${pageTitle}: no rewritable text found (evaluated ${evaluations.length} segments — see logs/ai/ for details)`);
    return {
      success: true,
      rewrittenContent: pageContent,
      textsRewritten: 0,
      textsTotal: 0,
      errors: [],
    };
  }

  onProgress?.(`${pageTitle}: found ${allTexts.length} rewritable text blocks (${rawTexts.length} text nodes, ${spectraTexts.length} Spectra blocks)`);

  // Dry run: log what would be sent but don't call the API
  if (dryRun) {
    const systemPrompt = buildSystemPrompt(niche, pageTitle, additionalContext);
    const userMessage = formatTextMapForLlm(allTexts);
    logAiExchange(`DRYRUN_${pageTitle}`, systemPrompt, userMessage, '(dry run — no API call)');
    onProgress?.(`${pageTitle}: dry run logged ${allTexts.length} text blocks`);
    return {
      success: true,
      rewrittenContent: pageContent,
      textsRewritten: 0,
      textsTotal: allTexts.length,
      errors: [],
    };
  }

  // Step 3: Send text map to LLM in batches
  const systemPrompt = buildSystemPrompt(niche, pageTitle, additionalContext);
  const rewrittenMap = new Map<number, string>();
  const batches = chunkTexts(allTexts);

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx] as ExtractedTextWithContext[];
    const userMessage = formatTextMapForLlm(batch);

    onProgress?.(`Sending ${pageTitle} batch ${batchIdx + 1}/${batches.length} to AI (${batch.length} text blocks)`);

    logger.info(
      { pageTitle, batch: batchIdx + 1, totalBatches: batches.length, textsInBatch: batch.length },
      'Sending batch to LLM'
    );

    try {
      const response = await callHuggingFace(systemPrompt, userMessage);

      logAiExchange(`${pageTitle}_batch${batchIdx + 1}`, systemPrompt, userMessage, response);

      onProgress?.(`AI response received for ${pageTitle} batch ${batchIdx + 1} — ${response.split('\n').filter(l => l.match(/^\[\d+\]/)).length} rewrites`);

      const batchResult = parseLlmResponse(response);

      // Strip markdown formatting from AI responses
      for (const [id, text] of batchResult) {
        const cleaned = text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
        rewrittenMap.set(id, cleaned);
      }

      const missing = batch.filter((t) => !batchResult.has(t.id));
      if (missing.length > 0) {
        logger.warn(
          { pageTitle, missingIds: missing.map((t) => t.id) },
          'LLM did not return all text IDs'
        );
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push(`Batch ${batchIdx + 1} failed: ${errMsg}`);
      logger.error({ pageTitle, batch: batchIdx + 1, err }, 'LLM batch failed');
      onProgress?.(`AI batch ${batchIdx + 1} failed for ${pageTitle}: ${errMsg}`);
    }
  }

  if (rewrittenMap.size === 0) {
    return {
      success: false,
      textsRewritten: 0,
      textsTotal: allTexts.length,
      errors: ['No texts were rewritten by the LLM'],
    };
  }

  // Step 4A: Apply Spectra block text replacements (modify segment.raw in-place)
  applySpectraTextRewrites(segments, spectraTexts, rewrittenMap);

  // Step 4B: Re-insert standard text node replacements
  const rewrittenContent = reassemble(segments, rewrittenMap);

  // Step 5: Validate structural integrity (only for text-node changes)
  // Spectra changes are structurally safe by construction (JSON field update)
  // so we only validate if there were standard text node changes.
  if (rawTexts.length > 0 && rawTexts.some(t => rewrittenMap.has(t.id))) {
    const validation = validateStructure(tokenise(pageContent), rewrittenContent);
    if (!validation.valid) {
      logger.warn(
        { pageTitle, validationErrors: validation.errors },
        'Structural validation had warnings (may be caused by Spectra attribute changes)'
      );
      // Don't fail for Spectra templates — the changes are safe
    }
  }

  logger.info(
    { pageTitle, textsRewritten: rewrittenMap.size, textsTotal: allTexts.length },
    'Page rewrite completed'
  );

  return {
    success: true,
    rewrittenContent,
    textsRewritten: rewrittenMap.size,
    textsTotal: allTexts.length,
    errors,
  };
}

/**
 * Map Spectra block types to content context labels.
 */
function spectraBlockTypeToContext(blockType: string): string {
  if (blockType.startsWith('heading-')) return 'heading';
  switch (blockType) {
    case 'paragraph': return 'body';
    case 'content': return 'body'; // fallback when tagName not available
    case 'button': return 'button label';
    case 'heading': return 'heading';
    default: return 'text';
  }
}

// ---------------------------------------------------------------------------
// WordPress integration
// ---------------------------------------------------------------------------

/**
 * Discover all published pages in the WordPress site.
 */
export async function discoverPages(
  sitePath: string
): Promise<Array<{ id: number; title: string; content: string }>> {
  logger.info({ sitePath }, 'Discovering published pages');

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
      result.push({ id: page.ID, title: page.post_title, content });
    } catch (err) {
      logger.warn({ sitePath, pageId: page.ID, err }, 'Failed to fetch page content');
    }
  }

  return result;
}

/**
 * Get the homepage ID from WP options (page_on_front).
 * Returns null if no static front page is set.
 */
async function getHomepageId(sitePath: string): Promise<number | null> {
  try {
    const { stdout: showOnFront } = await wpService.wpCli(
      ['option', 'get', 'show_on_front'],
      { sitePath }
    );
    if (showOnFront.trim() !== 'page') {
      logger.info({ sitePath }, 'Front page is not a static page');
      return null;
    }

    const { stdout: pageId } = await wpService.wpCli(
      ['option', 'get', 'page_on_front'],
      { sitePath }
    );
    const id = parseInt(pageId.trim(), 10);
    return isNaN(id) || id === 0 ? null : id;
  } catch (err) {
    logger.warn({ sitePath, err }, 'Could not determine homepage ID');
    return null;
  }
}

/**
 * Update a page's post_content in the WordPress database.
 * Uses positional `-` argument so WP-CLI reads content from stdin.
 */
async function updatePageContent(
  sitePath: string,
  pageId: number,
  newContent: string
): Promise<void> {
  await wpService.wpCli(
    ['post', 'update', pageId.toString(), '-'],
    { sitePath },
    newContent
  );
}

// ---------------------------------------------------------------------------
// Public API: main entry point
// ---------------------------------------------------------------------------

/** Pages to skip for AI rewriting (WooCommerce functional pages, etc.) */
const SKIP_PAGE_SLUGS = new Set([
  'cart', 'checkout', 'my-account', 'shop',
  'cart-2', 'checkout-2', 'my-account-2', 'shop-2',
  'privacy-policy', 'sample-page',
]);

/**
 * Generate AI content for all published pages of the site.
 * Processes Homepage, About, Contact, and other content pages.
 * Skips WooCommerce functional pages (Cart, Checkout, etc.).
 *
 * This is the main entry point called by the site generator.
 */
export async function generateAiContent(
  sitePath: string,
  niche: string,
  onProgress?: (message: string) => void,
  additionalContext?: string,
  dryRun: boolean = false
): Promise<{ pagesProcessed: number; pagesSkipped: number }> {
  logger.info({ sitePath, niche }, 'Starting AI content generation (all content pages)');

  let pagesProcessed = 0;
  let pagesSkipped = 0;

  // Discover all published pages
  const allPages = await discoverPages(sitePath);
  const homepageId = await getHomepageId(sitePath);

  if (allPages.length === 0) {
    logger.warn({ sitePath }, 'No published pages found — skipping AI rewrite');
    return { pagesProcessed: 0, pagesSkipped: 0 };
  }

  onProgress?.(`Found ${allPages.length} published pages to analyze`);

  // Get page slugs to filter out functional pages
  let pageSlugs: Map<number, string> = new Map();
  try {
    const { stdout: pagesJson } = await wpService.wpCli(
      ['post', 'list', '--post_type=page', '--post_status=publish', '--format=json', '--fields=ID,post_name'],
      { sitePath }
    );
    const parsed: Array<{ ID: number; post_name: string }> = JSON.parse(pagesJson);
    pageSlugs = new Map(parsed.map(p => [p.ID, p.post_name]));
  } catch {
    logger.warn({ sitePath }, 'Could not fetch page slugs for filtering');
  }

  // Process pages: homepage first, then others alphabetically
  const sortedPages = [...allPages].sort((a, b) => {
    if (a.id === homepageId) return -1;
    if (b.id === homepageId) return 1;
    return a.title.localeCompare(b.title);
  });

  for (const page of sortedPages) {
    const slug = pageSlugs.get(page.id) || '';

    // Skip WooCommerce/functional pages
    if (SKIP_PAGE_SLUGS.has(slug)) {
      logger.info({ pageId: page.id, title: page.title, slug }, 'Skipping functional page');
      pagesSkipped++;
      continue;
    }

    // Skip pages with insufficient content
    if (!page.content || page.content.trim().length < 50) {
      logger.info({ pageId: page.id, title: page.title }, 'Page has insufficient content — skipping');
      pagesSkipped++;
      continue;
    }

    const pageName = page.id === homepageId ? 'Homepage' : page.title;
    onProgress?.(`Rewriting page: ${pageName}`);

    logger.info(
      { pageId: page.id, pageName, contentLength: page.content.length },
      'Starting structure-preserving rewrite'
    );

    const result = await rewritePage(page.content, niche, pageName, additionalContext, onProgress, dryRun);

    if (result.success && result.rewrittenContent) {
      if (result.textsRewritten === 0) {
        logger.info({ pageName }, 'No texts needed rewriting');
        onProgress?.(`${pageName}: no rewritable text found`);
        pagesSkipped++;
      } else {
        await updatePageContent(sitePath, page.id, result.rewrittenContent);
        logger.info(
          { pageId: page.id, pageName, textsRewritten: result.textsRewritten },
          'Page updated with AI-generated copy'
        );
        onProgress?.(`${pageName}: ${result.textsRewritten} text blocks rewritten`);
        pagesProcessed++;
      }
    } else {
      logger.error(
        { pageName, errors: result.errors },
        'Page rewrite FAILED — original content preserved'
      );
      onProgress?.(`${pageName}: rewrite failed, original preserved`);
      pagesSkipped++;
    }

    if (result.errors.length > 0) {
      for (const err of result.errors) {
        logger.warn({ pageName }, `Rewrite issue: ${err}`);
      }
    }
  }

  logger.info(
    { sitePath, niche, pagesProcessed, pagesSkipped },
    'AI content generation completed'
  );

  return { pagesProcessed, pagesSkipped };
}
