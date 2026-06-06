import { Tabs } from 'expo-router';
import { Platform, View, type ColorValue } from 'react-native';
import { colors, fonts } from '@/constants/theme';

function Dot({ color, active }: { color: ColorValue; active: boolean }) {
  return (
    <View
      style={{
        width: active ? 8 : 6,
        height: active ? 8 : 6,
        borderRadius: 999,
        backgroundColor: color,
        opacity: active ? 1 : 0.6,
      }}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.guardianGold,
        tabBarInactiveTintColor: colors.ashTaupe,
        sceneStyle: { backgroundColor: colors.ivory },
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.hairline,
          borderTopWidth: 1,
          height: Platform.OS === 'web' ? 64 : undefined,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <Dot color={color} active={focused} />,
        }}
      />
      <Tabs.Screen
        name="family-tree"
        options={{
          title: 'Family Tree',
          tabBarIcon: ({ color, focused }) => <Dot color={color} active={focused} />,
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: 'Memories',
          tabBarIcon: ({ color, focused }) => <Dot color={color} active={focused} />,
        }}
      />
      <Tabs.Screen
        name="occasions"
        options={{
          title: 'Occasions',
          tabBarIcon: ({ color, focused }) => <Dot color={color} active={focused} />,
        }}
      />
      <Tabs.Screen
        name="companion"
        options={{
          title: 'Companion',
          tabBarIcon: ({ color, focused }) => <Dot color={color} active={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'You',
          tabBarIcon: ({ color, focused }) => <Dot color={color} active={focused} />,
        }}
      />

      {/* Detail routes — kept inside the tab navigator so the bottom tab bar
          stays visible, but hidden from the tab bar itself via href: null. */}
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="node/[nodeId]" options={{ href: null }} />
      <Tabs.Screen name="node/edit" options={{ href: null }} />
      <Tabs.Screen name="node/history" options={{ href: null }} />
      <Tabs.Screen name="node/invite" options={{ href: null }} />
      <Tabs.Screen name="memory/new" options={{ href: null }} />
      <Tabs.Screen name="memory/[memoryId]" options={{ href: null }} />
      <Tabs.Screen name="memorial/[nodeId]" options={{ href: null }} />
      <Tabs.Screen name="memorial/edit" options={{ href: null }} />
      <Tabs.Screen name="relative/new" options={{ href: null }} />
      <Tabs.Screen name="settings/account" options={{ href: null }} />
      <Tabs.Screen name="settings/billing" options={{ href: null }} />
      <Tabs.Screen name="settings/delete" options={{ href: null }} />
    </Tabs>
  );
}
