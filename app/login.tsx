import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Field } from '../src/components';
import { useApp } from '../src/store';
import { colors, font, radius, spacing } from '../src/theme';
import { Role } from '../src/types';

export default function Login() {
  const { login } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('worker');

  const canSubmit = name.trim().length >= 2;

  function onSubmit() {
    if (!canSubmit) return;
    login(name, role);
    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <View style={styles.logo}>
            <Text style={styles.logoMark}>🛠️</Text>
          </View>
          <Text style={styles.title}>laborapp</Text>
          <Text style={styles.subtitle}>
            Hire day laborers, or find work today.
          </Text>
        </View>

        <View style={{ gap: spacing.lg, marginTop: spacing.xxl }}>
          <Field
            label="Your name"
            placeholder="e.g. Alex Johnson"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="done"
          />

          <View style={{ gap: spacing.sm }}>
            <Text style={styles.roleLabel}>I want to…</Text>
            <View style={styles.roleRow}>
              <RoleOption
                active={role === 'worker'}
                emoji="👷"
                title="Find work"
                sub="Browse & apply to jobs"
                onPress={() => setRole('worker')}
              />
              <RoleOption
                active={role === 'employer'}
                emoji="📋"
                title="Hire help"
                sub="Post jobs & pick workers"
                onPress={() => setRole('employer')}
              />
            </View>
          </View>

          <Button
            label="Continue"
            onPress={onSubmit}
            disabled={!canSubmit}
            style={{ marginTop: spacing.sm }}
          />
          <Text style={styles.disclaimer}>
            Demo app — no password needed. Your data stays on this device.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RoleOption({
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
      style={[styles.role, active && styles.roleActive]}
    >
      <Text style={styles.roleEmoji}>{emoji}</Text>
      <Text style={[styles.roleTitle, active && { color: colors.primaryDark }]}>
        {title}
      </Text>
      <Text style={styles.roleSub}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  logoWrap: { alignItems: 'center', gap: spacing.sm },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: { fontSize: 36 },
  title: { fontSize: font.h1, fontWeight: '800', color: colors.text },
  subtitle: {
    fontSize: font.body,
    color: colors.muted,
    textAlign: 'center',
  },
  roleLabel: { fontSize: font.small, fontWeight: '600', color: colors.muted },
  roleRow: { flexDirection: 'row', gap: spacing.md },
  role: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: 2,
    backgroundColor: colors.bg,
  },
  roleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  roleEmoji: { fontSize: 26, marginBottom: spacing.xs },
  roleTitle: { fontSize: font.body, fontWeight: '700', color: colors.text },
  roleSub: { fontSize: font.small, color: colors.muted },
  disclaimer: {
    fontSize: font.small,
    color: colors.muted,
    textAlign: 'center',
  },
});
