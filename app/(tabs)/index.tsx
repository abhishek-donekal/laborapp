import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { EmptyState } from '../../src/components';
import { JobCard } from '../../src/JobCard';
import { useApp } from '../../src/store';
import { colors, font, radius, spacing } from '../../src/theme';
import { CATEGORIES, Category } from '../../src/types';

export default function JobsScreen() {
  const { user, jobs, applications } = useApp();
  const isEmployer = user?.role === 'employer';

  if (isEmployer) return <EmployerJobs />;
  return <WorkerJobs />;
}

function WorkerJobs() {
  const { jobs } = useApp();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<Category | 'All'>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs
      .filter((j) => j.status === 'open')
      .filter((j) => (cat === 'All' ? true : j.category === cat))
      .filter((j) =>
        q
          ? j.title.toLowerCase().includes(q) ||
            j.location.toLowerCase().includes(q) ||
            j.description.toLowerCase().includes(q)
          : true
      );
  }, [jobs, query, cat]);

  return (
    <View style={styles.screen}>
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          placeholder="Search jobs, locations…"
          placeholderTextColor={colors.muted}
          style={styles.search}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={['All', ...CATEGORIES] as (Category | 'All')[]}
        keyExtractor={(c) => c}
        contentContainerStyle={styles.chipsRow}
        style={styles.chips}
        renderItem={({ item }) => {
          const active = cat === item;
          return (
            <Pressable
              onPress={() => setCat(item)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {item}
              </Text>
            </Pressable>
          );
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(j) => j.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <JobCard job={item} />}
        ListEmptyComponent={
          <EmptyState
            title="No jobs found"
            subtitle="Try a different category or search term."
          />
        }
      />
    </View>
  );
}

function EmployerJobs() {
  const { user, jobs, applications } = useApp();
  const myJobs = useMemo(
    () =>
      jobs
        .filter((j) => j.employerId === user?.id)
        .sort((a, b) => b.createdAt - a.createdAt),
    [jobs, user]
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={myJobs}
        keyExtractor={(j) => j.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            showStatus
            applicantCount={
              applications.filter((a) => a.jobId === item.id).length
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No jobs posted yet"
            subtitle="Tap the Post tab to hire your first laborer."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { fontSize: 16 },
  search: { flex: 1, paddingVertical: spacing.md, fontSize: font.body, color: colors.text },
  chips: { flexGrow: 0 },
  chipsRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingVertical: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: font.small, fontWeight: '600', color: colors.muted },
  chipTextActive: { color: '#fff' },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
});
