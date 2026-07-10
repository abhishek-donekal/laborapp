import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Badge, Card, EmptyState } from '../../src/components';
import { formatDate, jobPay, timeAgo } from '../../src/format';
import { useApp } from '../../src/store';
import { colors, font, spacing } from '../../src/theme';
import { ApplicationStatus } from '../../src/types';

const statusTone: Record<
  ApplicationStatus,
  'warning' | 'success' | 'danger'
> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
};

export default function Applications() {
  const { user, applications, jobs } = useApp();
  const router = useRouter();

  const mine = useMemo(
    () =>
      applications
        .filter((a) => a.workerId === user?.id)
        .sort((a, b) => b.createdAt - a.createdAt),
    [applications, user]
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={mine}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const job = jobs.find((j) => j.id === item.jobId);
          if (!job) return null;
          return (
            <Card
              onPress={() => router.push(`/job/${job.id}`)}
              style={{ gap: spacing.sm }}
            >
              <View style={styles.row}>
                <Text style={styles.title} numberOfLines={1}>
                  {job.title}
                </Text>
                <Badge
                  label={item.status}
                  tone={statusTone[item.status]}
                />
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>📍 {job.location}</Text>
                <Text style={styles.meta}>📅 {formatDate(job.date)}</Text>
                <Text style={styles.pay}>{jobPay(job)}</Text>
              </View>
              <Text style={styles.applied}>Applied {timeAgo(item.createdAt)}</Text>
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title="No applications yet"
            subtitle="Browse the Jobs tab and apply to work near you."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { fontSize: font.h3, fontWeight: '700', color: colors.text, flex: 1 },
  metaRow: { flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap', alignItems: 'center' },
  meta: { fontSize: font.small, color: colors.muted },
  pay: { fontSize: font.small, fontWeight: '800', color: colors.primaryDark },
  applied: { fontSize: font.tiny, color: colors.muted },
});
