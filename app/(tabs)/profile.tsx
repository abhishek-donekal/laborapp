import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Badge, Button, Field } from '../../src/components';
import { useApp } from '../../src/store';
import { colors, font, radius, spacing } from '../../src/theme';

export default function Profile() {
  const { user, jobs, applications, updateProfile, logout } = useApp();
  const router = useRouter();

  const [phone, setPhone] = useState(user?.phone ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saved, setSaved] = useState(false);

  const stat = useMemo(() => {
    if (!user) return 0;
    return user.role === 'employer'
      ? jobs.filter((j) => j.employerId === user.id).length
      : applications.filter((a) => a.workerId === user.id).length;
  }, [user, jobs, applications]);

  if (!user) return null;

  function onSave() {
    updateProfile({ phone: phone.trim(), bio: bio.trim() });
    setSaved(true);
  }

  function onLogout() {
    logout();
    router.replace('/login');
  }

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
            label={user.role === 'employer' ? 'About your business' : 'About you / skills'}
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
          <Button label={saved ? 'Saved ✓' : 'Save profile'} onPress={onSave} />
        </View>

        <Button label="Log out" variant="danger" onPress={onLogout} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl * 2 },
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
});
