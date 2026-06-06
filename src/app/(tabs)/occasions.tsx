import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { OccasionDetailModal } from '@/components/occasions/OccasionDetailModal';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';
import { useT } from '@/i18n';
import { getUpcomingEvents, whenLabel, type UpcomingEvent } from '@/lib/occasions';
import { getCalendarIds, getNotifyIds, setCalendarAdded, setNotify } from '@/lib/occasionPrefs';

const EVENT_EMOJI: Record<UpcomingEvent['kind'], string> = {
  birthday: '🎂',
  death_anniversary: '🕯️',
  holiday: '✦',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' });
}

/** Small bell that fills when notifications are on for an occasion. */
function BellToggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel="Notify me"
      style={({ pressed }) => ({
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: on ? 'rgba(184,135,47,0.14)' : colors.white,
        borderWidth: 1.5,
        borderColor: on ? colors.guardianGold : colors.mistBeige,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill={on ? colors.guardianGold : 'none'}>
        <Path
          d="M6 9a6 6 0 0 1 12 0c0 4 1.2 5.4 2 6.2.3.3.1.8-.3.8H4.3c-.4 0-.6-.5-.3-.8C4.8 14.4 6 13 6 9Z"
          stroke={on ? colors.guardianGold : colors.ashTaupe}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <Path
          d="M10 19a2 2 0 0 0 4 0"
          stroke={on ? colors.guardianGold : colors.ashTaupe}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </Svg>
    </Pressable>
  );
}

export default function OccasionsScreen() {
  const router = useRouter();
  const t = useT();
  const { nodes, getNode } = useAppState();
  const events = useMemo(() => getUpcomingEvents(nodes, { withinDays: 366 }), [nodes]);

  const [notifyIds, setNotifyIds] = useState<Set<string>>(() => getNotifyIds());
  const [calIds, setCalIds] = useState<Set<string>>(() => getCalendarIds());
  const [selected, setSelected] = useState<UpcomingEvent | null>(null);

  const toggleNotify = (id: string, on: boolean) => setNotifyIds(setNotify(id, on));
  const toggleCalendar = (id: string, on: boolean) => setCalIds(setCalendarAdded(id, on));

  const selectedNode = selected?.nodeId ? getNode(selected.nodeId) : undefined;

  return (
    <ScreenContainer maxWidth={640}>
      <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
        <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>{t('occasions.kicker')}</Caption>
        <Display style={{ fontSize: 32 }}>{t('occasions.title')}</Display>
        <Body style={{ fontSize: 17, color: colors.deepUmber }}>{t('occasions.subtitle')}</Body>
      </View>

      {events.length === 0 ? (
        <EmptyState title={t('occasions.noDatesTitle')} body={t('occasions.noDatesBody')} />
      ) : (
        <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          {events.map((e) => {
            const node = e.nodeId ? getNode(e.nodeId) : undefined;
            const soon = e.daysUntil <= 7;
            const isFamily = e.scope === 'family';
            return (
              <Card
                key={e.id}
                onPress={() => setSelected(e)}
                style={
                  e.kind === 'death_anniversary'
                    ? { backgroundColor: colors.candlelight, borderColor: colors.softGold }
                    : undefined
                }
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  {node ? (
                    <Avatar
                      name={node.displayName}
                      size={44}
                      memorial={e.kind === 'death_anniversary'}
                      uri={node.profile?.profilePhoto?.value ?? node.avatarUrl}
                    />
                  ) : (
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: radii.pill,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.mistBeige,
                      }}
                    >
                      <Body style={{ fontSize: 20 }}>{EVENT_EMOJI[e.kind]}</Body>
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 4 }}>
                    <Body style={{ fontWeight: '600' }}>{e.title}</Body>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
                      <Badge label={isFamily ? t('common.family') : t('common.holiday')} tone={isFamily ? 'gold' : 'soft'} />
                      <Caption>
                        {formatDate(e.date)}
                        {e.subtitle ? ` · ${e.subtitle}` : ''}
                      </Caption>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Badge label={whenLabel(e.daysUntil)} tone={soon ? 'gold' : 'soft'} />
                    <BellToggle on={notifyIds.has(e.id)} onPress={() => toggleNotify(e.id, !notifyIds.has(e.id))} />
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      <Card style={{ backgroundColor: colors.candlelight, borderColor: colors.softGold }}>
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Title>Occasion Pages</Title>
            <Badge label="Coming soon" tone="gold" />
          </View>
          <Body style={{ color: colors.deepUmber }}>
            Soon you'll be able to host birthdays, weddings, reunions, and remembrances — with a guestbook, shared
            memories, and gentle ways to send support.
          </Body>
        </View>
      </Card>

      <OccasionDetailModal
        visible={selected !== null}
        event={selected}
        node={selectedNode}
        notify={selected ? notifyIds.has(selected.id) : false}
        calendarAdded={selected ? calIds.has(selected.id) : false}
        onToggleNotify={(on) => selected && toggleNotify(selected.id, on)}
        onToggleCalendar={(on) => selected && toggleCalendar(selected.id, on)}
        onOpenProfile={
          selectedNode
            ? () => {
                const id = selectedNode.id;
                setSelected(null);
                router.push({ pathname: '/node/[nodeId]', params: { nodeId: id } });
              }
            : undefined
        }
        onClose={() => setSelected(null)}
      />
    </ScreenContainer>
  );
}
