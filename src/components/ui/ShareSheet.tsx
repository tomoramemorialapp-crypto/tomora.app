import { useState } from 'react';
import { Linking, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SocialIcon, type SocialNetwork } from '@/components/brand/SocialIcon';
import { colors, fonts, radii, shadows, spacing } from '@/constants/theme';
import { Title, Caption } from '@/components/ui/Typography';

type Target = {
  id: string;
  label: string;
  icon: SocialNetwork;
  /** Build a share url. If omitted, the target only copies the link. */
  url?: (link: string, message: string) => string;
  tint: string;
};

const enc = encodeURIComponent;

const TARGETS: Target[] = [
  { id: 'sms', label: 'Messages', icon: 'sms', tint: '#34C759', url: (l, m) => `sms:?&body=${enc(`${m} ${l}`)}` },
  {
    id: 'email',
    label: 'Email',
    icon: 'email',
    tint: '#8E8E93',
    url: (l, m) => `mailto:?subject=${enc('Join our Family Tree on Tomora')}&body=${enc(`${m}\n\n${l}`)}`,
  },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp', tint: '#25D366', url: (l, m) => `https://wa.me/?text=${enc(`${m} ${l}`)}` },
  {
    id: 'messenger',
    label: 'Messenger',
    icon: 'messenger',
    tint: '#0084FF',
    url: (l) => `https://www.facebook.com/dialog/send?link=${enc(l)}&app_id=0&redirect_uri=${enc(l)}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    icon: 'telegram',
    tint: '#229ED9',
    url: (l, m) => `https://t.me/share/url?url=${enc(l)}&text=${enc(m)}`,
  },
  { id: 'viber', label: 'Viber', icon: 'viber', tint: '#7360F2', url: (l, m) => `viber://forward?text=${enc(`${m} ${l}`)}` },
  { id: 'instagram', label: 'Instagram', icon: 'instagram', tint: '#E1306C' },
  {
    id: 'x',
    label: 'X',
    icon: 'x',
    tint: '#111111',
    url: (l, m) => `https://twitter.com/intent/tweet?text=${enc(m)}&url=${enc(l)}`,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: 'linkedin',
    tint: '#0A66C2',
    url: (l) => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(l)}`,
  },
];

async function openUrl(url: string) {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (url.startsWith('http')) window.open(url, '_blank', 'noopener,noreferrer');
      else window.location.href = url;
      return;
    }
    await Linking.openURL(url);
  } catch {
    // target app may be unavailable; ignore quietly
  }
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/** A pop-up share sheet: messaging platforms + a copy-link row. */
export function ShareSheet({
  visible,
  onClose,
  link,
  title,
  message,
}: {
  visible: boolean;
  onClose: () => void;
  link: string;
  title: string;
  message: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(link);
    setCopied(ok || true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleTarget = async (target: Target) => {
    if (target.id === 'instagram') {
      await copyToClipboard(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      await openUrl('https://www.instagram.com/');
      return;
    }
    if (target.url) await openUrl(target.url(link, message));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}
      >
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
            <Title style={{ marginTop: spacing.sm }}>{title}</Title>
          </View>

          <ScrollView
            horizontal={false}
            contentContainerStyle={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: spacing.md,
            }}
            showsVerticalScrollIndicator={false}
          >
            {TARGETS.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => handleTarget(t)}
                accessibilityRole="button"
                accessibilityLabel={`Share via ${t.label}`}
                style={({ pressed }) => ({ alignItems: 'center', gap: 6, width: 76, opacity: pressed ? 0.8 : 1 })}
              >
                <View
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    backgroundColor: t.tint,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SocialIcon network={t.icon} size={26} color={colors.white} />
                </View>
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ink }} numberOfLines={1}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={{ gap: spacing.xs }}>
            <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.2, color: colors.deepUmber }}>
              Invite link
            </Caption>
            <Pressable
              onPress={handleCopy}
              accessibilityRole="button"
              accessibilityLabel="Copy invite link"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                borderWidth: 1.5,
                borderColor: colors.mistBeige,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md,
                backgroundColor: colors.white,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ink }} numberOfLines={1}>
                {link}
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: '700', color: colors.guardianGold }}>
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={onClose} accessibilityRole="button" style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: '600', color: colors.deepUmber }}>
              Done
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
