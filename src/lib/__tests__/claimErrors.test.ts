import { describe, expect, it } from 'vitest';
import { claimErrorMessage, invitePreviewMessage } from '../claimErrors';

describe('claimErrors', () => {
  it('maps RPC codes to friendly copy', () => {
    expect(claimErrorMessage('RAISE INVITE_LOCKED')).toContain('locked');
    expect(claimErrorMessage('ALREADY_CLAIMED')).toContain('transfer');
    expect(claimErrorMessage('something else')).toContain('couldn’t complete');
  });

  it('maps preview reasons', () => {
    expect(invitePreviewMessage('INVITE_EXPIRED')).toContain('expired');
    expect(invitePreviewMessage('ALREADY_CLAIMED')).toContain('claimed');
  });
});
