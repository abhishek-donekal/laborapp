import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Badge, Card } from './components';
import { formatDate, jobPay } from './format';
import { colors, font, spacing } from './theme';
import { Job } from './types';

export function JobCard({
  job,
  applicantCount,
  showStatus,
}: {
  job: Job;
  applicantCount?: number;
  showStatus?: boolean;
}) {
  const router = useRouter();
  return (
    <Card onPress={() => router.push(`/job/${job.id}`)} style={styles.card}>
      <View style={styles.topRow}>
        <Badge label={job.category} tone="primary" />
        {showStatus ? (
          <Badge
            label={job.status === 'open' ? 'Open' : 'Closed'}
            tone={job.status === 'open' ? 'success' : 'neutral'}
          />
        ) : (
          <Text style={styles.pay}>{jobPay(job)}</Text>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {job.title}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>📍 {job.location}</Text>
        <Text style={styles.meta}>📅 {formatDate(job.date)}</Text>
      </View>

      <View style={styles.footer}>
        {showStatus ? (
          <Text style={styles.pay}>{jobPay(job)}</Text>
        ) : (
          <Text style={styles.employer}>{job.employerName}</Text>
        )}
        {typeof applicantCount === 'number' ? (
          <Text style={styles.applicants}>
            {applicantCount} applicant{applicantCount === 1 ? '' : 's'}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: font.h3, fontWeight: '700', color: colors.text },
  pay: { fontSize: font.body, fontWeight: '800', color: colors.primaryDark },
  metaRow: { flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap' },
  meta: { fontSize: font.small, color: colors.muted },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  employer: { fontSize: font.small, color: colors.muted, fontWeight: '600' },
  applicants: { fontSize: font.small, color: colors.primary, fontWeight: '700' },
});
