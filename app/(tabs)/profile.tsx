import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Badge, Button, Card, Field } from '../../src/components';
import { useApp } from '../../src/store';
import { colors, font, radius, spacing } from '../../src/theme';

export default function Profile() {
  const {
    user,
    isGuest,
    jobs,
    applications,
    updateProfile,
    chooseRole,
    logout,
    deleteAccount,
    unblockUser,
  } = useApp();
  const router = useRouter();

  const [phone, setPhone] = useState(user?.phone ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const stat = useMemo(() => {
    if (!user) return 0;
    return user.role === 'employer'
      ? jobs.filter((j) => j.employerId === user.id).length
      : applications.filter((a) => a.workerId === user.id).length;
  }, [user, jobs, applications]);

  if (!user) return <GuestProfile isGuest={isGuest} />;

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError('');
    try {
      await fn();
    } catch (e) {
      const err = e as { code?: string; message?: string };
      setError(
        err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
          ? 'That password is incorrect.'
          : err.message ?? 'Something went wrong.'
      );
    } finally {
      setBusy('');
    }
  }

  function onSwitchRole() {
    const next = user!.role === 'employer' ? 'worker' : 'employer';
    Alert.alert(
      next === 'employer' ? 'Switch to hiring?' : 'Switch to finding work?',
      next === 'employer'
        ? 'You will be able to post jobs and review applicants.'
        : 'You will be able to browse jobs and apply for work.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: () => run('role', () => chooseRole(next)),
        },
      ]
    );
  }

  function onDelete() {
    if (deletePassword.length < 6) {
      return setError('Enter your password to confirm deletion.');
    }
    Alert.alert(
      'Delete your account?',
      'This permanently removes your profile, your job posts, and your applications. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () =>
            run('delete', async () => {
              await deleteAccount(deletePassword);
              router.replace('/login');
            }),
        },
      ]
    );
  }

  const blocked = user.blockedUserIds ?? [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          {user.email ? <Text style={styles.email}>{user.email}</Text> : null}
          <Badge
            label={user.role === 'employer' ? 'Employer' : 'Worker'}
            tone="primary"
          />
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stat}</Text>
          <Text style={styles.statLabel}>
            {user.role === 'employer' ? 'Jobs posted' : 'Jobs applied to'}
          </Text>
        </View>

        <View style={{ gap: spacing.lg }}>
          <Field
            label="Phone"
            placeholder="(555) 123-4567"
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              setSaved(false);
            }}
            keyboardType="phone-pad"
          />
          <Field
            label={
              user.role === 'employer' ? 'About your business' : 'About you / skills'
            }
            placeholder={
              user.role === 'employer'
                ? 'What kind of work do you hire for?'
                : 'Experience, skills, availability…'
            }
            value={bio}
            onChangeText={(t) => {
              setBio(t);
              setSaved(false);
            }}
            multiline
            numberOfLines={4}
            style={styles.multiline}
          />
          <Button
            label={saved ? 'Saved ✓' : 'Save profile'}
            loading={busy === 'save'}
            onPress={() =>
              run('save', async () => {
                await updateProfile({ phone: phone.trim(), bio: bio.trim() });
                setSaved(true);
              })
            }
          />
        </View>

        <Card style={{ gap: spacing.md }}>
          <Text style={styles.sectionTitle}>
            {user.role === 'employer' ? 'Looking for work instead?' : 'Need to hire?'}
          </Text>
          <Text style={styles.sectionSub}>
            {user.role === 'employer'
              ? 'Switch to a worker account to browse and apply for jobs.'
              : 'Switch to an employer account to post jobs and review applicants.'}
          </Text>
          <Button
            label={
              user.role === 'employer' ? 'Switch to finding work' : 'Switch to hiring'
            }
            variant="secondary"
            loading={busy === 'role'}
            onPress={onSwitchRole}
          />
        </Card>

        {blocked.length ? (
          <Card style={{ gap: spacing.md }}>
            <Text style={styles.sectionTitle}>Blocked accounts</Text>
            <Text style={styles.sectionSub}>
              You won't see jobs or messages from these accounts.
            </Text>
            {blocked.map((id) => (
              <View key={id} style={styles.blockedRow}>
                <Text style={styles.blockedId} numberOfLines={1}>
                  {id}
                </Text>
                <Pressable onPress={() => run('unblock', () => unblockUser(id))}>
                  <Text style={styles.unblock}>Unblock</Text>
                </Pressable>
              </View>
            ))}
          </Card>
        ) : null}

        <Card style={{ gap: spacing.sm }}>
          <Text style={styles.sectionTitle}>Legal & safety</Text>
          <Pressable onPress={() => router.push('/legal/terms')}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/legal/privacy')}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.sectionSub}>
            Report abusive posts or people from any job page. Reports are reviewed
            and accounts that break the rules are removed within 24 hours.
          </Text>
        </Card>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Log out"
          variant="secondary"
          loading={busy === 'logout'}
          onPress={() =>
            run('logout', async () => {
              await logout();
              router.replace('/login');
            })
          }
        />

        <Card style={{ gap: spacing.md, borderColor: colors.dangerTint }}>
          <Text style={styles.sectionTitle}>Delete account</Text>
          <Text style={styles.sectionSub}>
            Permanently deletes your HireMe account along with every job and
            application you created. This cannot be undone.
          </Text>
          {deleting ? (
            <>
              <Field
                label="Confirm your password"
                placeholder="Your password"
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry
              />
              <Button
                label="Permanently delete my account"
                variant="danger"
                loading={busy === 'delete'}
                onPress={onDelete}
              />
              <Pressable onPress={() => setDeleting(false)}>
                <Text style={styles.cancelLink}>Cancel</Text>
              </Pressable>
            </>
          ) : (
            <Button
              label="Delete my account"
              variant="danger"
              onPress={() => setDeleting(true)}
            />
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function GuestProfile({ isGuest }: { isGuest: boolean }) {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryTint }]}>
          <Text style={[styles.avatarText, { color: colors.primaryDark }]}>?</Text>
        </View>
        <Text style={styles.name}>Guest</Text>
        <Text style={styles.email}>
          {isGuest ? 'Browsing without an account' : 'Not signed in'}
        </Text>
      </View>

      <Card style={{ gap: spacing.md }}>
        <Text style={styles.sectionTitle}>Create a free account</Text>
        <Text style={styles.sectionSub}>
          Sign in to apply for jobs, post work of your own, and keep track of
          your applications.
        </Text>
        <Button label="Sign in or sign up" onPress={() => router.push('/login')} />
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <Pressable onPress={() => router.push('/legal/terms')}>
          <Text style={styles.legalLink}>Terms of Service</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/legal/privacy')}>
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: spacing.xxl * 2,
  },
  header: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 34, fontWeight: '800', color: '#fff' },
  name: { fontSize: font.h2, fontWeight: '800', color: colors.text },
  email: { fontSize: font.small, color: colors.muted },
  statCard: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statNum: { fontSize: 32, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: font.small, color: colors.muted, fontWeight: '600' },
  multiline: { minHeight: 100, textAlignVertical: 'top', paddingTop: spacing.md },
  sectionTitle: { fontSize: font.h3, fontWeight: '700', color: colors.text },
  sectionSub: { fontSize: font.small, color: colors.muted, lineHeight: 19 },
  legalLink: {
    fontSize: font.body,
    color: colors.primary,
    fontWeight: '700',
    paddingVertical: spacing.xs,
  },
  cancelLink: {
    fontSize: font.small,
    color: colors.muted,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  blockedId: { flex: 1, fontSize: font.small, color: colors.muted },
  unblock: { fontSize: font.small, fontWeight: '700', color: colors.primary },
  error: {
    fontSize: font.small,
    color: colors.danger,
    backgroundColor: colors.dangerTint,
    padding: spacing.sm,
    borderRadius: radius.sm,
    textAlign: 'center',
  },
});
