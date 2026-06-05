import { View } from 'react-native';
import { spacing } from '@/constants/theme';
import { Caption, Title } from './Typography';

export function SectionHeader({ title, overline }: { title: string; overline?: string }) {
  return (
    <View style={{ gap: spacing.xs, marginBottom: spacing.md }}>
      {overline ? (
        <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.4 }}>{overline}</Caption>
      ) : null}
      <Title>{title}</Title>
    </View>
  );
}
