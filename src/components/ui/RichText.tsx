import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colors, fonts, radii, spacing } from '@/constants/theme';

/**
 * Lightweight rich text. We store a small Markdown subset (**bold**, *italic*,
 * "# heading", and "- bullet" lines) so formatting is portable and renders the
 * same everywhere. `RichTextEditor` writes it; `RichTextView` renders it.
 */

interface InlineSeg {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

function parseInline(text: string): InlineSeg[] {
  const segs: InlineSeg[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) segs.push({ text: text.slice(last, m.index) });
    if (m[2] !== undefined) segs.push({ text: m[2], bold: true });
    else if (m[3] !== undefined) segs.push({ text: m[3], italic: true });
    else if (m[4] !== undefined) segs.push({ text: m[4], italic: true });
    last = re.lastIndex;
  }
  if (last < text.length) segs.push({ text: text.slice(last) });
  return segs.length ? segs : [{ text }];
}

export function RichTextView({ value, color = colors.charcoal }: { value: string; color?: string }) {
  const lines = value.split('\n');
  return (
    <View style={{ gap: 4 }}>
      {lines.map((line, idx) => {
        if (!line.trim()) return <View key={idx} style={{ height: 6 }} />;
        if (line.startsWith('# ')) {
          return (
            <Text key={idx} style={{ fontFamily: fonts.display, fontSize: 20, color, fontWeight: '700' }}>
              {renderSegs(parseInline(line.slice(2)), color)}
            </Text>
          );
        }
        const bullet = /^[-*]\s+/.test(line);
        const content = bullet ? line.replace(/^[-*]\s+/, '') : line;
        return (
          <View key={idx} style={{ flexDirection: 'row' }}>
            {bullet ? <Text style={{ fontFamily: fonts.body, fontSize: 16, color }}>•  </Text> : null}
            <Text style={{ fontFamily: fonts.body, fontSize: 16, color, flex: 1, lineHeight: 23 }}>
              {renderSegs(parseInline(content), color)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function renderSegs(segs: InlineSeg[], color: string) {
  return segs.map((s, i) => (
    <Text
      key={i}
      style={{
        color,
        fontWeight: s.bold ? '700' : '400',
        fontStyle: s.italic ? 'italic' : 'normal',
      }}
    >
      {s.text}
    </Text>
  ));
}

function ToolbarButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        minWidth: 38,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radii.md,
        borderWidth: 1.5,
        borderColor: colors.mistBeige,
        backgroundColor: colors.white,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.deepUmber, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  autoFocus = false,
}: {
  label?: string;
  value: string;
  onChange: (t: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [sel, setSel] = useState({ start: 0, end: 0 });

  const wrap = (marker: string) => {
    const start = Math.min(sel.start, sel.end);
    const end = Math.max(sel.start, sel.end);
    const selected = value.slice(start, end) || 'text';
    onChange(value.slice(0, start) + marker + selected + marker + value.slice(end));
  };

  const prefixLine = (prefix: string) => {
    const caret = Math.min(sel.start, sel.end);
    const lineStart = value.lastIndexOf('\n', caret - 1) + 1;
    onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart));
  };

  return (
    <View style={{ gap: spacing.sm }}>
      {label ? (
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.deepUmber, letterSpacing: 0.3 }}>
          {label}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <ToolbarButton label="B" onPress={() => wrap('**')} />
        <ToolbarButton label="i" onPress={() => wrap('*')} />
        <ToolbarButton label="H" onPress={() => prefixLine('# ')} />
        <ToolbarButton label="•" onPress={() => prefixLine('- ')} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        onSelectionChange={(e) => setSel(e.nativeEvent.selection)}
        placeholder={placeholder}
        placeholderTextColor={colors.ashTaupe}
        multiline
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={
          {
            fontFamily: fonts.body,
            fontSize: 17,
            color: colors.ink,
            backgroundColor: colors.white,
            borderRadius: radii.md,
            borderWidth: 1.5,
            borderColor: focused ? colors.softGold : colors.mistBeige,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            minHeight: 140,
            textAlignVertical: 'top',
            outlineStyle: 'none',
          } as any
        }
      />
      <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ashTaupe }}>
        Tip: **bold**, *italic*, “# ” for a heading, “- ” for a bullet.
      </Text>
    </View>
  );
}
