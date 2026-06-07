import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { GoldStar } from '@/components/brand/GoldStar';
import { QrClaimScanner } from '@/components/claim/QrClaimScanner';
import { ClaimAuthModal } from '@/components/claim/ClaimAuthModal';
import { ClaimConfirmModal } from '@/components/claim/ClaimConfirmModal';
import { ClaimInvitePreview } from '@/components/claim/ClaimInvitePreview';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';
import { parseClaimCode } from '@/lib/claim';
import { previewInvite, type InvitePreview } from '@/services/inviteService';
import { useAppState } from '@/state/AppState';

type Method = 'code' | 'password' | 'qr';

const METHODS: { id: Method; title: string; subtitle: string }[] = [
  { id: 'code', ...copy.claim.methods.code },
  { id: 'password', ...copy.claim.methods.password },
  { id: 'qr', ...copy.claim.methods.qr },
];

export default function Claim() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; autoResume?: string; method?: string }>();
  const { session, claimNode, setDraft, pendingClaimReveal } = useAppState();
  const initialMethod =
    params.method === 'qr' ? 'qr' : params.method === 'password' ? 'password' : params.code ? 'code' : 'qr';
  const [method, setMethod] = useState<Method>(initialMethod);
  const [code, setCode] = useState(params.code ? parseClaimCode(String(params.code)) ?? String(params.code) : '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (params.code) {
      const parsed = parseClaimCode(String(params.code));
      if (parsed) setCode(parsed);
    }
  }, [params.code]);

  const normalizedCode = code.trim().toUpperCase();

  useEffect(() => {
    if (normalizedCode.length < 4) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    const timer = setTimeout(() => {
      void previewInvite(normalizedCode).then((p) => {
        if (!cancelled) {
          setPreview(p);
          setPreviewLoading(false);
        }
      });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalizedCode]);

  const needsPassword = preview?.requiresPassword || method === 'password';
  const canSubmit =
    normalizedCode.length > 0 && (!needsPassword || password.length > 0) && !busy;

  const goToReveal = useCallback(
    (nodeId: string) => {
      router.replace(`/(onboarding)/claim-reveal?nodeId=${encodeURIComponent(nodeId)}` as Href);
    },
    [router],
  );

  const finishClaim = useCallback(async () => {
    if (!session) return;
    setBusy(true);
    setNote(null);
    try {
      const claimPassword = needsPassword ? password : undefined;
      const result = await claimNode(normalizedCode, claimPassword);
      goToReveal(result.nodeId);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "We couldn't complete the claim. Please try again.");
      setBusy(false);
    }
  }, [claimNode, goToReveal, needsPassword, normalizedCode, password, session]);

  useEffect(() => {
    if (params.autoResume !== '1' || !session || busy || pendingClaimReveal) return;
    if (!normalizedCode) return;
    void finishClaim();
  }, [params.autoResume, session, finishClaim, normalizedCode, busy, pendingClaimReveal]);

  useEffect(() => {
    if (pendingClaimReveal && session) {
      goToReveal(pendingClaimReveal.nodeId);
    }
  }, [pendingClaimReveal, session, goToReveal]);

  const onClaim = async () => {
    if (!canSubmit) return;

    const claimPassword = needsPassword ? password : undefined;
    setDraft({
      pendingClaimCode: normalizedCode,
      pendingClaimPassword: claimPassword,
    });

    if (!session) {
      setAuthOpen(true);
      return;
    }

    if (preview?.valid) {
      setConfirmOpen(true);
      return;
    }

    await finishClaim();
  };

  const onPasteLink = (value: string) => {
    const parsed = parseClaimCode(value);
    if (parsed) {
      setCode(parsed);
      setNote(null);
      return;
    }
    const raw = value.trim();
    if (/^[A-Za-z0-9]{4,32}$/.test(raw)) {
      setCode(raw.toUpperCase());
      setNote(null);
      return;
    }
    setNote('Paste a Tomora invite link or invite code — public profile links cannot be used here.');
  };

  return (
    <>
      <ClaimAuthModal
        visible={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthed={() => {
          setAuthOpen(false);
          if (preview?.valid) setConfirmOpen(true);
        }}
      />
      {preview?.valid ? (
        <ClaimConfirmModal
          visible={confirmOpen}
          preview={preview}
          busy={busy}
          onConfirm={async () => {
            setConfirmOpen(false);
            await finishClaim();
          }}
          onNotMe={() => {
            setConfirmOpen(false);
            setNote('If this invite is not for you, ask the person who sent it for the right link.');
          }}
          onHelp={() => void Linking.openURL('mailto:support@tomora.app')}
          onClose={() => setConfirmOpen(false)}
        />
      ) : null}
      <ScreenContainer
        showBack
        footer={
          <View style={{ gap: spacing.md }}>
            <Button
              label={busy ? 'Claiming…' : copy.claim.cta}
              variant="gold"
              disabled={!canSubmit || busy}
              onPress={onClaim}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.lg }}>
              <Pressable onPress={() => setNote('If this invite is not for you, ask the person who sent it for the right link.')}>
                <Caption style={{ color: colors.guardianGold, fontWeight: '600' }}>{copy.claim.notMe}</Caption>
              </Pressable>
              <Pressable onPress={() => void Linking.openURL('mailto:support@tomora.app')}>
                <Caption style={{ color: colors.ashTaupe }}>{copy.claim.needHelp}</Caption>
              </Pressable>
            </View>
          </View>
        }
      >
        <View style={{ gap: spacing.lg }}>
          <View style={{ alignItems: 'flex-start', gap: spacing.sm }}>
            <GoldStar size={22} />
            <Display style={{ fontSize: 34 }}>{copy.claim.prompt}</Display>
            <Body style={{ fontSize: 18 }}>{copy.claim.body}</Body>
          </View>

          <ClaimInvitePreview preview={preview} loading={previewLoading} code={normalizedCode} />

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
              onChangeText={(v) => setCode(v.toUpperCase())}
              placeholder={copy.claim.codePlaceholder}
              autoCapitalize="characters"
            />
          ) : null}

          {method === 'password' || preview?.requiresPassword ? (
            <View style={{ gap: spacing.md }}>
              {method === 'password' ? (
                <TextField
                  label={copy.claim.codeLabel}
                  value={code}
                  onChangeText={(v) => setCode(v.toUpperCase())}
                  placeholder={copy.claim.codePlaceholder}
                  autoCapitalize="characters"
                />
              ) : null}
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
            <View style={{ gap: spacing.md }}>
              <QrClaimScanner onCode={(c) => setCode(c)} />
              <TextField
                label="Paste invite link or code"
                value={code}
                onChangeText={onPasteLink}
                placeholder="https://tomora.app/claim?code=…"
                autoCapitalize="none"
              />
            </View>
          ) : null}

          {note ? <Caption style={{ color: colors.deepUmber, fontSize: 14 }}>{note}</Caption> : null}
        </View>
      </ScreenContainer>
    </>
  );
}
