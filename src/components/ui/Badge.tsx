import { Text, View } from 'react-native';
import { colors, fonts, radii } from '@/constants/theme';
import type { NodeStatus, VisibilityLevel } from '@/types/models';
import { visibilityLabels } from '@/constants/copy';

type Tone = 'gold' | 'neutral' | 'memorial' | 'soft';

const toneStyles: Record<Tone, { bg: string; fg: string; border: string }> = {
  gold: { bg: 'rgba(184,135,47,0.12)', fg: colors.guardianGold, border: 'rgba(184,135,47,0.3)' },
  neutral: { bg: 'rgba(30,34,36,0.06)', fg: colors.charcoal, border: colors.hairline },
  memorial: { bg: colors.candlelight, fg: colors.deepUmber, border: colors.softGold },
  soft: { bg: colors.mistBeige, fg: colors.deepUmber, border: 'transparent' },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const s = toneStyles[tone];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: s.bg,
        borderColor: s.border,
        borderWidth: 1,
        borderRadius: radii.pill,
        paddingHorizontal: 12,
        paddingVertical: 5,
      }}
    >
      <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: s.fg, fontWeight: '600', letterSpacing: 0.3 }}>
        {label}
      </Text>
    </View>
  );
}

/** Visibility shown with reassuring, human language. */
export function VisibilityBadge({ visibility }: { visibility: VisibilityLevel }) {
  const tone: Tone = visibility === 'public' ? 'gold' : 'soft';
  const label = visibility === 'public' ? 'Public' : `${visibilityLabels[visibility]}`;
  const prefix = visibility === 'public' ? '' : 'Private · ';
  return <Badge label={`${prefix}${label}`} tone={tone} />;
}

const statusCopy: Record<NodeStatus, { label: string; tone: Tone }> = {
  placeholder: { label: 'Awaiting', tone: 'neutral' },
  invited: { label: 'Invited', tone: 'gold' },
  claim_pending: { label: 'Claim pending', tone: 'gold' },
  claimed: { label: 'Claimed', tone: 'soft' },
  managed: { label: 'Cared for', tone: 'soft' },
  memorial_pending: { label: 'Memory Light pending', tone: 'memorial' },
  memory_light: { label: 'Memory Light', tone: 'memorial' },
  disputed: { label: 'Under review', tone: 'neutral' },
  archived: { label: 'Archived', tone: 'neutral' },
};

/** Node status with gentle, non-technical wording. */
export function NodeStatusBadge({ status }: { status: NodeStatus }) {
  const s = statusCopy[status] ?? statusCopy.placeholder;
  return <Badge label={s.label} tone={s.tone} />;
}
