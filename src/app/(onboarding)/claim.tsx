import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { GoldStar } from '@/components/brand/GoldStar';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';
import { useAppState } from '@/state/AppState';

type Method = 'code' | 'password' | 'qr';

const METHODS: { id: Method; title: string; subtitle: string }[] = [
  { id: 'code', ...copy.claim.methods.code },
  { id: 'password', ...copy.claim.methods.password },
  { id: 'qr', ...copy.claim.methods.qr },
];

export default function Claim() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const { session, claimNode } = useAppState();
  const [method, setMethod] = useState<Method>('code');
  const [code, setCode] = useState(params.code ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit =
    method === 'qr' ? false : method === 'code' ? code.trim().length > 0 : code.trim().length > 0 && password.length > 0;

  const onClaim = async () => {
    if (!session) {
      setNote('Create your account or sign in first, then come back to claim — your code is saved here.');
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      await claimNode(code, method === 'password' ? password : undefined);
      router.replace('/(tabs)');
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'We couldn’t complete the claim. Please try again.');
      setBusy(false);
    }
  };

  return (
    <ScreenContainer
      showBack
      footer={
        <View style={{ gap: spacing.md }}>
          <Button label={busy ? 'Claiming…' : copy.claim.cta} variant="gold" disabled={!canSubmit || busy} onPress={onClaim} />
          <Button label={copy.welcome.login} variant="ghost" onPress={() => router.push('/login')} />
        </View>
      }
    >
      <View style={{ gap: spacing.lg }}>
        <View style={{ alignItems: 'flex-start', gap: spacing.sm }}>
          <GoldStar size={22} />
          <Display style={{ fontSize: 34 }}>{copy.claim.prompt}</Display>
          <Body style={{ fontSize: 18 }}>{copy.claim.body}</Body>
        </View>

        <View style={{ gap: spacing.sm }}>
          {METHODS.map((m) => {
            const active = method === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => {
                  setMethod(m.id);
                  setNote(null);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  borderWidth: 1.5,
                  borderColor: active ? colors.guardianGold : colors.mistBeige,
                  backgroundColor: active ? 'rgba(184,135,47,0.10)' : colors.white,
                  borderRadius: radii.md,
                  padding: spacing.md,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: active ? colors.guardianGold : colors.ashTaupe,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {active ? (
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.guardianGold }} />
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: '600', color: colors.ink }}>
                    {m.title}
                  </Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.deepUmber }}>{m.subtitle}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {method === 'code' ? (
          <TextField
            label={copy.claim.codeLabel}
            value={code}
            onChangeText={setCode}
            placeholder={copy.claim.codePlaceholder}
            autoCapitalize="characters"
          />
        ) : null}

        {method === 'password' ? (
          <View style={{ gap: spacing.md }}>
            <TextField
              label={copy.claim.codeLabel}
              value={code}
              onChangeText={setCode}
              placeholder={copy.claim.codePlaceholder}
              autoCapitalize="characters"
            />
            <View style={{ gap: spacing.xs }}>
              <TextField
                label={copy.claim.passwordLabel}
                value={password}
                onChangeText={setPassword}
                placeholder={copy.claim.passwordPlaceholder}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Button
                label={showPassword ? 'Hide password' : 'Show password'}
                variant="ghost"
                fullWidth={false}
                onPress={() => setShowPassword((s) => !s)}
              />
            </View>
          </View>
        ) : null}

        {method === 'qr' ? (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              borderWidth: 1.5,
              borderColor: colors.mistBeige,
              borderStyle: 'dashed',
              borderRadius: radii.lg,
              paddingVertical: spacing.xl,
              backgroundColor: colors.paper,
            }}
          >
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: radii.md,
                backgroundColor: colors.candlelight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GoldStar size={40} />
            </View>
            <Title style={{ fontSize: 20 }}>Scan QR — soon</Title>
            <Caption align="center" style={{ maxWidth: 280 }}>
              QR scanning arrives with the mobile app. For now, use your invite code or node password.
            </Caption>
          </View>
        ) : null}

        {note ? <Caption style={{ color: colors.deepUmber, fontSize: 14 }}>{note}</Caption> : null}
      </View>
    </ScreenContainer>
  );
}
