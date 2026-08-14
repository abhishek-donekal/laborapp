import { Redirect, Tabs } from 'expo-router';
import { ColorValue, Text } from 'react-native';
import { useApp } from '../../src/store';
import { colors } from '../../src/theme';

function TabIcon({ emoji, color }: { emoji: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const { user, needsRole, isGuest } = useApp();

  // Guests get the job feed and a profile tab that invites them to join.
  if (!user && !isGuest) {
    return <Redirect href={needsRole ? '/onboarding' : '/login'} />;
  }

  const isEmployer = user?.role === 'employer';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { fontWeight: '800', fontSize: 20 },
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isEmployer ? 'My Jobs' : 'Find Work',
          tabBarLabel: isEmployer ? 'My Jobs' : 'Jobs',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji={isEmployer ? '📋' : '🔍'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post a Job',
          tabBarLabel: 'Post',
          href: isEmployer ? '/(tabs)/post' : null,
          tabBarIcon: ({ color }) => <TabIcon emoji="➕" color={color} />,
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'My Applications',
          tabBarLabel: 'Applied',
          href: user && !isEmployer ? '/(tabs)/applications' : null,
          tabBarIcon: ({ color }) => <TabIcon emoji="📨" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: user ? 'Profile' : 'Join HireMe',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} />,
        }}
      />
    </Tabs>
  );
}
