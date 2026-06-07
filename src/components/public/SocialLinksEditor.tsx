import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { SocialIcon, SOCIAL_LABELS } from '@/components/brand/SocialIcon';
import { SocialIconPickerModal } from '@/components/public/SocialIconPickerModal';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Body, Caption } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import {
  SOCIAL_LINK_VISIBILITY_OPTIONS,
  SOCIAL_URL_PLACEHOLDERS,
  createSocialLinkItem,
  moveSocialLinkItem,
  removeSocialLinkItem,
  socialLinkLabel,
} from '@/lib/socialLinks';
import type { SocialLinkItem, SocialLinkVisibility } from '@/types/models';

function VisibilityChips({
  value,
  onChange,
}: {
  value: SocialLinkVisibility;
  onChange: (v: SocialLinkVisibility) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
      {SOCIAL_LINK_VISIBILITY_OPTIONS.map((opt) => {
        const active = opt.id === value;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: radii.pill,
              borderWidth: 1.5,
              borderColor: active ? colors.guardianGold : colors.mistBeige,
              backgroundColor: active ? 'rgba(184,135,47,0.12)' : colors.white,
            }}
          >
            <Caption style={{ color: active ? colors.guardianGold : colors.deepUmber, fontWeight: '700' }}>
              {opt.label}
            </Caption>
          </Pressable>
        );
      })}
    </View>
  );
}

function SocialLinkRow({
  item,
  index,
  total,
  onChange,
  onRemove,
  onMove,
  onPickIcon,
}: {
  item: SocialLinkItem;
  index: number;
  total: number;
  onChange: (next: SocialLinkItem) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onPickIcon: () => void;
}) {
  return (
    <View
      style={{
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.hairline,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Pressable onPress={onPickIcon} accessibilityRole="button" accessibilityLabel="Change icon">
          <SocialIcon network={item.network} tile size={20} />
        </Pressable>
        <View style={{ flex: 1, gap: 2 }}>
          <Body style={{ fontWeight: '700' }}>{socialLinkLabel(item)}</Body>
          <Caption style={{ color: colors.deepUmber }}>{SOCIAL_LABELS[item.network]}</Caption>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable
            onPress={() => onMove(-1)}
            disabled={index === 0}
            accessibilityLabel="Move up"
            style={{ padding: 8, opacity: index === 0 ? 0.35 : 1 }}
          >
            <Body>↑</Body>
          </Pressable>
          <Pressable
            onPress={() => onMove(1)}
            disabled={index === total - 1}
            accessibilityLabel="Move down"
            style={{ padding: 8, opacity: index === total - 1 ? 0.35 : 1 }}
          >
            <Body>↓</Body>
          </Pressable>
          <Pressable onPress={onRemove} accessibilityLabel="Remove link" style={{ padding: 8 }}>
            <Body style={{ color: colors.deepUmber }}>✕</Body>
          </Pressable>
        </View>
      </View>

      <TextField
        label="Display name (optional)"
        value={item.label ?? ''}
        onChangeText={(label) => onChange({ ...item, label })}
        placeholder={SOCIAL_LABELS[item.network]}
        autoCapitalize="sentences"
      />

      <TextField
        label="Link or contact"
        value={item.url}
        onChangeText={(url) => onChange({ ...item, url })}
        placeholder={SOCIAL_URL_PLACEHOLDERS[item.network] ?? 'https://…'}
        autoCapitalize="none"
        keyboardType={item.network === 'email' ? 'email-address' : item.network === 'sms' ? 'phone-pad' : 'default'}
      />

      <View style={{ gap: spacing.xs }}>
        <Caption style={{ color: colors.deepUmber, fontWeight: '700' }}>Who can see this</Caption>
        <VisibilityChips value={item.visibility} onChange={(visibility) => onChange({ ...item, visibility })} />
      </View>
    </View>
  );
}

/** Editable ordered social links with privacy and custom icons. */
export function SocialLinksEditor({
  items,
  onChange,
  accountEmail,
}: {
  items: SocialLinkItem[];
  onChange: (items: SocialLinkItem[]) => void;
  accountEmail?: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTargetId, setPickerTargetId] = useState<string | null>(null);

  const openAddPicker = () => {
    setPickerTargetId(null);
    setPickerOpen(true);
  };

  const openChangeIcon = (id: string) => {
    setPickerTargetId(id);
    setPickerOpen(true);
  };

  const onPickNetwork = (network: typeof items[0]['network']) => {
    if (pickerTargetId) {
      onChange(
        items.map((row) =>
          row.id === pickerTargetId ? { ...row, network, label: row.label } : row,
        ),
      );
      return;
    }
    const preset =
      network === 'email' && accountEmail ? createSocialLinkItem('email', { url: accountEmail }) : createSocialLinkItem(network);
    onChange([...items, preset]);
  };

  return (
    <View style={{ gap: spacing.md }}>
      {items.length === 0 ? (
        <Caption style={{ color: colors.deepUmber }}>Add email, SMS, or social links for your public page.</Caption>
      ) : (
        items.map((item, index) => (
          <SocialLinkRow
            key={item.id}
            item={item}
            index={index}
            total={items.length}
            onChange={(next) => onChange(items.map((row) => (row.id === next.id ? next : row)))}
            onRemove={() => onChange(removeSocialLinkItem(items, item.id))}
            onMove={(direction) => onChange(moveSocialLinkItem(items, item.id, direction))}
            onPickIcon={() => openChangeIcon(item.id)}
          />
        ))
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Button label="Add link" variant="secondary" fullWidth={false} onPress={openAddPicker} />
      </View>

      <SocialIconPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onPickNetwork}
        title={pickerTargetId ? 'Change icon' : 'Add a link'}
      />
    </View>
  );
}
