import type { RenderNode } from '@/lib/kinship/types';

/** Whether a canvas node should use departed / Memory Light gold styling. */
export function isMemorialRenderNode(
  node: Pick<RenderNode, 'nodeType' | 'status' | 'metadata'>,
): boolean {
  if (node.nodeType === 'deceased') return true;
  if (node.status === 'memory_light' || node.status === 'memorial_pending') return true;
  const isLiving = (node.metadata as { isLiving?: boolean } | undefined)?.isLiving;
  return isLiving === false;
}
