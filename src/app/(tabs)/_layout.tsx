import { Redirect, Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import { TabIcon } from '@/components/brand/TabIcons';
import { useT } from '@/i18n';
import { useAppState } from '@/state/AppState';

export default function TabsLayout() {
  const t = useT();
  const { loading, session } = useAppState();

  if (!loading && !session) {
    return <Redirect href="/welcome" />;
  }

  return (
    <Tabs
      backBehavior="history"
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
          title: t('nav.home'),
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="family-tree"
        options={{
          title: t('nav.familyTree'),
          tabBarIcon: ({ color, focused }) => <TabIcon name="tree" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: t('nav.memories'),
          tabBarIcon: ({ color, focused }) => <TabIcon name="memories" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="occasions"
        options={{
          title: t('nav.occasions'),
          tabBarIcon: ({ color, focused }) => <TabIcon name="occasions" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="companion"
        options={{
          title: t('nav.companion'),
          tabBarIcon: ({ color, focused }) => <TabIcon name="companion" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.you'),
          tabBarIcon: ({ color, focused }) => <TabIcon name="you" color={color} focused={focused} />,
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
      <Tabs.Screen name="settings/public-profile" options={{ href: null }} />
      <Tabs.Screen name="settings/billing" options={{ href: null }} />
      <Tabs.Screen name="settings/delete" options={{ href: null }} />
      <Tabs.Screen name="occasion/[occasionId]" options={{ href: null }} />
    </Tabs>
  );
}
