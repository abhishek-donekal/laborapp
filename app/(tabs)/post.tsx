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

export default function PostJob() {
  const { postJob } = useApp();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Construction');
  const [payType, setPayType] = useState<PayType>('hourly');
  const [payRate, setPayRate] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');

  const rate = parseFloat(payRate);
  const canSubmit =
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    !Number.isNaN(rate) &&
    rate > 0 &&
    location.trim().length >= 2 &&
    /^\d{4}-\d{2}-\d{2}$/.test(date);

  function onSubmit() {
    if (!canSubmit) return;
    postJob({
      title: title.trim(),
      description: description.trim(),
      category,
      payType,
      payRate: rate,
      location: location.trim(),
      date,
    });
    router.replace('/(tabs)');
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
            payType === 'fixed' ? 'Flat amount ($)' : `Rate ($ per ${payType === 'hourly' ? 'hour' : 'day'})`
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

        <Field
          label="Date needed (YYYY-MM-DD)"
          placeholder="2026-07-15"
          value={date}
          onChangeText={setDate}
          keyboardType="numbers-and-punctuation"
        />

        <Button
          label="Post job"
          onPress={onSubmit}
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
});
