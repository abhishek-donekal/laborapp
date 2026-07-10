import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  const {
    usingFirebase,
    signInWithGoogle,
    demoLogin,
    user,
    needsRole,
  } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('worker');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(!usingFirebase);

  // Redirect once auth resolves.
  useEffect(() => {
    if (user) router.replace('/(tabs)');
    else if (needsRole) router.replace('/onboarding');
  }, [user, needsRole]);

  const canSubmit = name.trim().length >= 2;

  async function onGoogle() {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle();
      // Navigation handled by the effect above.
    } catch (e: any) {
      setError(e?.message ?? 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  function onDemo() {
    if (!canSubmit) return;
    demoLogin(name, role);
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

        <View style={{ gap: spacing.md, marginTop: spacing.xxl }}>
          {usingFirebase ? (
            <Pressable
              onPress={onGoogle}
              disabled={busy}
              style={({ pressed }) => [
                styles.googleBtn,
                pressed && { opacity: 0.85 },
                busy && { opacity: 0.6 },
              ]}
            >
              {busy ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <>
                  <GoogleG />
                  <Text style={styles.googleText}>Continue with Google</Text>
                </>
              )}
            </Pressable>
          ) : (
            <Text style={styles.notice}>
              Google sign-in isn't configured yet. Using demo mode — set the
              Firebase env vars to enable Google login.
            </Text>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {usingFirebase ? (
            <Pressable onPress={() => setShowDemo((s) => !s)}>
              <Text style={styles.toggleDemo}>
                {showDemo ? 'Hide demo login' : 'Continue without Google (demo)'}
              </Text>
            </Pressable>
          ) : null}

          {showDemo ? (
            <View style={styles.demoBox}>
              <Field
                label="Your name"
                placeholder="e.g. Alex Johnson"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <View style={{ gap: spacing.sm }}>
                <Text style={styles.roleLabel}>I want to…</Text>
                <View style={styles.roleRow}>
                  <RoleOption
                    active={role === 'worker'}
                    emoji="👷"
                    title="Find work"
                    onPress={() => setRole('worker')}
                  />
                  <RoleOption
                    active={role === 'employer'}
                    emoji="📋"
                    title="Hire help"
                    onPress={() => setRole('employer')}
                  />
                </View>
              </View>
              <Button label="Continue" onPress={onDemo} disabled={!canSubmit} />
            </View>
          ) : null}

          <Text style={styles.disclaimer}>
            Demo data stays on this device. Google login syncs your profile.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function GoogleG() {
  return (
    <View style={styles.gWrap}>
      <Text style={styles.gMark}>G</Text>
    </View>
  );
}

function RoleOption({
  active,
  emoji,
  title,
  onPress,
}: {
  active: boolean;
  emoji: string;
  title: string;
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
  subtitle: { fontSize: font.body, color: colors.muted, textAlign: 'center' },
  googleBtn: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  gWrap: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gMark: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  googleText: { fontSize: font.body, fontWeight: '700', color: colors.text },
  notice: {
    fontSize: font.small,
    color: colors.warning,
    backgroundColor: colors.warningTint,
    padding: spacing.md,
    borderRadius: radius.md,
    lineHeight: 19,
  },
  error: { fontSize: font.small, color: colors.danger, textAlign: 'center' },
  toggleDemo: {
    fontSize: font.small,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  demoBox: {
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  roleLabel: { fontSize: font.small, fontWeight: '600', color: colors.muted },
  roleRow: { flexDirection: 'row', gap: spacing.md },
  role: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.bg,
  },
  roleActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  roleEmoji: { fontSize: 24 },
  roleTitle: { fontSize: font.small, fontWeight: '700', color: colors.text },
  disclaimer: {
    fontSize: font.small,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
