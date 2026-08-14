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
import { Button, Field } from '../../src/components';
import { useApp } from '../../src/store';
import { colors, font, radius, spacing } from '../../src/theme';
import { CATEGORIES, Category, PayType } from '../../src/types';

const PAY_TYPES: { key: PayType; label: string }[] = [
  { key: 'hourly', label: 'Per hour' },
  { key: 'daily', label: 'Per day' },
  { key: 'fixed', label: 'Flat rate' },
];

function isoInDays(n: number): string {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const DATE_SHORTCUTS = [
  { label: 'Tomorrow', value: isoInDays(1) },
  { label: 'In 3 days', value: isoInDays(3) },
  { label: 'Next week', value: isoInDays(7) },
];

export default function PostJob() {
  const { postJob } = useApp();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Construction');
  const [payType, setPayType] = useState<PayType>('hourly');
  const [payRate, setPayRate] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(isoInDays(1));
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const rate = parseFloat(payRate);
  const canSubmit =
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    !Number.isNaN(rate) &&
    rate > 0 &&
    location.trim().length >= 2 &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    agreed;

  async function onSubmit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError('');
    try {
      await postJob({
        title: title.trim(),
        description: description.trim(),
        category,
        payType,
        payRate: rate,
        location: location.trim(),
        date,
      });
      setTitle('');
      setDescription('');
      setPayRate('');
      setLocation('');
      setAgreed(false);
      router.replace('/(tabs)');
    } catch {
      setError('Could not post that job. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Field
          label="Job title"
          placeholder="e.g. Concrete pour helpers"
          value={title}
          onChangeText={setTitle}
        />

        <Field
          label="Description"
          placeholder="What's the work? Requirements, tools, hours…"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={styles.multiline}
        />

        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.wrapRow}>
            {CATEGORIES.map((c) => (
              <Selectable
                key={c}
                label={c}
                active={category === c}
                onPress={() => setCategory(c)}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>Pay type</Text>
          <View style={styles.wrapRow}>
            {PAY_TYPES.map((p) => (
              <Selectable
                key={p.key}
                label={p.label}
                active={payType === p.key}
                onPress={() => setPayType(p.key)}
              />
            ))}
          </View>
        </View>

        <Field
          label={
            payType === 'fixed'
              ? 'Flat amount ($)'
              : `Rate ($ per ${payType === 'hourly' ? 'hour' : 'day'})`
          }
          placeholder="e.g. 22"
          value={payRate}
          onChangeText={setPayRate}
          keyboardType="numeric"
        />

        <Field
          label="Location"
          placeholder="City, State"
          value={location}
          onChangeText={setLocation}
        />

        <View style={{ gap: spacing.sm }}>
          <Field
            label="Date needed (YYYY-MM-DD)"
            placeholder={isoInDays(1)}
            value={date}
            onChangeText={setDate}
            keyboardType={
              Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'
            }
          />
          <View style={styles.wrapRow}>
            {DATE_SHORTCUTS.map((s) => (
              <Selectable
                key={s.label}
                label={s.label}
                active={date === s.value}
                onPress={() => setDate(s.value)}
              />
            ))}
          </View>
        </View>

        <Pressable
          onPress={() => setAgreed((a) => !a)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          style={styles.agreeRow}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
            {agreed ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.agreeText}>
            This is a real job. It contains no discriminatory, abusive, or
            otherwise objectionable content, and I understand posts that break
            these rules are removed and the account terminated.
          </Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Post job"
          onPress={onSubmit}
          loading={busy}
          disabled={!canSubmit}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Selectable({
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
      style={[styles.select, active && styles.selectActive]}
    >
      <Text style={[styles.selectText, active && styles.selectTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  label: { fontSize: font.small, fontWeight: '600', color: colors.muted },
  multiline: { minHeight: 100, textAlignVertical: 'top', paddingTop: spacing.md },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  select: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  selectActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  selectText: { fontSize: font.small, fontWeight: '600', color: colors.muted },
  selectTextActive: { color: '#fff' },
  agreeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '900' },
  agreeText: { flex: 1, fontSize: font.small, color: colors.text, lineHeight: 19 },
  error: {
    fontSize: font.small,
    color: colors.danger,
    backgroundColor: colors.dangerTint,
    padding: spacing.sm,
    borderRadius: radius.sm,
    textAlign: 'center',
  },
});
