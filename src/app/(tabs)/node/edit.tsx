import { useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { EmptyState } from '@/components/ui/EmptyState';
import { VisibilitySelector } from '@/components/ui/VisibilitySelector';
import { DateValueInput } from '@/components/ui/DateValueInput';
import { Dropdown } from '@/components/ui/Dropdown';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { PlaceField } from '@/components/ui/PlaceField';
import { SuggestChangeModal } from '@/components/profile/SuggestChangeModal';
import { ConnectionsEditor } from '@/components/profile/ConnectionsEditor';
import {
  COUNTRIES,
  GENDER_OPTIONS,
  SEX_OPTIONS,
  SUGGESTED_TAGS,
  WORLD_LANGUAGES,
  toOptions,
} from '@/constants/options';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';
import type { VisibilityLevel } from '@/types/models';
import { ProfilePhotoCropModal } from '@/components/media/ProfilePhotoCropModal';
import { capFor, formatBytes, isWithinCap, pickMedia, uploadMedia } from '@/lib/media';
import type {
  DateValue,
  GenderSexField,
  NodeProfile,
  PlaceReference,
  ProfileFieldKey,
} from '@/types/profile';
import { PROFILE_FIELD_LABELS } from '@/types/profile';
import {
  defaultVisibilityForField,
  editScopeFor,
  formatDateValue,
  formatGenderSex,
  formatPlace,
  makeField,
} from '@/lib/profile';
import type { ChangeLogEntryInput } from '@/services/profileService';

const GENDER_DISPLAY: GenderSexField['displayPreference'][] = ['show_gender', 'show_sex', 'show_both', 'hide'];

function listToString(v?: string[]): string {
  return (v ?? []).join(', ');
}
function stringToList(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function placeHasValue(p: PlaceReference): boolean {
  return !!(p.displayName || p.city || p.country || p.address);
}

export default function EditProfile() {
  const router = useRouter();
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();
  const { getNode, account, updateNodeProfile, deleteNode } = useAppState();

  const node = getNode(String(nodeId));
  const scope = node ? editScopeFor(node, account?.id) : 'suggest';
  const canEdit = scope === 'owner' || scope === 'guardian';
  const isSelf = !!node?.ownerAccountId;
  /** Creator may delete unclaimed nodes they steward (not their own self node). */
  const canDelete = scope === 'guardian' && !isSelf;

  const profile = node?.profile ?? {};

  // --- Local editable form state (owner/guardian) ---
  const [fullName, setFullName] = useState(profile.fullName?.value ?? node?.displayName ?? '');
  const [photo, setPhoto] = useState(profile.profilePhoto?.value ?? '');
  const [altNames, setAltNames] = useState(listToString(profile.alternateNames?.value));

  const [dob, setDob] = useState<DateValue | undefined>(profile.dateOfBirth?.value);
  const [dod, setDod] = useState<DateValue | undefined>(profile.dateOfDeath?.value);
  // Passing is owned by the single Passing control on the Life Profile (which runs
  // the consensus / memorial flow). The editor only reflects that state: death
  // details appear once a node has actually been marked as having passed.
  const passed =
    node?.isLiving === false ||
    node?.status === 'memory_light' ||
    node?.status === 'memorial_pending' ||
    !!profile.dateOfDeath?.value;

  const [pob, setPob] = useState<PlaceReference | undefined>(profile.placeOfBirth?.value);
  const [pod, setPod] = useState<PlaceReference | undefined>(profile.placeOfDeath?.value);

  const [genderIdentity, setGenderIdentity] = useState(profile.genderSex?.value?.genderIdentity ?? '');
  const [sexRecorded, setSexRecorded] = useState(profile.genderSex?.value?.sexAssignedOrRecorded ?? '');
  const [genderDisplay, setGenderDisplay] = useState<GenderSexField['displayPreference']>(
    profile.genderSex?.value?.displayPreference ?? 'show_gender',
  );

  const [languages, setLanguages] = useState<string[]>(profile.languages?.value ?? []);
  const [notes, setNotes] = useState(profile.notesHistory?.value?.notes ?? '');
  const [lifeHistory, setLifeHistory] = useState(profile.notesHistory?.value?.lifeHistory ?? '');
  const [knownFor, setKnownFor] = useState(listToString(profile.notesHistory?.value?.knownFor));
  const [occupation, setOccupation] = useState(listToString(profile.notesHistory?.value?.occupationOrRole));
  const [tags, setTags] = useState<string[]>(node?.tags ?? []);

  // Per-field visibility, seeded from existing field metadata or sensible defaults.
  const [vis, setVis] = useState<Partial<Record<ProfileFieldKey, VisibilityLevel>>>(() => {
    const base: Partial<Record<ProfileFieldKey, VisibilityLevel>> = {};
    const def = node?.defaultVisibility ?? 'family_tree';
    (Object.keys(PROFILE_FIELD_LABELS) as ProfileFieldKey[]).forEach((k) => {
      base[k] = profile[k]?.visibility ?? defaultVisibilityForField(k, def);
    });
    return base;
  });
  const setFieldVis = (k: ProfileFieldKey) => (next: VisibilityLevel) => setVis((p) => ({ ...p, [k]: next }));

  const [saving, setSaving] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [cropUri, setCropUri] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const onUploadPhoto = async () => {
    if (!account) return;
    setPhotoError(null);
    try {
      const picked = await pickMedia('photo');
      if (!picked) return;
      if (!isWithinCap(picked)) {
        setPhotoError(`That image is ${formatBytes(picked.size)} — the limit is ${formatBytes(capFor('photo'))}.`);
        return;
      }
      if (Platform.OS === 'web') {
        setCropUri(picked.uri);
        return;
      }
      setPhotoBusy(true);
      const uploaded = await uploadMedia(account.id, picked);
      setPhoto(uploaded.storagePath);
    } catch (e) {
      console.warn('[tomora] photo pick failed', e);
      setPhotoError('Could not open that photo. Please try again.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const onCropConfirm = async (uri: string, blob?: Blob) => {
    if (!account) return;
    setCropUri(null);
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const body = blob ?? (await fetch(uri).then((r) => r.blob()));
      if (!body) throw new Error('Could not read cropped image.');
      const file = {
        uri,
        name: `profile-${Date.now()}.jpg`,
        size: body.size,
        mimeType: 'image/jpeg',
        kind: 'photo' as const,
      };
      const uploaded = await uploadMedia(account.id, file);
      setPhoto(uploaded.storagePath);
    } catch (e) {
      console.warn('[tomora] photo upload failed', e);
      setPhotoError('Could not upload that photo. Please try again.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const onDeleteNode = async () => {
    if (!node) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteNode(node.id);
      router.replace('/(tabs)/family-tree');
    } catch (e) {
      console.warn('[tomora] delete node failed', e);
      setDeleteError('Could not remove this profile. Please try again.');
      setDeleting(false);
    }
  };

  const dirtyRef = useMemo(() => ({}), []); // placeholder to keep memo stable

  if (!node) {
    return (
      <ScreenContainer center>
        <EmptyState title="This profile isn’t here." body="It may have been removed from your Family Tree." />
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  const accountId = account?.id ?? '';

  function buildProfileAndLog(): { next: NodeProfile; log: ChangeLogEntryInput[]; nextTags: string[] } {
    const next: NodeProfile = { ...profile };
    const log: ChangeLogEntryInput[] = [];

    const apply = <T,>(
      key: ProfileFieldKey,
      newValue: T | undefined,
      isEmpty: boolean,
    ) => {
      const prev = profile[key];
      const prevValueJson = prev ? JSON.stringify(prev.value) : undefined;
      const visChanged = prev ? prev.visibility !== vis[key] : false;
      if (isEmpty) {
        if (prev) {
          delete (next as Record<string, unknown>)[key];
          log.push({ fieldKey: key, action: 'field_updated', previousValue: prev.value, newValue: null });
        }
        return;
      }
      const newValueJson = JSON.stringify(newValue);
      const valueChanged = prevValueJson !== newValueJson;
      if (!prev || valueChanged || visChanged) {
        (next as Record<string, unknown>)[key] = makeField(newValue as T, {
          visibility: vis[key] ?? 'family_tree',
          scope: scope as 'owner' | 'guardian',
          accountId,
        });
        if (!prev || valueChanged) {
          log.push({ fieldKey: key, action: 'field_updated', previousValue: prev?.value ?? null, newValue });
        } else if (visChanged) {
          log.push({ fieldKey: key, action: 'field_visibility_changed', previousValue: prev?.visibility, newValue: vis[key] });
        }
      }
    };

    apply('fullName', fullName.trim(), !fullName.trim());
    apply('profilePhoto', photo.trim(), !photo.trim());
    apply('alternateNames', stringToList(altNames), stringToList(altNames).length === 0);

    apply('dateOfBirth', dob, !dob);
    // Death details are only persisted for nodes already marked as passed.
    apply('dateOfDeath', passed ? dod : undefined, !passed || !dod);

    apply('placeOfBirth', pob, !pob || !placeHasValue(pob));
    apply('placeOfDeath', passed ? pod : undefined, !passed || !pod || !placeHasValue(pod));

    const gs: GenderSexField = {
      genderIdentity: genderIdentity.trim() || undefined,
      sexAssignedOrRecorded: sexRecorded.trim() || undefined,
      displayPreference: genderDisplay,
    };
    apply('genderSex', gs, !gs.genderIdentity && !gs.sexAssignedOrRecorded);

    apply('languages', languages, languages.length === 0);

    const history = {
      notes: notes.trim() || undefined,
      lifeHistory: lifeHistory.trim() || undefined,
      knownFor: stringToList(knownFor),
      occupationOrRole: stringToList(occupation),
    };
    const historyEmpty =
      !history.notes && !history.lifeHistory && history.knownFor.length === 0 && history.occupationOrRole.length === 0;
    apply('notesHistory', history, historyEmpty);

    const nextTags = tags;
    if (JSON.stringify(nextTags) !== JSON.stringify(node!.tags)) {
      log.push({ fieldKey: 'tags', action: 'tags_updated', previousValue: node!.tags, newValue: nextTags });
    }

    return { next, log, nextTags };
  }

  async function onSave() {
    if (!canEdit || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { next, log, nextTags } = buildProfileAndLog();
      await updateNodeProfile({
        nodeId: node!.id,
        profile: next,
        tags: nextTags,
        defaultVisibility: vis.fullName,
        changeLog: log,
      });
      router.replace({ pathname: '/node/[nodeId]', params: { nodeId: node!.id } });
    } catch (e) {
      console.warn('[tomora] profile save failed', e);
      setSaveError(e instanceof Error ? e.message : 'Could not save these changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  void dirtyRef;

  // ----- Suggest-only (non-owner) view -----
  if (!canEdit) {
    const rows: { key: ProfileFieldKey; value: string }[] = [
      { key: 'fullName', value: profile.fullName?.value ?? node.displayName },
      { key: 'alternateNames', value: listToString(profile.alternateNames?.value) },
      { key: 'dateOfBirth', value: formatDateValue(profile.dateOfBirth?.value) },
      { key: 'dateOfDeath', value: formatDateValue(profile.dateOfDeath?.value) },
      { key: 'placeOfBirth', value: formatPlace(profile.placeOfBirth?.value) },
      { key: 'genderSex', value: formatGenderSex(profile.genderSex?.value) },
      { key: 'languages', value: listToString(profile.languages?.value) },
      { key: 'notesHistory', value: profile.notesHistory?.value?.notes ?? '' },
    ];
    return (
      <ScreenContainer
        maxWidth={620}
        showBack
        onBack={() => router.back()}
        footer={<Button label="Suggest a Change" variant="gold" onPress={() => setSuggestOpen(true)} />}
      >
        <Display style={{ fontSize: 28, marginBottom: spacing.xs }}>{node.displayName}</Display>
        <Caption style={{ marginBottom: spacing.lg }}>
          This profile is kept by its owner. You can suggest changes for them to review.
        </Caption>
        <Card>
          <SectionHeader title="Profile details" />
          <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
            {rows.map((r) => (
              <View key={r.key} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
                <Caption style={{ flex: 1 }}>{PROFILE_FIELD_LABELS[r.key]}</Caption>
                <Body style={{ flex: 1.4, textAlign: 'right' }}>{r.value || '—'}</Body>
              </View>
            ))}
          </View>
        </Card>
        <SuggestChangeModal
          visible={suggestOpen}
          node={node}
          onClose={() => setSuggestOpen(false)}
        />
      </ScreenContainer>
    );
  }

  // ----- Owner / Guardian editable view -----
  const sectionGap = { marginBottom: spacing.lg };

  return (
    <ScreenContainer
      maxWidth={620}
      showBack
      onBack={() => router.back()}
      footer={
        <View style={{ gap: spacing.sm }}>
          {saveError ? <Caption style={{ color: colors.error, textAlign: 'center' }}>{saveError}</Caption> : null}
          <Button label={saving ? 'Saving…' : 'Save changes'} variant="gold" disabled={saving} onPress={onSave} />
        </View>
      }
    >
      <Display style={{ fontSize: 28, marginBottom: spacing.xs }}>Edit Profile</Display>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
        <Caption>{node.displayName}</Caption>
        <Badge label={scope === 'owner' ? 'You own this profile' : 'Cared for by you'} tone="soft" />
      </View>

      {/* Photo & Name */}
      <Card style={sectionGap}>
        <SectionHeader title="Photo & Name" />
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Avatar name={fullName || node.displayName} size={64} uri={photo || undefined} />
            <View style={{ flex: 1 }}>
              <Button
                label={photoBusy ? 'Uploading…' : 'Upload from device'}
                variant="secondary"
                disabled={photoBusy}
                onPress={onUploadPhoto}
              />
              {photo ? (
                <Pressable onPress={() => setPhoto('')} hitSlop={8} style={{ marginTop: 6, alignSelf: 'center' }}>
                  <Caption style={{ color: colors.deepUmber }}>Remove photo</Caption>
                </Pressable>
              ) : null}
            </View>
          </View>
          {photoError ? <Caption style={{ color: colors.error }}>{photoError}</Caption> : null}
          <TextField label="Or paste a photo URL" value={photo} onChangeText={setPhoto} placeholder="https://…" autoCapitalize="none" />
          <TextField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Full name" />
          <VisibilitySelector value={vis.fullName ?? 'family_tree'} onChange={setFieldVis('fullName')} label="Name visibility" />
          <TextField
            label="Alternate, nick, or alias names"
            value={altNames}
            onChangeText={setAltNames}
            placeholder="Comma separated"
          />
          <VisibilitySelector value={vis.alternateNames ?? 'family_tree'} onChange={setFieldVis('alternateNames')} label="Alternate names visibility" />
        </View>
      </Card>

      {/* Life Details */}
      <Card style={sectionGap}>
        <SectionHeader title="Life Details" />
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <DateValueInput label="Date of birth" value={dob} onChange={setDob} />
          <VisibilitySelector value={vis.dateOfBirth ?? 'private'} onChange={setFieldVis('dateOfBirth')} label="Birth date visibility" />

          <PlaceField label="Place of birth" value={pob} onChange={setPob} placeholder="Search for a birthplace" />
          <VisibilitySelector value={vis.placeOfBirth ?? 'family_tree'} onChange={setFieldVis('placeOfBirth')} label="Place of birth visibility" />

          {passed ? (
            <View style={{ gap: spacing.md }}>
              <DateValueInput label="Date of death" value={dod} onChange={setDod} />
              <PlaceField label="Place of death" value={pod} onChange={setPod} placeholder="Search for a place" />
            </View>
          ) : !isSelf ? (
            <View
              style={{
                gap: spacing.sm,
                backgroundColor: colors.candlelight,
                borderColor: colors.softGold,
                borderWidth: 1,
                borderRadius: radii.md,
                padding: spacing.md,
              }}
            >
              <Caption style={{ color: colors.deepUmber }}>
                {node.displayName} is marked as living. To record a passing — and light a Memory Light — use “Report a
                passing” on their Life Profile. Date and place of passing can be added here afterward.
              </Caption>
              <Button
                label="Go to Life Profile"
                variant="secondary"
                onPress={() => router.push({ pathname: '/node/[nodeId]', params: { nodeId: node.id } })}
              />
            </View>
          ) : null}
        </View>
      </Card>

      {/* Personal Details */}
      <Card style={sectionGap}>
        <SectionHeader title="Personal Details" />
        <Caption style={{ marginTop: spacing.xs }}>Optional. Kept private by default.</Caption>
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <Dropdown
            label="Gender"
            value={genderIdentity}
            onChange={setGenderIdentity}
            options={GENDER_OPTIONS}
            placeholder="Select gender"
            allowOther
            otherLabel="Other (type your own)…"
          />
          <Dropdown
            label="Sex recorded / known as"
            value={sexRecorded}
            onChange={setSexRecorded}
            options={SEX_OPTIONS}
            placeholder="Select (optional)"
            allowOther
            otherLabel="Other (type your own)…"
          />
          <ChipRow
            label="Show"
            options={GENDER_DISPLAY.map((g) => ({ id: g as string, label: genderDisplayLabel(g) }))}
            value={genderDisplay as string}
            onChange={(v) => setGenderDisplay(v as GenderSexField['displayPreference'])}
          />
          <VisibilitySelector value={vis.genderSex ?? 'private'} onChange={setFieldVis('genderSex')} label="Gender / sex visibility" />
        </View>
      </Card>

      {/* Languages */}
      <Card style={sectionGap}>
        <SectionHeader title="Languages" />
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <MultiSelect
            label="Languages"
            values={languages}
            onChange={setLanguages}
            options={toOptions(WORLD_LANGUAGES)}
            placeholder="Search and choose languages"
            otherPlaceholder="Add another language"
          />
          <VisibilitySelector value={vis.languages ?? 'family_tree'} onChange={setFieldVis('languages')} label="Languages visibility" />
        </View>
      </Card>

      {/* Notes & History */}
      <Card style={sectionGap}>
        <SectionHeader title="Notes & History" />
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <TextField label="Notes" value={notes} onChangeText={setNotes} placeholder="A short note" multiline />
          <TextField label="What they did or do" value={occupation} onChangeText={setOccupation} placeholder="Comma separated" />
          <TextField label="Known for" value={knownFor} onChangeText={setKnownFor} placeholder="Comma separated" />
          <TextField label="Family history" value={lifeHistory} onChangeText={setLifeHistory} placeholder="Stories, places, roles…" multiline />
          <VisibilitySelector value={vis.notesHistory ?? 'family_tree'} onChange={setFieldVis('notesHistory')} label="Notes & history visibility" />
        </View>
      </Card>

      {/* Tags */}
      <Card style={sectionGap}>
        <SectionHeader title="Tags" />
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <MultiSelect
            label="Family tags"
            values={tags}
            onChange={setTags}
            options={[...toOptions(SUGGESTED_TAGS), ...toOptions(COUNTRIES)]}
            placeholder="Choose tags like Mother's side or a country"
            otherPlaceholder="Add your own tag"
            helperText="Tags help you filter the Family Tree — pick a side, a current country, or add your own."
          />
        </View>
      </Card>

      {/* Connections — relink to specific people across the tree (non-self) */}
      {!isSelf ? <ConnectionsEditor node={node} /> : null}

      {/* Danger zone — delete an unclaimed node you created */}
      {canDelete ? (
        <Card style={{ ...sectionGap, borderColor: colors.error, borderWidth: 1 }}>
          <SectionHeader title="Remove from tree" />
          <Caption style={{ marginTop: spacing.xs }}>
            You can remove this profile until {node.displayName} claims it. This also deletes their memories and
            connection. This can’t be undone.
          </Caption>
          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            {confirmDelete ? (
              <>
                <Button
                  label={deleting ? 'Removing…' : `Yes, remove ${node.displayName}`}
                  variant="gold"
                  disabled={deleting}
                  onPress={onDeleteNode}
                />
                <Button label="Keep this profile" variant="ghost" onPress={() => setConfirmDelete(false)} />
              </>
            ) : (
              <Button label="Remove from tree" variant="secondary" onPress={() => setConfirmDelete(true)} />
            )}
            {deleteError ? <Caption style={{ color: colors.error }}>{deleteError}</Caption> : null}
          </View>
        </Card>
      ) : null}

      <ProfilePhotoCropModal
        visible={!!cropUri}
        imageUri={cropUri}
        onCancel={() => setCropUri(null)}
        onConfirm={onCropConfirm}
      />

      <Pressable
        onPress={() => router.push({ pathname: '/node/history', params: { nodeId: node.id } })}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          backgroundColor: colors.white,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.mistBeige,
          marginBottom: spacing.md,
        }}
      >
        <Body>Change History</Body>
        <Caption style={{ color: colors.deepUmber }}>View ›</Caption>
      </Pressable>
    </ScreenContainer>
  );
}

function genderDisplayLabel(g: GenderSexField['displayPreference']): string {
  switch (g) {
    case 'show_gender':
      return 'Gender';
    case 'show_sex':
      return 'Sex';
    case 'show_both':
      return 'Both';
    default:
      return 'Hide';
  }
}

function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Caption style={{ color: colors.ashTaupe }}>{label}</Caption> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {options.map((o) => {
          const active = o.id === value;
          return (
            <Pressable
              key={o.id}
              onPress={() => onChange(o.id)}
              style={{
                backgroundColor: active ? 'rgba(184,135,47,0.14)' : colors.white,
                borderColor: active ? colors.guardianGold : colors.mistBeige,
                borderWidth: 1.5,
                borderRadius: radii.pill,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Body style={{ fontSize: 13, color: active ? colors.guardianGold : colors.charcoal }}>{o.label}</Body>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
