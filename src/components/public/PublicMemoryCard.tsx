import { useState } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Badge } from '@/components/ui/Badge';
import { Body, Caption, Title } from '@/components/ui/Typography';
import { PublicMemoryMedia } from '@/components/public/PublicMemoryMedia';
import { colors, spacing } from '@/constants/theme';
import {
  unlockPublicMemory,
  type PublicMemory,
  type UnlockedPublicMemory,
} from '@/services/publicProfileService';

export function PublicMemoryCard({ memory }: { memory: PublicMemory }) {
  const [unlocked, setUnlocked] = useState<UnlockedPublicMemory | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locked = memory.requiresPassword && !unlocked;
  const display = unlocked ?? memory;

  const onUnlock = async () => {
    setBusy(true);
    setError(null);
    try {
      const full = await unlockPublicMemory(memory.id, password);
      setUnlocked(full);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not open this memory.';
      if (msg.includes('PASSWORD_REQUIRED')) setError('Enter the password to view this memory.');
      else setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }}>
          <Title style={{ flex: 1, fontSize: 18 }}>{display.title || 'A memory'}</Title>
          <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
            {locked ? <Badge label="Protected" tone="neutral" /> : null}
            <Caption>
              {new Date(memory.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Caption>
          </View>
        </View>

        {locked ? (
          <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
            <Body style={{ color: colors.deepUmber }}>
              This memory is shared with a password. Enter it to read the full story.
            </Body>
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Share password"
              secureTextEntry
              autoCapitalize="none"
            />
            {error ? <Caption style={{ color: colors.error }}>{error}</Caption> : null}
            <Button
              label={busy ? 'Opening…' : 'Unlock memory'}
              variant="gold"
              fullWidth={false}
              disabled={busy || !password.trim()}
              onPress={onUnlock}
            />
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {display.body ? (
              <Body style={{ color: colors.deepUmber }}>{display.body}</Body>
            ) : display.caption ? (
              <Body style={{ color: colors.deepUmber }}>{display.caption}</Body>
            ) : null}
            <PublicMemoryMedia
              type={display.type}
              mediaUrl={display.mediaUrl}
              media={display.media}
              storagePath={display.storagePath}
            />
          </View>
        )}
      </View>
    </Card>
  );
}
