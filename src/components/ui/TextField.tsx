import { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, radii, spacing } from '@/constants/theme';

/** Gentle text input with a soft gold focus state. */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  autoFocus = false,
  ...rest
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoFocus?: boolean;
} & TextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: spacing.sm }}>
      {label ? (
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            color: colors.deepUmber,
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ashTaupe}
        multiline={multiline}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={
          {
            fontFamily: fonts.body,
            fontSize: 18,
            color: colors.ink,
            backgroundColor: colors.white,
            borderRadius: radii.md,
            borderWidth: 1.5,
            borderColor: focused ? colors.softGold : colors.mistBeige,
            paddingHorizontal: spacing.md,
            paddingVertical: multiline ? spacing.md : 14,
            minHeight: multiline ? 120 : 54,
            textAlignVertical: multiline ? 'top' : 'center',
            // web-only outline reset
            outlineStyle: 'none',
          } as any
        }
        {...rest}
      />
    </View>
  );
}
