import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import type { PlaceReference } from '@/types/profile';
import {
  hasCoordinates,
  osmEmbedUrl,
  osmLink,
  plainTextPlace,
  resultToPlace,
  searchPlaces,
  type GeocodeResult,
} from '@/lib/geocoding';

type Mode = 'precise' | 'text';

function initialMode(value?: PlaceReference): Mode {
  if (hasCoordinates(value)) return 'precise';
  if (value?.displayName) return 'text';
  return 'precise';
}

/** Interactive OpenStreetMap preview (web only; keyless). */
function MapPreview({ lat, lon }: { lat: number; lon: number }) {
  if (Platform.OS !== 'web') return null;
  return React.createElement('iframe', {
    src: osmEmbedUrl(lat, lon),
    title: 'Location map',
    loading: 'lazy',
    style: { width: '100%', height: 200, border: 0, borderRadius: 12, display: 'block' },
  });
}

async function openExternal(url: string) {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    await Linking.openURL(url);
  } catch {
    // ignore
  }
}

const inputStyle = {
  fontFamily: fonts.body,
  fontSize: 18,
  color: colors.ink,
  backgroundColor: colors.white,
  borderRadius: radii.md,
  borderWidth: 1.5,
  borderColor: colors.mistBeige,
  paddingHorizontal: spacing.md,
  paddingVertical: 14,
  outlineStyle: 'none',
} as const;

/**
 * A location field that can either pin a precise place from a maps provider
 * (with an interactive preview + structured city/region/country + coordinates)
 * or accept plain text. Whatever is chosen, its visibility is governed by the
 * field's own privacy selector, so precise pins can stay private while a general
 * area is shared.
 */
export function PlaceField({
  label,
  value,
  onChange,
  placeholder = 'Search for a place',
}: {
  label?: string;
  value?: PlaceReference;
  onChange: (next: PlaceReference | undefined) => void;
  placeholder?: string;
}) {
  const [mode, setMode] = useState<Mode>(() => initialMode(value));
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const selected = hasCoordinates(value) ? value : undefined;

  // Debounced map search while typing in precise mode (no pin selected yet).
  useEffect(() => {
    if (mode !== 'precise' || selected) {
      setResults([]);
      return;
    }
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const found = await searchPlaces(q, controller.signal);
      if (!controller.signal.aborted) {
        setResults(found);
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [query, mode, selected]);

  const choose = (r: GeocodeResult) => {
    onChange(resultToPlace(r));
    setQuery('');
    setResults([]);
  };

  const clearSelection = () => {
    onChange(undefined);
    setQuery('');
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setResults([]);
    if (next === 'text') {
      // Keep any human label; drop coordinates so it's plainly text.
      onChange(value?.displayName ? plainTextPlace(value.displayName) : undefined);
    }
  };

  return (
    <View style={{ gap: spacing.sm }}>
      {label ? (
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.deepUmber, letterSpacing: 0.3 }}>{label}</Text>
      ) : null}

      {/* Mode switch */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <ModeChip label="Search a map" active={mode === 'precise'} onPress={() => switchMode('precise')} />
        <ModeChip label="Plain text" active={mode === 'text'} onPress={() => switchMode('text')} />
      </View>

      {mode === 'text' ? (
        <TextInput
          value={value?.displayName ?? ''}
          onChangeText={(t) => onChange(t.trim() ? plainTextPlace(t) : undefined)}
          placeholder="City, Country"
          placeholderTextColor={colors.ashTaupe}
          style={inputStyle as any}
        />
      ) : selected ? (
        <View style={{ gap: spacing.sm }}>
          <View
            style={{
              borderWidth: 1.5,
              borderColor: colors.softGold,
              borderRadius: radii.md,
              overflow: 'hidden',
              backgroundColor: colors.white,
            }}
          >
            <MapPreview lat={selected.latitude as number} lon={selected.longitude as number} />
            <View style={{ padding: spacing.md, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.guardianGold, fontWeight: '700' }}>
                  ◆ PRECISE LOCATION
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.body, fontSize: 16, color: colors.ink }}>{selected.displayName}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: 4 }}>
                <Pressable onPress={() => openExternal(osmLink(selected.latitude as number, selected.longitude as number))} hitSlop={6}>
                  <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.guardianGold, fontWeight: '600' }}>
                    Open in maps ›
                  </Text>
                </Pressable>
                <Pressable onPress={clearSelection} hitSlop={6}>
                  <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.deepUmber }}>Change</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <View style={{ position: 'relative' }}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={placeholder}
              placeholderTextColor={colors.ashTaupe}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={[inputStyle, focused ? { borderColor: colors.softGold } : null] as any}
            />
            {loading ? (
              <View style={{ position: 'absolute', right: spacing.md, top: 16 }}>
                <ActivityIndicator color={colors.guardianGold} size="small" />
              </View>
            ) : null}
          </View>

          {results.length > 0 ? (
            <View
              style={{
                borderWidth: 1.5,
                borderColor: colors.mistBeige,
                borderRadius: radii.md,
                backgroundColor: colors.white,
                overflow: 'hidden',
              }}
            >
              {results.map((r, i) => (
                <Pressable
                  key={r.id}
                  onPress={() => choose(r)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: 12,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: colors.mistBeige,
                  }}
                >
                  <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.ink }}>{r.label}</Text>
                  <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ashTaupe }}>
                    {r.fullName}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {query.trim().length > 0 && query.trim().length < 3 ? (
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ashTaupe }}>Keep typing to search…</Text>
          ) : null}
          {query.trim().length >= 3 && !loading && results.length === 0 ? (
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ashTaupe }}>
              No matches. Try “Plain text” to enter it freely.
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

function ModeChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: active ? 'rgba(184,135,47,0.14)' : colors.white,
        borderColor: active ? colors.guardianGold : colors.mistBeige,
        borderWidth: 1.5,
        borderRadius: radii.pill,
        paddingHorizontal: 14,
        paddingVertical: 7,
      }}
    >
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: active ? colors.guardianGold : colors.charcoal }}>
        {label}
      </Text>
    </Pressable>
  );
}
