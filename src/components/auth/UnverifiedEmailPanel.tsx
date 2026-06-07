import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { GoldStar } from '@/components/brand/GoldStar';
import { LightDivider } from '@/components/brand/LightDivider';
import { colors, spacing } from '@/constants/theme';
import type { AuthCallbackIntent } from '@/lib/authRedirect';
import { formatCaughtError } from '@/lib/userErrors';
import * as authService from '@/services/authService';

type Props = {
  email: string;
  intent?: AuthCallbackIntent;
  title: string;
  body: string;
  secondaryAction?: { label: string; onPress: () => void };
};

/** Shared “verify your email” panel with resend for onboarding, login, and claim flows. */
export function UnverifiedEmailPanel({ email, intent, title, body, secondaryAction }: Props) {
  const [resendBusy, setResendBusy] = useState(false);
  const [resendNote, setResendNote] = useState<string | null>(null);

  const onResend = async () => {
    setResendNote(null);
    setResendBusy(true);
    try {
      await authService.resendEmailConfirmation(email, intent);
      setResendNote('A fresh verification link is on its way. Check your inbox and spam folder.');
    } catch (e: unknown) {
      setResendNote(formatCaughtError(e, 'Could not resend right now. Please try again in a little while.', 'auth'));
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <View style={{ alignItems: 'center', gap: spacing.lg }}>
      <GoldStar size={22} />
      <Display align="center" style={{ fontSize: 32 }}>
        {title}
      </Display>
      <Body align="center" style={{ maxWidth: 360, fontSize: 18, color: colors.deepUmber }}>
        {body}
      </Body>
      <LightDivider width={70} />
      <Caption align="center" style={{ maxWidth: 320, color: colors.ashTaupe }}>
        Links expire after a while. If yours is old, tap Resend for a new one — then open the latest email only.
      </Caption>
      <View style={{ width: '100%', maxWidth: 360, gap: spacing.sm }}>
        <Button
          label={resendBusy ? 'Sending…' : 'Resend verification email'}
          variant="gold"
          disabled={resendBusy}
          onPress={onResend}
        />
        {secondaryAction ? (
          <Button label={secondaryAction.label} variant="secondary" onPress={secondaryAction.onPress} />
        ) : null}
      </View>
      {resendNote ? (
        <Caption style={{ color: colors.deepUmber, textAlign: 'center', maxWidth: 340 }}>{resendNote}</Caption>
      ) : null}
    </View>
  );
}
