import { useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from './components';
import { CategoryThumb } from './CategoryThumb';
import { formatDate, jobPay } from './format';
import { colors, font, radius, spacing } from './theme';
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
    <Pressable
      onPress={() => router.push(`/job/${job.id}`)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}
    >
      <CategoryThumb category={job.category} height={140}>
        <View style={styles.thumbTop}>
          <Badge label={job.category} tone="primary" />
          {showStatus ? (
            <Badge
              label={job.status === 'open' ? 'Open' : 'Closed'}
              tone={job.status === 'open' ? 'success' : 'neutral'}
            />
          ) : null}
        </View>
        <View style={styles.thumbBottom}>
          <View style={styles.payPill}>
            <Text style={styles.payPillText}>{jobPay(job)}</Text>
          </View>
        </View>
      </CategoryThumb>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {job.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>📍 {job.location}</Text>
          <Text style={styles.meta}>📅 {formatDate(job.date)}</Text>
        </View>
        <View style={styles.footer}>
          <View style={styles.employer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {job.employerName.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.employerName} numberOfLines={1}>
              {job.employerName}
            </Text>
          </View>
          {typeof applicantCount === 'number' ? (
            <Text style={styles.applicants}>
              {applicantCount} applicant{applicantCount === 1 ? '' : 's'}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 6px 20px rgba(15,23,42,0.08)' } as object,
      default: {
        shadowColor: '#0F172A',
        shadowOpacity: 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      },
    }),
  },
  thumbTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  thumbBottom: {
    marginTop: 'auto',
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  payPill: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  payPillText: { fontSize: font.body, fontWeight: '800', color: colors.primaryDark },
  body: { padding: spacing.lg, gap: spacing.sm },
  title: { fontSize: font.h3, fontWeight: '800', color: colors.text },
  metaRow: { flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap' },
  meta: { fontSize: font.small, color: colors.muted },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  employer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: font.tiny, fontWeight: '800', color: colors.primaryDark },
  employerName: { fontSize: font.small, color: colors.muted, fontWeight: '600', flex: 1 },
  applicants: { fontSize: font.small, color: colors.primary, fontWeight: '800' },
});
