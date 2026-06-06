import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { TomoraEmblem } from '@/components/brand/TomoraEmblem';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';
import * as authService from '@/services/authService';
import { supabase } from '@/lib/supabase';
import {
  capturePasswordRecoveryFromCurrentUrl,
  isPasswordRecoveryPendingSync,
  markPasswordRecoveryPending,
  urlIndicatesPasswordRecovery,
} from '@/lib/passwordRecovery';
import { useAppState } from '@/state/AppState';

type CallbackStatus = 'working' | 'error';

function readUrlAuthParams(): URLSearchParams | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const hash = window.location.hash?.replace(/^#/, '') ?? '';
  const search = window.location.search?.replace(/^\?/, '') ?? '';
  if (!hash && !search) return null;
  return new URLSearchParams(hash || search);
}

function readAuthErrorFromUrl(): string | null {
  const params = readUrlAuthParams();
  if (!params) return null;
  const description = params.get('error_description') ?? params.get('error');
  if (!description) return null;
  return description.replace(/\+/g, ' ');
}

function isPasswordRecoveryReturn(next?: string): boolean {
  return urlIndicatesPasswordRecovery(next) || isPasswordRecoveryPendingSync();
}

/** OAuth / email-verification return route — completes session exchange and resumes onboarding. */
export default function AuthCallback() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { loading, isOnboarded, passwordRecoveryPending } = useAppState();

  const initialError = useMemo(() => readAuthErrorFromUrl(), []);
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
          const params = new URLSearchParams(window.location.search);
          const code = params.get('code');
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;
          }
        }

        const session = await authService.getSession();
        if (!session && Platform.OS === 'web') {
          // detectSessionInUrl may still be processing hash tokens — brief wait.
          await new Promise((r) => setTimeout(r, 400));
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(
            e instanceof Error
              ? e.message
              : 'We couldn’t complete your sign-in. Your link may have expired or already been used.',
          );
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
      router.replace('/(onboarding)/claim');
      return;
    }

    if (nextHint === 'onboarding') {
      router.replace(isOnboarded ? '/(tabs)' : '/(onboarding)/privacy');
      return;
    }

    router.replace(isOnboarded ? '/(tabs)' : '/welcome');
  }, [status, loading, isOnboarded, passwordRecoveryPending, next, router]);

  const onResend = async () => {
    if (!email.trim()) {
      setResendNote('Enter the email you signed up with.');
      return;
    }
    setResendBusy(true);
    setResendNote(null);
    try {
      await authService.resendEmailConfirmation(email, next === 'claim' ? { next: 'claim' } : undefined);
      setResendNote('A new confirmation link is on its way. Check your inbox.');
    } catch (e) {
      setResendNote(e instanceof Error ? e.message : 'Could not resend the email. Please try again.');
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
