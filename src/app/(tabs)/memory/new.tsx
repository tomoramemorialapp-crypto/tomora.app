import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { RichTextEditor } from '@/components/ui/RichText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MemoryVisibilitySelector } from '@/components/memories/MemoryVisibilitySelector';
import { Avatar } from '@/components/ui/Avatar';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';
import type { MemoryMediaItem, MemoryType, VisibilityLevel } from '@/types/models';
import {
  capFor,
  formatBytes,
  isWithinCap,
  MAX_MEDIA_BYTES_PER_MEMORY,
  memoryTypeForKind,
  pickMedia,
  sumBytes,
  uploadMedia,
  type PickedFile,
  type UploadMediaKind,
} from '@/lib/media';

type Mode = 'text' | 'media' | 'link';

const MODES: { id: Mode; label: string }[] = [
  { id: 'text', label: 'Story' },
  { id: 'media', label: 'Photos & media' },
  { id: 'link', label: 'Link' },
];

const MEDIA_KINDS: { id: UploadMediaKind; label: string }[] = [
  { id: 'photo', label: 'Photo' },
  { id: 'video', label: 'Video' },
  { id: 'audio', label: 'Audio' },
  { id: 'document', label: 'File' },
];

export default function NewMemory() {
  const router = useRouter();
  const params = useLocalSearchParams<{ nodeId?: string; memoryId?: string; pickRecipient?: string }>();
  const { account, nodes, getNode, getMemory, createMemory, updateMemory, deleteMemory } = useAppState();

  const editing = getMemory(String(params.memoryId ?? ''));
  const selfNode = nodes.find((n) => n.ownerAccountId) ?? nodes[0];
  const pickRecipient = params.pickRecipient === '1' && !editing;

  // Recipient: locked to the launching profile, or chosen here (defaults to you).
  const initialRecipient = editing?.nodeId ?? params.nodeId ?? selfNode?.id;
  const [recipientId, setRecipientId] = useState<string | undefined>(initialRecipient);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const targetNode = getNode(String(recipientId ?? ''));

  const [mode, setMode] = useState<Mode>(editing ? editingMode(editing.type) : 'text');
  const [title, setTitle] = useState(editing?.title ?? '');
  const [body, setBody] = useState(editing?.body ?? '');
  const [caption, setCaption] = useState(editing?.caption ?? '');
  const [link, setLink] = useState(editing?.mediaUrl ?? '');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [pickError, setPickError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<VisibilityLevel>(editing?.visibility ?? 'private');
  const [taggedIds, setTaggedIds] = useState<string[]>(editing?.taggedNodeIds ?? []);
  const [busy, setBusy] = useState(false);

  const toggleTag = (id: string) =>
    setTaggedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const mediaBytes = sumBytes(files);

  const canSave = useMemo(() => {
    if (busy || !targetNode) return false;
    if (editing) return true;
    if (mode === 'text') return body.trim().length > 0;
    if (mode === 'link') return link.trim().length > 0;
    return files.length > 0 && mediaBytes <= MAX_MEDIA_BYTES_PER_MEMORY;
  }, [busy, targetNode, editing, mode, body, link, files, mediaBytes]);

  const onAddFile = async (kind: UploadMediaKind) => {
    setPickError(null);
    try {
      const picked = await pickMedia(kind);
      if (!picked) return;
      if (!isWithinCap(picked)) {
        setPickError(
          `That ${picked.kind} is ${formatBytes(picked.size)} — single ${picked.kind} files are capped at ${formatBytes(
            capFor(picked.kind),
          )}.`,
        );
        return;
      }
      if (mediaBytes + picked.size > MAX_MEDIA_BYTES_PER_MEMORY) {
        setPickError(
          `That would put this memory over ${formatBytes(MAX_MEDIA_BYTES_PER_MEMORY)} of media. Remove a file or start another memory.`,
        );
        return;
      }
      setFiles((prev) => [...prev, picked]);
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
        await updateMemory({ id: editing.id, title, body, caption, taggedNodeIds: taggedIds, visibility });
        router.back();
        return;
      }

      if (mode === 'text') {
        await createMemory({ nodeId: targetNode.id, type: 'text', title, body, taggedNodeIds: taggedIds, visibility });
      } else if (mode === 'link') {
        await createMemory({ nodeId: targetNode.id, type: 'link', title, caption, mediaUrl: link, taggedNodeIds: taggedIds, visibility });
      } else {
        const uploaded: MemoryMediaItem[] = [];
        for (const f of files) {
          const u = await uploadMedia(account.id, f);
          uploaded.push({ storagePath: u.storagePath, sizeBytes: u.sizeBytes, mime: u.mime, kind: f.kind, name: f.name });
        }
        const primaryType: MemoryType = memoryTypeForKind(files[0]?.kind ?? 'photo');
        await createMemory({ nodeId: targetNode.id, type: primaryType, title, caption, media: uploaded, taggedNodeIds: taggedIds, visibility });
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

  const showCaption = mode !== 'text';

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

        {/* Recipient — chosen here (default: you) or locked to the launching profile */}
        <View>
          <Pressable
            onPress={() => pickRecipient && setRecipientOpen((v) => !v)}
            disabled={!pickRecipient}
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
            <View style={{ flex: 1 }}>
              <Caption>For</Caption>
              <Body style={{ fontWeight: '600' }}>{targetNode.displayName}</Body>
            </View>
            {pickRecipient ? (
              <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>
                {recipientOpen ? 'Close' : 'Change ›'}
              </Caption>
            ) : null}
          </Pressable>

          {pickRecipient && recipientOpen ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {nodes.map((n) => {
                  const active = n.id === recipientId;
                  return (
                    <Pressable
                      key={n.id}
                      onPress={() => {
                        setRecipientId(n.id);
                        setRecipientOpen(false);
                      }}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderRadius: radii.pill,
                        borderWidth: 1.5,
                        borderColor: active ? colors.guardianGold : colors.mistBeige,
                        backgroundColor: active ? 'rgba(184,135,47,0.12)' : colors.white,
                      }}
                    >
                      <Body style={{ fontSize: 14, color: active ? colors.guardianGold : colors.ink }}>
                        {n.displayName}
                      </Body>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          ) : null}
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

        {/* Story (rich text) */}
        {mode === 'text' ? (
          <RichTextEditor
            label="Your story"
            value={body}
            onChange={setBody}
            placeholder="Share a moment, a feeling, or something you never want to forget…"
            autoFocus
          />
        ) : null}

        {/* Caption — every type except a Story */}
        {showCaption ? (
          <TextField
            label="Caption (optional)"
            value={caption}
            onChangeText={setCaption}
            placeholder="Add a caption"
            multiline
          />
        ) : null}

        {/* Link */}
        {mode === 'link' && !editing ? (
          <TextField label="Link" value={link} onChangeText={setLink} placeholder="https://…" autoCapitalize="none" />
        ) : null}

        {/* Media — multiple files up to 100MB total */}
        {mode === 'media' && !editing ? (
          <Card>
            <Body style={{ fontWeight: '600', marginBottom: spacing.xs }}>Add photos, videos, audio, or files</Body>
            <Caption style={{ marginBottom: spacing.sm }}>
              Up to {formatBytes(MAX_MEDIA_BYTES_PER_MEMORY)} of media per memory (plus a 10MB allowance for text). Add
              as many files as fit.
            </Caption>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {MEDIA_KINDS.map((k) => (
                <Button key={k.id} label={`+ ${k.label}`} variant="secondary" onPress={() => onAddFile(k.id)} />
              ))}
            </View>

            {files.length > 0 ? (
              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                {files.map((f, i) => (
                  <View
                    key={`${f.uri}-${i}`}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Body numberOfLines={1} style={{ flex: 1, marginRight: spacing.sm }}>
                      {f.name}
                    </Body>
                    <Caption style={{ marginRight: spacing.sm }}>{formatBytes(f.size)}</Caption>
                    <Pressable onPress={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} hitSlop={8}>
                      <Caption style={{ color: colors.error, fontWeight: '700' }}>Remove</Caption>
                    </Pressable>
                  </View>
                ))}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
                  <Caption style={{ fontWeight: '700' }}>Total media</Caption>
                  <Caption style={{ fontWeight: '700', color: mediaBytes > MAX_MEDIA_BYTES_PER_MEMORY ? colors.error : colors.deepUmber }}>
                    {formatBytes(mediaBytes)} / {formatBytes(MAX_MEDIA_BYTES_PER_MEMORY)}
                  </Caption>
                </View>
              </View>
            ) : null}

            {pickError ? <Caption style={{ marginTop: spacing.sm, color: colors.error }}>{pickError}</Caption> : null}
          </Card>
        ) : null}

        {/* Editing existing media memory — show stored files (read-only) */}
        {editing && editing.media.length > 0 ? (
          <Card>
            <Body style={{ fontWeight: '600', marginBottom: spacing.xs }}>Attached media</Body>
            {editing.media.map((m, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Body numberOfLines={1} style={{ flex: 1 }}>
                  {m.name ?? m.kind}
                </Body>
                <Caption>{formatBytes(m.sizeBytes)}</Caption>
              </View>
            ))}
          </Card>
        ) : null}

        {/* Tag family members */}
        <View style={{ gap: spacing.sm }}>
          <Body style={{ fontWeight: '600' }}>Tag family members (optional)</Body>
          <Caption style={{ color: colors.ashTaupe }}>
            Tagged people are linked from this memory to their Life Profile.
          </Caption>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {nodes
              .filter((n) => n.id !== recipientId)
              .map((n) => {
                const active = taggedIds.includes(n.id);
                return (
                  <Pressable
                    key={n.id}
                    onPress={() => toggleTag(n.id)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: radii.pill,
                      borderWidth: 1.5,
                      borderColor: active ? colors.guardianGold : colors.mistBeige,
                      backgroundColor: active ? 'rgba(184,135,47,0.12)' : colors.white,
                    }}
                  >
                    <Body style={{ fontSize: 14, color: active ? colors.guardianGold : colors.ink }}>
                      {active ? '✓ ' : ''}
                      {n.displayName}
                    </Body>
                  </Pressable>
                );
              })}
          </View>
        </View>

        <MemoryVisibilitySelector value={visibility} onChange={setVisibility} />
        <Caption style={{ color: colors.ashTaupe }}>
          Uploads stay in your account only. They’re shared with others based on the visibility you choose here.
        </Caption>
      </View>
    </ScreenContainer>
  );
}

function editingMode(type: MemoryType): Mode {
  if (type === 'text') return 'text';
  if (type === 'link') return 'link';
  return 'media';
}
