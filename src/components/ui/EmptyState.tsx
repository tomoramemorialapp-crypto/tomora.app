import React from 'react';
import { View } from 'react-native';
import { spacing } from '@/constants/theme';
import { GoldStar } from '@/components/brand/GoldStar';
import { Body, Title } from './Typography';

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
      <GoldStar size={22} />
      <Title align="center">{title}</Title>
      {body ? <Body align="center" style={{ maxWidth: 320 }}>{body}</Body> : null}
      {action ? <View style={{ marginTop: spacing.sm, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}
