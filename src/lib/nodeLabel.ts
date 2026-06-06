import type { FamilyNode } from '@/types/models';
import { formatPersonName, resolvePersonName } from './profile';

type NodeNameSource = Pick<FamilyNode, 'displayName' | 'profile' | 'legalName'>;

/** Short label for tree nodes, lists, and search — prefers `displayName`. */
export function resolveTreeNodeLabel(node: NodeNameSource): string {
  const display = node.displayName?.trim();
  if (display) return display;

  const profile = node.profile ?? {};
  const alternate = profile.alternateNames?.value?.map((n) => n.trim()).find(Boolean);
  if (alternate) return alternate;

  const full = formatPersonName(resolvePersonName(profile));
  if (full) return full;

  const legal = node.legalName?.trim();
  if (legal) return legal;

  return 'Unknown';
}

/** Full structured name when it differs from the tree label (search secondary line). */
export function resolveTreeNodeFullName(node: NodeNameSource): string | undefined {
  const label = resolveTreeNodeLabel(node);
  const full = formatPersonName(resolvePersonName(node.profile ?? {}, node.displayName));
  if (full && full !== label) return full;

  const legal = node.legalName?.trim();
  if (legal && legal !== label) return legal;

  return undefined;
}
