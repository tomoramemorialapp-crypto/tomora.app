import { Linking, Modal, Platform, Pressable, View } from 'react-native';

import { colors, radii, shadows, spacing } from '@/constants/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Body, Caption, Title } from '@/components/ui/Typography';
import type { UpcomingEvent } from '@/lib/occasions';
import type { FamilyNode } from '@/types/models';
import { addToCalendar, googleCalendarUrl } from '@/lib/calendar';

const KIND_LABEL: Record<UpcomingEvent['kind'], string> = {
  birthday: 'Birthday',
  death_anniversary: 'Remembrance',
  holiday: 'Holiday',
};

function formatLong(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

async function openExternal(url: string) {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    await Linking.openURL(url);
  } catch {
    // ignore
  }
}

/**
 * A calm pop-up for a single occasion: details, a jump to the person's Life
 * Profile (family occasions), a "notify me when it starts" toggle, and add-to-
 * calendar (downloads an .ics for iCalendar/Apple/Outlook, or opens Google).
 */
export function OccasionDetailModal({
  visible,
  event,
  node,
  notify,
  calendarAdded,
  onToggleNotify,
  onToggleCalendar,
  onOpenProfile,
  onClose,
}: {
  visible: boolean;
  event: UpcomingEvent | null;
  node?: FamilyNode;
  notify: boolean;
  calendarAdded: boolean;
  onToggleNotify: (on: boolean) => void;
  onToggleCalendar: (on: boolean) => void;
  onOpenProfile?: () => void;
  onClose: () => void;
}) {
  if (!event) return null;
  const isFamily = event.scope === 'family';
  const memorial = event.kind === 'death_anniversary';

  const handleCalendarToggle = (on: boolean) => {
    onToggleCalendar(on);
    if (on) void addToCalendar(event);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={(e) => e.stopPropagation?.()}
          style={[
            {
              backgroundColor: colors.paper,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.lg,
              paddingBottom: spacing.xl,
              gap: spacing.lg,
              maxWidth: 520,
              width: '100%',
              alignSelf: 'center',
            },
            shadows.soft,
          ]}
        >
          <View style={{ alignItems: 'center', gap: spacing.xs }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.mistBeige }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            {isFamily && node ? (
              <Avatar
                name={node.displayName}
                size={56}
                memorial={memorial}
                uri={node.profile?.profilePhoto?.value ?? node.avatarUrl}
              />
            ) : null}
            <View style={{ flex: 1, gap: 4 }}>
              <Title style={{ fontSize: 22 }}>{event.title}</Title>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Badge label={isFamily ? `Family · ${KIND_LABEL[event.kind]}` : 'Holiday'} tone={isFamily ? 'gold' : 'soft'} />
              </View>
            </View>
          </View>

          {/* Details */}
          <View style={{ gap: 4 }}>
            <Body style={{ fontWeight: '600' }}>{formatLong(event.date)}</Body>
            {event.subtitle ? <Caption style={{ color: colors.deepUmber }}>{event.subtitle}</Caption> : null}
          </View>

          {/* Open Life Profile (family occasions) */}
          {isFamily && onOpenProfile ? (
            <Button label="Open Life Profile" variant="secondary" onPress={onOpenProfile} />
          ) : null}

          {/* Notify toggle */}
          <View style={{ height: 1, backgroundColor: colors.hairline }} />
          <Toggle
            value={notify}
            onValueChange={onToggleNotify}
            label="Notify me when it starts"
            description="We'll send a gentle reminder on the day."
          />

          {/* Add to calendar */}
          <View style={{ height: 1, backgroundColor: colors.hairline }} />
          <Toggle
            value={calendarAdded}
            onValueChange={handleCalendarToggle}
            label="Add to my calendar"
            description="Saves a yearly event (.ics for iCalendar, Apple, Outlook, or Google)."
          />
          {calendarAdded ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button label="Download .ics" variant="ghost" onPress={() => void addToCalendar(event)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Google Calendar" variant="ghost" onPress={() => void openExternal(googleCalendarUrl(event))} />
              </View>
            </View>
          ) : null}

          <Pressable onPress={onClose} accessibilityRole="button" style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
            <Body style={{ fontWeight: '600', color: colors.deepUmber }}>Done</Body>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
