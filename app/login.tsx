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
import { socialLoginAvailable, useApp } from '../src/store';
import { colors, font, radius, spacing } from '../src/theme';

export default function Login() {
  const {
    signInWithGoogle,
    signInWithFacebook,
    signUpWithEmail,
    signInWithEmail,
    resetPassword,
    continueAsGuest,
    user,
    needsRole,
  } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) router.replace('/(tabs)');
    else if (needsRole) router.replace('/onboarding');
  }, [user, needsRole]);

  async function guard(key: string, fn: () => Promise<void>) {
    setError('');
    setNotice('');
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      setError(prettyError(e));
    } finally {
      setBusy('');
    }
  }

  function onSubmit() {
    if (mode === 'signup') {
      if (name.trim().length < 2) return setError('Enter your name.');
      return guard('email', () => signUpWithEmail(name, email, password));
    }
    return guard('email', () => signInWithEmail(email, password));
  }

  function onForgotPassword() {
    if (!/\S+@\S+\.\S+/.test(email)) {
      return setError('Enter your email address first, then tap reset.');
    }
    guard('reset', async () => {
      await resetPassword(email);
      setNotice('Password reset email sent. Check your inbox.');
    });
  }

  const canSubmit = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <View style={styles.logo}>
            <Text style={styles.logoMark}>🛠️</Text>
          </View>
          <Text style={styles.title}>HireMe</Text>
          <Text style={styles.subtitle}>Hire day laborers, or find work.</Text>
        </View>

        {socialLoginAvailable ? (
          <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
            <Pressable
              onPress={() => guard('google', signInWithGoogle)}
              disabled={!!busy}
              style={({ pressed }) => [styles.social, pressed && { opacity: 0.85 }]}
            >
              {busy === 'google' ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <>
                  <View style={[styles.socialIcon, { backgroundColor: '#fff' }]}>
                    <Text style={[styles.socialMark, { color: '#4285F4' }]}>G</Text>
                  </View>
                  <Text style={styles.socialText}>Continue with Google</Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => guard('facebook', signInWithFacebook)}
              disabled={!!busy}
              style={({ pressed }) => [
                styles.social,
                { backgroundColor: '#1877F2', borderColor: '#1877F2' },
                pressed && { opacity: 0.85 },
              ]}
            >
              {busy === 'facebook' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <View style={[styles.socialIcon, { backgroundColor: '#1877F2' }]}>
                    <Text style={[styles.socialMark, { color: '#fff' }]}>f</Text>
                  </View>
                  <Text style={[styles.socialText, { color: '#fff' }]}>
                    Continue with Facebook
                  </Text>
                </>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.or}>or</Text>
              <View style={styles.line} />
            </View>
          </View>
        ) : null}

        <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
          {mode === 'signup' ? (
            <Field
              label="Full name"
              placeholder="Alex Rivera"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              textContentType="name"
            />
          ) : null}

          <Field
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          <Field
            label="Password"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType={mode === 'signup' ? 'newPassword' : 'password'}
          />

          <Button
            label={mode === 'signup' ? 'Create account' : 'Log in'}
            onPress={onSubmit}
            loading={busy === 'email'}
            disabled={!canSubmit}
          />

          {mode === 'signin' ? (
            <Pressable onPress={onForgotPassword} disabled={!!busy}>
              <Text style={styles.link}>
                {busy === 'reset' ? 'Sending…' : 'Forgot your password?'}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => {
              setError('');
              setNotice('');
              setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
            }}
          >
            <Text style={styles.link}>
              {mode === 'signin'
                ? 'New to HireMe? Create an account'
                : 'Already have an account? Log in'}
            </Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <View style={styles.guestBox}>
          <Text style={styles.guestTitle}>Just looking?</Text>
          <Text style={styles.guestSub}>
            Browse every open job without an account. You'll need to sign in to
            apply or post work.
          </Text>
          <Button
            label="Browse jobs"
            variant="secondary"
            onPress={() => {
              continueAsGuest();
              router.replace('/(tabs)');
            }}
          />
        </View>

        <Text style={styles.legal}>
          By continuing you agree to the{' '}
          <Text style={styles.legalLink} onPress={() => router.push('/legal/terms')}>
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text
            style={styles.legalLink}
            onPress={() => router.push('/legal/privacy')}
          >
            Privacy Policy
          </Text>
          , including a zero-tolerance policy for abusive or objectionable
          content.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function prettyError(e: unknown): string {
  const err = e as { code?: string; message?: string };
  const map: Record<string, string> = {
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/email-already-in-use': 'That email already has an account. Log in instead.',
    'auth/weak-password': 'Passwords need to be at least 6 characters.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/user-not-found': 'No account uses that email address.',
    'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
    'auth/network-request-failed': 'No connection. Check your network and retry.',
    'auth/popup-closed-by-user': 'The sign-in window was closed.',
    'auth/popup-blocked': 'Your browser blocked the sign-in window.',
  };
  if (err?.code && map[err.code]) return map[err.code];
  return err?.message?.replace('Firebase: ', '') ?? 'Something went wrong.';
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl * 2,
    flexGrow: 1,
    gap: spacing.sm,
  },
  logoWrap: { alignItems: 'center', gap: spacing.xs },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: { fontSize: 32 },
  title: { fontSize: font.h1, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: font.body, color: colors.muted },
  social: {
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
  socialIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialMark: { fontSize: 18, fontWeight: '900' },
  socialText: { fontSize: font.body, fontWeight: '700', color: colors.text },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { fontSize: font.small, color: colors.muted },
  link: {
    fontSize: font.small,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  error: {
    fontSize: font.small,
    color: colors.danger,
    textAlign: 'center',
    backgroundColor: colors.dangerTint,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  notice: {
    fontSize: font.small,
    color: colors.success,
    textAlign: 'center',
    backgroundColor: colors.successTint,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  guestBox: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    marginTop: spacing.xl,
  },
  guestTitle: { fontSize: font.h3, fontWeight: '700', color: colors.text },
  guestSub: { fontSize: font.small, color: colors.muted, lineHeight: 19 },
  legal: {
    fontSize: font.tiny,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: spacing.lg,
  },
  legalLink: { color: colors.primary, fontWeight: '700' },
});
