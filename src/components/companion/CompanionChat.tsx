import { useCallback, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Body, Caption } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { companionReply, companionWelcome, type CompanionMessage } from '@/lib/companion/respond';
import { useAppState } from '@/state/AppState';

function Bubble({ role, text }: CompanionMessage) {
  const isUser = role === 'user';
  return (
    <View
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '88%',
        backgroundColor: isUser ? colors.guardianGold : colors.paper,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: isUser ? 0 : 1,
        borderColor: colors.mistBeige,
      }}
    >
      <Body style={{ color: isUser ? colors.ivory : colors.charcoal, fontSize: 15, lineHeight: 22 }}>{text}</Body>
    </View>
  );
}

export function CompanionChat() {
  const { nodes, relationships, visibleMemories, account } = useAppState();
  const viewerNodeId = nodes.find((n) => n.ownerAccountId === account?.id)?.id;

  const context = useMemo(
    () => ({ viewerNodeId, nodes, relationships, memories: visibleMemories }),
    [viewerNodeId, nodes, relationships, visibleMemories],
  );

  const [messages, setMessages] = useState<CompanionMessage[]>(() => [
    { role: 'companion', text: companionWelcome(context) },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const suggestions = useMemo(() => {
    const sample = nodes.find((n) => n.id !== viewerNodeId);
    const list = ['What birthdays are coming up?', 'Help'];
    if (sample) list.unshift(`How is ${sample.displayName} related to me?`);
    return list;
  }, [nodes, viewerNodeId]);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const reply = companionReply(trimmed, context);
      setMessages((prev) => [
        ...prev,
        { role: 'user', text: trimmed },
        { role: 'companion', text: reply },
      ]);
      setInput('');
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    },
    [context],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, width: '100%' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((m, i) => (
          <Bubble key={`${m.role}-${i}`} {...m} />
        ))}
      </ScrollView>

      <View style={{ gap: spacing.sm, paddingTop: spacing.sm }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
          {suggestions.map((s) => (
            <Pressable
              key={s}
              onPress={() => send(s)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: radii.pill,
                backgroundColor: colors.candlelight,
                borderWidth: 1,
                borderColor: colors.softGold,
              }}
            >
              <Caption style={{ color: colors.deepUmber, fontWeight: '600' }}>{s}</Caption>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <TextField
              label="Ask the Companion"
              value={input}
              onChangeText={setInput}
              placeholder="How is someone related? Search memories…"
              onSubmitEditing={() => send(input)}
            />
          </View>
          <Button label="Send" variant="gold" fullWidth={false} onPress={() => send(input)} disabled={!input.trim()} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
