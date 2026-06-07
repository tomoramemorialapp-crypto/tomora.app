import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { TomoraEmblem } from '@/components/brand/TomoraEmblem';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';
import { formatCaughtError, USER_ERROR_MESSAGES } from '@/lib/userErrors';
import * as authService from '@/services/authService';
import {
  AuthCallbackSessionError,
  completeSessionFromAuthReturn,
  parseAuthReturnParams,
} from '@/lib/authCallbackSession';
import { supabase } from '@/lib/supabase';
import {
  capturePasswordRecoveryFromCurrentUrl,
  isPasswordRecoveryPendingSync,
  markPasswordRecoveryPending,
  urlIndicatesPasswordRecovery,
} from '@/lib/passwordRecovery';
import { useAppState } from '@/state/AppState';

type CallbackStatus = 'working' | 'error';

function readInitialAuthError(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return parseAuthReturnParams(window.location.search, window.location.hash).error;
}

function isPasswordRecoveryReturn(next?: string): boolean {
  return urlIndicatesPasswordRecovery(next) || isPasswordRecoveryPendingSync();
}

/** OAuth / email-verification return route — completes session exchange and resumes onboarding. */
export default function AuthCallback() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { loading, isOnboarded, passwordRecoveryPending, pendingClaimReveal } = useAppState();

  const initialError = useMemo(() => readInitialAuthError(), []);
  const [status, setStatus] = useState<CallbackStatus>(initialError ? 'error' : 'working');
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const [email, setEmail] = useState('');
  const [resendBusy, setResendBusy] = useState(false);
  const [resendNote, setResendNote] = useState<string | null>(null);

  useLayoutEffect(() => {
    const captured = capturePasswordRecoveryFromCurrentUrl(
      typeof next === 'string' ? next : next?.[0],
    );
    if (captured) void markPasswordRecoveryPending();
  }, [next]);

  useEffect(() => {
    if (status === 'error') return;

    let cancelled = false;

    (async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          await completeSessionFromAuthReturn(
            supabase,
            parseAuthReturnParams(window.location.search, window.location.hash),
          );
        }

        let session = await authService.getSession();
        if (!session && Platform.OS === 'web') {
          // detectSessionInUrl may finish shortly after mount.
          for (let i = 0; i < 6 && !session; i++) {
            await new Promise((r) => setTimeout(r, 250));
            session = await authService.getSession();
          }
        }

        if (!session && Platform.OS === 'web') {
          throw new AuthCallbackSessionError(
            USER_ERROR_MESSAGES['auth.verification_link_expired'],
            'expired',
          );
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(formatCaughtError(e, USER_ERROR_MESSAGES['auth.verification_link_expired'], 'auth'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status === 'error') return;

    const nextHint = typeof next === 'string' ? next : next?.[0];
    const recovery =
      passwordRecoveryPending ||
      isPasswordRecoveryPendingSync() ||
      isPasswordRecoveryReturn(nextHint);

    if (recovery) {
      router.replace('/reset-password' as Href);
      return;
    }

    if (loading) return;

    if (nextHint === 'claim') {
      if (pendingClaimReveal) {
        router.replace(
          `/(onboarding)/claim-reveal?nodeId=${encodeURIComponent(pendingClaimReveal.nodeId)}` as Href,
        );
      } else {
        router.replace('/(onboarding)/claim?autoResume=1');
      }
      return;
    }

    if (nextHint === 'onboarding') {
      router.replace(isOnboarded ? '/(tabs)' : '/(onboarding)/privacy');
      return;
    }

    router.replace(isOnboarded ? '/(tabs)' : '/welcome');
  }, [status, loading, isOnboarded, passwordRecoveryPending, pendingClaimReveal, next, router]);

  const onResend = async () => {
    if (!email.trim()) {
      setResendNote('Enter the email you signed up with.');
      return;
    }
    setResendBusy(true);
    setResendNote(null);
    try {
      const nextHint = typeof next === 'string' ? next : next?.[0];
      await authService.resendEmailConfirmation(
        email,
        nextHint === 'claim' ? { next: 'claim' } : { next: 'onboarding' },
      );
      setResendNote('A new confirmation link is on its way. Check your inbox.');
    } catch (e) {
      setResendNote(formatCaughtError(e, 'Could not resend the email. Please try again.', 'auth'));
    } finally {
      setResendBusy(false);
    }
  };

  if (status === 'error') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.ivory,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.xl,
          gap: spacing.lg,
        }}
      >
        <TomoraEmblem size={72} />
        <Display align="center" style={{ fontSize: 28 }}>
          We couldn’t complete your sign-in.
        </Display>
        <Body align="center" style={{ maxWidth: 360, color: colors.deepUmber }}>
          {errorMessage ??
            'Your link may have expired or already been used. Please request a new verification email.'}
        </Body>
        <View style={{ width: '100%', maxWidth: 360, gap: spacing.md }}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Button
            label={resendBusy ? 'Sending…' : 'Resend verification email'}
            variant="gold"
            disabled={resendBusy}
            onPress={onResend}
          />
          {resendNote ? <Caption style={{ color: colors.deepUmber }}>{resendNote}</Caption> : null}
          <Button
            label={isPasswordRecoveryReturn(next) ? 'Request new reset link' : 'Return to sign in'}
            variant="secondary"
            onPress={() =>
              router.replace((isPasswordRecoveryReturn(next) ? '/forgot-password' : '/login') as Href)
            }
          />
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.ivory,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.lg,
      }}
    >
      <TomoraEmblem size={96} />
      <ActivityIndicator color={colors.guardianGold} />
    </View>
  );
}
