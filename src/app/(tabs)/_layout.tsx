import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';

function Dot({ color, active }: { color: string; active: boolean }) {
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
    </Tabs>
  );
}
