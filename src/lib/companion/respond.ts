import { buildKinshipGraphFromApp } from '@/lib/kinship/adapter';
import { getRelationshipExplanation, getRelationshipLabel } from '@/lib/kinship';
import { traverseFromAnchor } from '@/lib/kinship/_traverse';
import { getUpcomingEvents, whenLabel } from '@/lib/occasions';
import type { FamilyNode, Memory, Relationship } from '@/types/models';

export interface CompanionContext {
  viewerNodeId?: string;
  nodes: FamilyNode[];
  relationships: Relationship[];
  memories: Memory[];
}

export interface CompanionMessage {
  role: 'user' | 'companion';
  text: string;
}

const PRIVACY_NOTE =
  'I only see memories and relationships you are allowed to view — never a way to speak with someone who has passed.';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Match a person by display name (exact, then unique partial). */
export function findNodeByQuery(nodes: FamilyNode[], query: string): FamilyNode | 'ambiguous' | undefined {
  const q = normalize(query);
  if (!q) return undefined;

  const exact = nodes.find((n) => normalize(n.displayName) === q);
  if (exact) return exact;

  const partial = nodes.filter((n) => normalize(n.displayName).includes(q));
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) return 'ambiguous';
  return undefined;
}

function extractName(text: string, patterns: RegExp[]): string | undefined {
  for (const re of patterns) {
    const m = re.exec(text);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

function explainRelationship(ctx: CompanionContext, target: FamilyNode): string {
  const anchorId = ctx.viewerNodeId;
  if (!anchorId) {
    return `${target.displayName} is in your Family Tree. Open your Life Profile to set yourself as the anchor for relationship explanations.`;
  }
  if (target.id === anchorId) return 'That is you — the anchor of your Family Tree.';

  const graph = buildKinshipGraphFromApp({
    nodes: ctx.nodes,
    relationships: ctx.relationships,
    anchorNodeId: anchorId,
  });
  const traversal = traverseFromAnchor({
    anchorNodeId: anchorId,
    nodes: graph.nodes,
    edges: graph.edges,
  });
  const result = traversal.get(target.id);
  if (!result) {
    return `I could not find a kinship path from you to ${target.displayName}. They may be on a disconnected branch of your tree.`;
  }

  const label = getRelationshipLabel({
    anchorNodeId: anchorId,
    targetNodeId: target.id,
    path: result.path,
    nodes: graph.nodes,
    edges: graph.edges,
  });
  const explanation = getRelationshipExplanation({
    anchorNodeId: anchorId,
    targetNodeId: target.id,
    path: result.path,
    nodes: graph.nodes,
    edges: graph.edges,
  });
  return `${explanation} In short: ${label}.`;
}

function searchMemories(ctx: CompanionContext, query: string): string {
  const q = normalize(query);
  if (!q) return 'Tell me what you would like to search for — a name, place, or keyword from a memory.';

  const hits = ctx.memories.filter((m) => {
    const hay = normalize([m.title, m.body, m.caption].filter(Boolean).join(' '));
    const taggedNames = m.taggedNodeIds
      .map((id) => ctx.nodes.find((n) => n.id === id)?.displayName)
      .filter(Boolean)
      .join(' ');
    return hay.includes(q) || normalize(taggedNames).includes(q);
  });

  if (hits.length === 0) {
    return `I did not find any memories you can access that mention "${query.trim()}".`;
  }

  const lines = hits.slice(0, 5).map((m) => {
    const label = m.title?.trim() || m.caption?.trim() || m.type;
    return `· ${label}`;
  });
  const more = hits.length > 5 ? `\n…and ${hits.length - 5} more.` : '';
  return `I found ${hits.length} memor${hits.length === 1 ? 'y' : 'ies'}:\n${lines.join('\n')}${more}`;
}

function upcomingOccasions(ctx: CompanionContext): string {
  const events = getUpcomingEvents(ctx.nodes, { withinDays: 60, relationships: ctx.relationships }).slice(0, 6);
  if (events.length === 0) {
    return 'No upcoming birthdays or remembrances in the next two months. Add dates to Life Profiles and they will appear here.';
  }
  const lines = events.map((e) => `· ${e.title} — ${whenLabel(e.daysUntil)}`);
  return `Here is what is coming up:\n${lines.join('\n')}`;
}

function helpMessage(ctx: CompanionContext): string {
  const examples: string[] = [
    '· "How is [name] related to me?"',
    '· "Who is [name]?"',
    '· "Memories about [keyword]"',
    '· "What birthdays are coming up?"',
  ];
  const sample = ctx.nodes.find((n) => n.id !== ctx.viewerNodeId);
  if (sample) {
    examples[0] = `· "How is ${sample.displayName} related to me?"`;
    examples[1] = `· "Who is ${sample.displayName}?"`;
  }
  return `I can help explain relationships, search memories you can see, and surface upcoming occasions.\n\nTry asking:\n${examples.join('\n')}\n\n${PRIVACY_NOTE}`;
}

/**
 * Local Companion responses — no external AI. Uses the kinship engine and
 * visible memories only; never impersonates the deceased.
 */
export function companionReply(message: string, ctx: CompanionContext): string {
  const text = message.trim();
  if (!text) return 'Ask me about a relationship, a memory, or an upcoming occasion.';

  const lower = normalize(text);

  if (/^(hi|hello|hey|help)\b/.test(lower) || lower === '?') {
    return helpMessage(ctx);
  }

  if (/upcoming|coming up|birthday|anniversary|occasion/.test(lower)) {
    return upcomingOccasions(ctx);
  }

  const memoryQuery =
    extractName(text, [
      /memories?\s+(?:about|of|for|with)\s+(.+)/i,
      /find\s+memories?\s+(?:about|of|for|with)?\s*(.+)/i,
      /search\s+(?:for\s+)?(?:memories?\s+)?(.+)/i,
    ]) ?? (lower.startsWith('memories ') ? text.replace(/^memories\s+/i, '') : undefined);

  if (memoryQuery && /memor|search|find/.test(lower)) {
    return searchMemories(ctx, memoryQuery);
  }

  const relationName = extractName(text, [
    /how\s+(?:is|are)\s+(.+?)\s+related/i,
    /relationship\s+(?:to|with)\s+(.+)/i,
    /who\s+is\s+(.+)/i,
    /tell\s+me\s+about\s+(.+)/i,
  ]);

  if (relationName) {
    const match = findNodeByQuery(ctx.nodes, relationName);
    if (match === 'ambiguous') {
      return `I found more than one person matching "${relationName}". Try their full name.`;
    }
    if (!match) {
      return `I could not find anyone named "${relationName}" in your Family Tree.`;
    }
    return explainRelationship(ctx, match);
  }

  // Fall back to memory keyword search for short free-text queries.
  if (text.split(/\s+/).length <= 4) {
    const mem = searchMemories(ctx, text);
    if (!mem.includes('did not find')) return mem;
  }

  return `${helpMessage(ctx)}`;
}

export function companionWelcome(ctx: CompanionContext): string {
  const name = ctx.nodes.find((n) => n.id === ctx.viewerNodeId)?.displayName;
  const greeting = name ? `Hello, ${name}. ` : '';
  return `${greeting}I am your Tomora Companion — a gentle guide for relationships and memories.\n\n${PRIVACY_NOTE}`;
}
