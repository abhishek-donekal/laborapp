import { useRouter } from 'expo-router';
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
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
import { auth } from '../src/firebase';
import { useApp } from '../src/store';
import { colors, font, radius, spacing } from '../src/theme';

type Method = 'email' | 'phone';

export default function Login() {
  const {
    usingFirebase,
    signInWithGoogle,
    signInWithFacebook,
    signUpWithEmail,
    signInWithEmail,
    demoLogin,
    user,
    needsRole,
  } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [busy, setBusy] = useState<string>('');
  const [error, setError] = useState('');
  const [method, setMethod] = useState<Method>('email');

  // Email state
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone state
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const confirmRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  // Demo fallback
  const [showDemo, setShowDemo] = useState(!usingFirebase);
  const [demoName, setDemoName] = useState('');

  useEffect(() => {
    if (user) router.replace('/(tabs)');
    else if (needsRole) router.replace('/onboarding');
  }, [user, needsRole]);

  async function guard(key: string, fn: () => Promise<void>) {
    setError('');
    setBusy(key);
    try {
      await fn();
    } catch (e: any) {
      setError(prettyError(e));
    } finally {
      setBusy('');
    }
  }

  function onEmail() {
    if (emailMode === 'signup') {
      if (name.trim().length < 2) return setError('Enter your name.');
      return guard('email', () => signUpWithEmail(name, email, password));
    }
    return guard('email', () => signInWithEmail(email, password));
  }

  async function onSendCode() {
    if (Platform.OS !== 'web' || !auth) {
      return setError('Phone sign-in is available on the web app.');
    }
    setError('');
    setBusy('phone');
    try {
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }
      const conf = await signInWithPhoneNumber(
        auth,
        phone.trim(),
        recaptchaRef.current
      );
      confirmRef.current = conf;
      setCodeSent(true);
    } catch (e: any) {
      setError(prettyError(e));
    } finally {
      setBusy('');
    }
  }

  async function onVerifyCode() {
    if (!confirmRef.current) return;
    setError('');
    setBusy('phone');
    try {
      await confirmRef.current.confirm(code.trim());
    } catch (e: any) {
      setError(prettyError(e));
    } finally {
      setBusy('');
    }
  }

  const emailValid = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

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
          <Text style={styles.title}>laborapp</Text>
          <Text style={styles.subtitle}>Hire day laborers, or find work.</Text>
        </View>

        {!usingFirebase ? (
          <Text style={styles.notice}>
            Auth backend not configured — demo mode only.
          </Text>
        ) : null}

        {usingFirebase ? (
          <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
            {/* Social */}
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

            {/* Method switch */}
            <View style={styles.segment}>
              <SegBtn
                label="Email"
                active={method === 'email'}
                onPress={() => setMethod('email')}
              />
              <SegBtn
                label="Phone"
                active={method === 'phone'}
                onPress={() => setMethod('phone')}
              />
            </View>

            {method === 'email' ? (
              <View style={{ gap: spacing.md }}>
                {emailMode === 'signup' ? (
                  <Field
                    label="Name"
                    placeholder="Alex Johnson"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                ) : null}
                <Field
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Field
                  label="Password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <Button
                  label={emailMode === 'signup' ? 'Create account' : 'Log in'}
                  onPress={onEmail}
                  loading={busy === 'email'}
                  disabled={!emailValid}
                />
                <Pressable
                  onPress={() =>
                    setEmailMode((m) => (m === 'signin' ? 'signup' : 'signin'))
                  }
                >
                  <Text style={styles.switchLink}>
                    {emailMode === 'signin'
                      ? "New here? Create an account"
                      : 'Have an account? Log in'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ gap: spacing.md }}>
                {!codeSent ? (
                  <>
                    <Field
                      label="Phone number"
                      placeholder="+1 512 555 0123"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                    <Button
                      label="Send code"
                      onPress={onSendCode}
                      loading={busy === 'phone'}
                      disabled={phone.trim().length < 8}
                    />
                    <Text style={styles.hint}>
                      Use international format, e.g. +15125550123.
                    </Text>
                  </>
                ) : (
                  <>
                    <Field
                      label="Verification code"
                      placeholder="6-digit code"
                      value={code}
                      onChangeText={setCode}
                      keyboardType="number-pad"
                    />
                    <Button
                      label="Verify & continue"
                      onPress={onVerifyCode}
                      loading={busy === 'phone'}
                      disabled={code.trim().length < 6}
                    />
                    <Pressable onPress={() => setCodeSent(false)}>
                      <Text style={styles.switchLink}>Change number</Text>
                    </Pressable>
                  </>
                )}
              </View>
            )}
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Demo fallback */}
        {usingFirebase ? (
          <Pressable onPress={() => setShowDemo((s) => !s)}>
            <Text style={styles.demoToggle}>
              {showDemo ? 'Hide demo login' : 'Skip — try demo without an account'}
            </Text>
          </Pressable>
        ) : null}

        {showDemo ? (
          <View style={styles.demoBox}>
            <Field
              label="Your name"
              placeholder="Alex Johnson"
              value={demoName}
              onChangeText={setDemoName}
              autoCapitalize="words"
            />
            <View style={styles.segment}>
              <SegBtn label="Find work" active onPress={() => {}} />
            </View>
            <Text style={styles.hint}>
              Demo signs you in as a worker on this device only.
            </Text>
            <Button
              label="Enter demo"
              variant="secondary"
              onPress={() => {
                if (demoName.trim().length < 2) return setError('Enter a name.');
                demoLogin(demoName, 'worker');
                router.replace('/(tabs)');
              }}
            />
          </View>
        ) : null}

        {/* Invisible reCAPTCHA host (web only) */}
        {Platform.OS === 'web' ? (
          <View nativeID="recaptcha-container" />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SegBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segBtn, active && styles.segBtnActive]}
    >
      <Text style={[styles.segText, active && styles.segTextActive]}>{label}</Text>
    </Pressable>
  );
}

function prettyError(e: any): string {
  const code = e?.code as string | undefined;
  const map: Record<string, string> = {
    'auth/invalid-email': 'That email looks invalid.',
    'auth/email-already-in-use': 'That email already has an account. Log in instead.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/user-not-found': 'No account with that email.',
    'auth/operation-not-allowed':
      'This sign-in method isn\'t enabled yet in Firebase.',
    'auth/unauthorized-domain':
      'This domain isn\'t authorized in Firebase Auth settings.',
    'auth/invalid-phone-number': 'Enter a valid phone number with country code.',
    'auth/invalid-verification-code': 'That code is incorrect.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/popup-blocked': 'Popup blocked — allow popups and retry.',
  };
  if (code && map[code]) return map[code];
  return e?.message?.replace('Firebase: ', '') ?? 'Something went wrong.';
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
  notice: {
    fontSize: font.small,
    color: colors.warning,
    backgroundColor: colors.warningTint,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
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
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segBtnActive: { backgroundColor: colors.bg, ...shadow() },
  segText: { fontSize: font.small, fontWeight: '700', color: colors.muted },
  segTextActive: { color: colors.text },
  switchLink: {
    fontSize: font.small,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  hint: { fontSize: font.small, color: colors.muted, textAlign: 'center' },
  error: {
    fontSize: font.small,
    color: colors.danger,
    textAlign: 'center',
    backgroundColor: colors.dangerTint,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  demoToggle: {
    fontSize: font.small,
    color: colors.muted,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  demoBox: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    marginTop: spacing.sm,
  },
});

function shadow() {
  return Platform.select({
    web: { boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } as object,
    default: {
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
  }) as object;
}
