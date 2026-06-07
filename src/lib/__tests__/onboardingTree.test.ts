import { describe, expect, it } from 'vitest';

import { isMinimalOnboardingTreeComplete } from '@/lib/onboardingTree';

describe('isOnboardingTreeComplete', () => {
  const accountId = 'acct-1';

  it('is false when there is no tree', () => {
    expect(isMinimalOnboardingTreeComplete(null, accountId)).toBe(false);
  });

  it('is false when only the self node exists', () => {
    expect(
      isMinimalOnboardingTreeComplete(
        {
          tree: { id: 'tree-1' },
          nodes: [{ id: 'self', ownerAccountId: accountId, status: 'claimed' }],
          relationships: [],
        },
        accountId,
      ),
    ).toBe(false);
  });

  it('is true when self and loved one are connected', () => {
    expect(
      isMinimalOnboardingTreeComplete(
        {
          tree: { id: 'tree-1' },
          nodes: [
            { id: 'self', ownerAccountId: accountId, status: 'claimed' },
            { id: 'pet', status: 'managed' },
          ],
          relationships: [{ fromNodeId: 'self', toNodeId: 'pet' }],
        },
        accountId,
      ),
    ).toBe(true);
  });
});
