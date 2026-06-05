import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MemoryVisibilitySelector } from '@/components/memories/MemoryVisibilitySelector';
import { Avatar } from '@/components/ui/Avatar';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';
import type { MemoryType, VisibilityLevel } from '@/types/models';
import {
  capFor,
  formatBytes,
  isWithinCap,
  memoryTypeForKind,
  pickMedia,
  uploadMedia,
  type PickedFile,
  type UploadMediaKind,
} from '@/lib/media';

type Mode = 'text' | 'link' | UploadMediaKind;

const MODES: { id: Mode; label: string }[] = [
  { id: 'text', label: 'Story' },
  { id: 'photo', label: 'Photo' },
  { id: 'video', label: 'Video' },
  { id: 'audio', label: 'Audio' },
  { id: 'document', label: 'File' },
  { id: 'link', label: 'Link' },
];

export default function NewMemory() {
  const router = useRouter();
  const { nodeId, memoryId } = useLocalSearchParams<{ nodeId?: string; memoryId?: string }>();
  const { account, getNode, getMemory, createMemory, updateMemory, deleteMemory } = useAppState();

  const editing = getMemory(String(memoryId ?? ''));
  const targetNode = getNode(String(editing?.nodeId ?? nodeId ?? ''));

  const [mode, setMode] = useState<Mode>((editing?.type as Mode) ?? 'text');
  const [title, setTitle] = useState(editing?.title ?? '');
  const [body, setBody] = useState(editing?.body ?? '');
  const [link, setLink] = useState(editing?.mediaUrl ?? '');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<VisibilityLevel>(editing?.visibility ?? 'private');
  const [busy, setBusy] = useState(false);

  const isUploadKind = mode !== 'text' && mode !== 'link';

  const canSave = useMemo(() => {
    if (busy || !targetNode) return false;
    if (editing) return true; // editing only touches title/body/visibility
    if (mode === 'text') return body.trim().length > 0;
    if (mode === 'link') return link.trim().length > 0;
    return !!file && isWithinCap(file);
  }, [busy, targetNode, editing, mode, body, link, file]);

  const onPick = async (kind: UploadMediaKind) => {
    setPickError(null);
    try {
      const picked = await pickMedia(kind);
      if (!picked) return;
      if (!isWithinCap(picked)) {
        setPickError(
          `That ${kind} is ${formatBytes(picked.size)} — the limit is ${formatBytes(
            capFor(kind),
          )} per memory. Try a smaller file or add it as a separate memory.`,
        );
        setFile(null);
        return;
      }
      setFile(picked);
    } catch (e) {
      console.warn('[tomora] pick failed', e);
      setPickError('Could not open the picker. Please try again.');
    }
  };

  const onSave = async () => {
    if (!targetNode || !canSave || !account) return;
    setBusy(true);
    try {
      if (editing) {
        await updateMemory({ id: editing.id, title, body, visibility });
        router.back();
        return;
      }

      if (mode === 'text') {
        await createMemory({ nodeId: targetNode.id, type: 'text', title, body, visibility });
      } else if (mode === 'link') {
        await createMemory({ nodeId: targetNode.id, type: 'link', title, mediaUrl: link, visibility });
      } else if (file) {
        const uploaded = await uploadMedia(account.id, file);
        await createMemory({
          nodeId: targetNode.id,
          type: memoryTypeForKind(mode),
          title,
          storagePath: uploaded.storagePath,
          mediaSizeBytes: uploaded.sizeBytes,
          mediaMime: uploaded.mime,
          visibility,
        });
      }
      router.back();
    } catch (e) {
      console.warn('[tomora] save memory failed', e);
      setPickError('Something went wrong saving this memory. Please try again.');
      setBusy(false);
    }
  };

  if (!targetNode) {
    return (
      <ScreenContainer center>
        <Display style={{ fontSize: 24 }}>Pick a profile first</Display>
        <Caption align="center" style={{ marginTop: spacing.sm }}>
          Open a Life Profile, then add a memory for that person.
        </Caption>
        <Button label="Back" variant="secondary" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      maxWidth={620}
      showBack
      onBack={() => router.back()}
      footer={
        <View style={{ gap: spacing.sm }}>
          <Button
            label={editing ? 'Save changes' : 'Save this memory'}
            variant="gold"
            disabled={!canSave}
            loading={busy}
            onPress={onSave}
          />
          {editing ? (
            <Button
              label="Delete memory"
              variant="ghost"
              onPress={async () => {
                setBusy(true);
                try {
                  await deleteMemory(editing.id);
                  router.back();
                } finally {
                  setBusy(false);
                }
              }}
            />
          ) : (
            <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
          )}
        </View>
      }
    >
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>
            {editing ? 'Edit memory' : 'Keep this close'}
          </Caption>
          <Display style={{ fontSize: 32 }}>{editing ? 'Edit memory' : 'Add a memory'}</Display>
        </View>

        {/* Scoped to this profile only */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            padding: spacing.sm,
            borderRadius: radii.md,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.mistBeige,
          }}
        >
          <Avatar
            name={targetNode.displayName}
            size={36}
            memorial={targetNode.isLiving === false}
            uri={targetNode.profile?.profilePhoto?.value ?? targetNode.avatarUrl}
          />
          <View>
            <Caption>For</Caption>
            <Body style={{ fontWeight: '600' }}>{targetNode.displayName}</Body>
          </View>
        </View>

        {/* Memory type */}
        {!editing ? (
          <View style={{ gap: spacing.sm }}>
            <Body style={{ color: colors.deepUmber }}>What would you like to add?</Body>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {MODES.map((m) => {
                const active = m.id === mode;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => {
                      setMode(m.id);
                      setFile(null);
                      setPickError(null);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: radii.pill,
                      borderWidth: 1.5,
                      borderColor: active ? colors.guardianGold : colors.mistBeige,
                      backgroundColor: active ? 'rgba(184,135,47,0.12)' : colors.white,
                    }}
                  >
                    <Body style={{ fontSize: 14, fontWeight: '600', color: active ? colors.guardianGold : colors.ink }}>
                      {m.label}
                    </Body>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <TextField label="Title (optional)" value={title} onChangeText={setTitle} placeholder="A few words" />

        {/* Mode-specific inputs */}
        {mode === 'text' || editing ? (
          <TextField
            label="Your story"
            value={body}
            onChangeText={setBody}
            placeholder="Share a moment, a feeling, or something you never want to forget…"
            multiline
            autoFocus={mode === 'text'}
          />
        ) : null}

        {mode === 'link' && !editing ? (
          <TextField
            label="Link"
            value={link}
            onChangeText={setLink}
            placeholder="https://…"
            autoCapitalize="none"
          />
        ) : null}

        {isUploadKind && !editing ? (
          <Card>
            <Body style={{ fontWeight: '600', marginBottom: spacing.xs }}>
              Upload {mode === 'document' ? 'a file' : `a ${mode}`}
            </Body>
            <Caption style={{ marginBottom: spacing.sm }}>
              Up to {formatBytes(capFor(mode))} per memory. Need more? Add another memory.
            </Caption>
            <Button
              label={file ? 'Choose a different file' : `Choose ${mode === 'document' ? 'file' : mode}`}
              variant="secondary"
              onPress={() => onPick(mode)}
            />
            {file ? (
              <View
                style={{
                  marginTop: spacing.sm,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Body numberOfLines={1} style={{ flex: 1, marginRight: spacing.sm }}>
                  {file.name}
                </Body>
                <Caption>{formatBytes(file.size)}</Caption>
              </View>
            ) : null}
            {pickError ? (
              <Caption style={{ marginTop: spacing.sm, color: colors.error }}>{pickError}</Caption>
            ) : null}
          </Card>
        ) : null}

        <MemoryVisibilitySelector value={visibility} onChange={setVisibility} />
        <Caption style={{ color: colors.ashTaupe }}>
          Uploads stay in your account only. They’re shared with others just based on the visibility you choose here.
        </Caption>
      </View>
    </ScreenContainer>
  );
}
