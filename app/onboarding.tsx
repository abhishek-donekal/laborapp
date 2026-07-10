import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components';
import { useApp } from '../src/store';
import { colors, font, radius, spacing } from '../src/theme';
import { Role } from '../src/types';

export default function Onboarding() {
  const { pendingName, needsRole, user, chooseRole } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<Role>('worker');
  const [busy, setBusy] = useState(false);

  // Bounce out if we shouldn't be here.
  useEffect(() => {
    if (user) router.replace('/(tabs)');
    else if (!needsRole) router.replace('/login');
  }, [user, needsRole]);

  async function onContinue() {
    setBusy(true);
    try {
      await chooseRole(role);
      // Redirect happens once the profile snapshot updates `user`.
    } finally {
      setBusy(false);
    }
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.xxl },
      ]}
    >
      <Text style={styles.hi}>
        {pendingName ? `Hi ${pendingName.split(' ')[0]} 👋` : 'Welcome 👋'}
      </Text>
      <Text style={styles.title}>How will you use laborapp?</Text>
      <Text style={styles.sub}>You can't change this later in the demo.</Text>

      <View style={styles.cards}>
        <RoleCard
          active={role === 'worker'}
          emoji="👷"
          title="Find work"
          sub="Browse jobs and apply to gigs near you."
          onPress={() => setRole('worker')}
        />
        <RoleCard
          active={role === 'employer'}
          emoji="📋"
          title="Hire help"
          sub="Post jobs and choose from applicants."
          onPress={() => setRole('employer')}
        />
      </View>

      <Button
        label="Continue"
        onPress={onContinue}
        loading={busy}
        style={{ marginTop: spacing.xl }}
      />
    </View>
  );
}

function RoleCard({
  active,
  emoji,
  title,
  sub,
  onPress,
}: {
  active: boolean;
  emoji: string;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, active && styles.cardActive]}
    >
      <Text style={styles.cardEmoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, active && { color: colors.primaryDark }]}>
          {title}
        </Text>
        <Text style={styles.cardSub}>{sub}</Text>
      </View>
      <View style={[styles.radio, active && styles.radioActive]}>
        {active ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
  },
  hi: { fontSize: font.h3, color: colors.muted, fontWeight: '600' },
  title: {
    fontSize: font.h1,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
  },
  sub: { fontSize: font.body, color: colors.muted, marginTop: spacing.xs },
  cards: { gap: spacing.md, marginTop: spacing.xl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  cardActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  cardEmoji: { fontSize: 32 },
  cardTitle: { fontSize: font.h3, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: font.small, color: colors.muted, marginTop: 2 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
