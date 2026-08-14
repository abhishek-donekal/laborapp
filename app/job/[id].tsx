import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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
import { Badge, Button, Card, EmptyState, Field } from '../../src/components';
import { CategoryThumb } from '../../src/CategoryThumb';
import { formatDate, jobPay, timeAgo } from '../../src/format';
import { useApp } from '../../src/store';
import { colors, font, radius, spacing } from '../../src/theme';
import { Job } from '../../src/types';

const REPORT_REASONS = [
  'Scam or fraud',
  'Discriminatory or hateful',
  'Harassment or abuse',
  'Not a real job',
  'Unsafe or illegal work',
];

/** Shared report sheet used for both job posts and applicants. */
function useReporting() {
  const { reportContent, blockUser } = useApp();

  function report(
    targetType: 'job' | 'application' | 'user',
    targetId: string,
    targetOwnerId: string,
    label: string
  ) {
    Alert.alert(`Report this ${label}`, 'Why are you reporting it?', [
      ...REPORT_REASONS.map((reason) => ({
        text: reason,
        onPress: () => {
          reportContent({ targetType, targetId, targetOwnerId, reason })
            .then(() =>
              Alert.alert(
                'Report received',
                'Thanks. Our team reviews every report within 24 hours and removes accounts that break the rules.'
              )
            )
            .catch(() =>
              Alert.alert('Could not send report', 'Check your connection and try again.')
            );
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }

  function block(uid: string, name: string) {
    Alert.alert(
      `Block ${name}?`,
      "You won't see their jobs or applications anywhere in HireMe. You can undo this from your profile.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            blockUser(uid).catch(() =>
              Alert.alert('Could not block', 'Check your connection and try again.')
            );
          },
        },
      ]
    );
  }

  return { report, block };
}

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, jobs } = useApp();
  const job = jobs.find((j) => j.id === id);

  if (!job) {
    return (
      <View style={styles.screen}>
        <EmptyState
          title="Job not found"
          subtitle="It may have been filled or removed by the employer."
        />
      </View>
    );
  }

  const isOwner = user?.id === job.employerId;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: isOwner ? 'Manage Job' : 'Job Details' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <CategoryThumb category={job.category} height={220} rounded={0}>
          <View style={styles.heroTop}>
            <Badge label={job.category} tone="primary" />
            <Badge
              label={job.status === 'open' ? 'Open' : 'Closed'}
              tone={job.status === 'open' ? 'success' : 'neutral'}
            />
          </View>
          <View style={styles.heroBottom}>
            <Text style={styles.heroTitle}>{job.title}</Text>
            <View style={styles.payPill}>
              <Text style={styles.payPillText}>{jobPay(job)}</Text>
            </View>
          </View>
        </CategoryThumb>

        <View style={styles.container}>
          <Card style={{ gap: spacing.md }}>
            <View style={styles.metaGrid}>
              <Meta icon="📍" label="Location" value={job.location} />
              <Meta icon="📅" label="Date" value={formatDate(job.date)} />
              <Meta icon="🏢" label="Posted by" value={job.employerName} />
              <Meta icon="⏱️" label="Posted" value={timeAgo(job.createdAt)} />
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.description}>{job.description}</Text>
          </Card>

          {isOwner ? (
            <EmployerPanel job={job} />
          ) : (
            <WorkerPanel job={job} />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>
        {icon} {label}
      </Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function WorkerPanel({ job }: { job: Job }) {
  const { hasApplied, applyToJob, applications, user, isGuest } = useApp();
  const router = useRouter();
  const { report, block } = useReporting();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const applied = hasApplied(job.id);
  const myApp = applications.find(
    (a) => a.jobId === job.id && a.workerId === user?.id
  );

  const safety = user ? (
    <View style={styles.safetyRow}>
      <Pressable onPress={() => report('job', job.id, job.employerId, 'job')}>
        <Text style={styles.safetyLink}>Report this job</Text>
      </Pressable>
      <Text style={styles.safetyDot}>·</Text>
      <Pressable onPress={() => block(job.employerId, job.employerName)}>
        <Text style={styles.safetyLink}>Block {job.employerName}</Text>
      </Pressable>
    </View>
  ) : null;

  if (isGuest || !user) {
    return (
      <>
        <Card style={{ gap: spacing.md }}>
          <Text style={styles.sectionLabel}>Want this job?</Text>
          <Text style={styles.appliedSub}>
            Create a free account to send the employer an application.
          </Text>
          <Button label="Sign in to apply" onPress={() => router.push('/login')} />
        </Card>
        {safety}
      </>
    );
  }

  if (applied) {
    return (
      <>
        <Card style={{ gap: spacing.sm, alignItems: 'center' }}>
          <Text style={styles.appliedEmoji}>✅</Text>
          <Text style={styles.appliedTitle}>Application sent</Text>
          <Badge
            label={myApp?.status ?? 'pending'}
            tone={
              myApp?.status === 'accepted'
                ? 'success'
                : myApp?.status === 'rejected'
                ? 'danger'
                : 'warning'
            }
          />
          <Text style={styles.appliedSub}>
            {myApp?.status === 'accepted'
              ? 'The employer accepted you. They will reach out with the details.'
              : myApp?.status === 'rejected'
              ? 'The employer went with someone else this time.'
              : 'The employer will review your application.'}
          </Text>
        </Card>
        {safety}
      </>
    );
  }

  if (job.status !== 'open') {
    return (
      <>
        <Card>
          <EmptyState
            title="This job is closed"
            subtitle="It is no longer accepting applicants."
          />
        </Card>
        {safety}
      </>
    );
  }

  return (
    <>
      <Card style={{ gap: spacing.md }}>
        <Text style={styles.sectionLabel}>Apply for this job</Text>
        <Field
          label="Message to employer"
          placeholder="Why you're a good fit, your experience, availability…"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          style={styles.multiline}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="Send application"
          loading={busy}
          disabled={message.trim().length < 5}
          onPress={async () => {
            setBusy(true);
            setError('');
            try {
              await applyToJob(job, message);
              setMessage('');
            } catch {
              setError('Could not send that. Check your connection and try again.');
            } finally {
              setBusy(false);
            }
          }}
        />
      </Card>
      {safety}
    </>
  );
}

function EmployerPanel({ job }: { job: Job }) {
  const { applications, setApplicationStatus, closeJob, removeJob } = useApp();
  const router = useRouter();
  const { report, block } = useReporting();

  const applicants = useMemo(
    () =>
      applications
        .filter((a) => a.jobId === job.id)
        .sort((a, b) => b.createdAt - a.createdAt),
    [applications, job.id]
  );

  function confirmClose() {
    Alert.alert('Close this job?', 'It will stop accepting new applicants.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close job',
        style: 'destructive',
        onPress: () => {
          closeJob(job.id).catch(() =>
            Alert.alert('Could not close the job', 'Try again in a moment.')
          );
        },
      },
    ]);
  }

  function confirmDelete() {
    Alert.alert(
      'Delete this job?',
      'The post and every application to it are permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeJob(job.id)
              .then(() => router.replace('/(tabs)'))
              .catch(() =>
                Alert.alert('Could not delete the job', 'Try again in a moment.')
              );
          },
        },
      ]
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.applicantHeader}>
        <Text style={styles.sectionLabel}>Applicants ({applicants.length})</Text>
        {job.status === 'open' ? (
          <Button
            label="Close job"
            variant="danger"
            onPress={confirmClose}
            style={{ height: 38, paddingHorizontal: spacing.md }}
          />
        ) : (
          <Badge label="Closed" tone="neutral" />
        )}
      </View>

      {applicants.length === 0 ? (
        <Card>
          <EmptyState
            title="No applicants yet"
            subtitle="Applications will show up here as people apply."
          />
        </Card>
      ) : (
        applicants.map((a) => (
          <Card key={a.id} style={{ gap: spacing.sm }}>
            <View style={styles.applicantRow}>
              <Text style={styles.applicantName}>{a.workerName}</Text>
              <Badge
                label={a.status}
                tone={
                  a.status === 'accepted'
                    ? 'success'
                    : a.status === 'rejected'
                    ? 'danger'
                    : 'warning'
                }
              />
            </View>
            <Text style={styles.applicantMsg}>{a.message}</Text>
            <Text style={styles.applicantTime}>{timeAgo(a.createdAt)}</Text>
            {a.status === 'pending' ? (
              <View style={styles.actionRow}>
                <Button
                  label="Accept"
                  onPress={() => setApplicationStatus(a.id, 'accepted')}
                  style={{ flex: 1, height: 42 }}
                />
                <Button
                  label="Reject"
                  variant="secondary"
                  onPress={() => setApplicationStatus(a.id, 'rejected')}
                  style={{ flex: 1, height: 42 }}
                />
              </View>
            ) : null}
            <View style={styles.safetyRow}>
              <Pressable
                onPress={() => report('application', a.id, a.workerId, 'applicant')}
              >
                <Text style={styles.safetyLink}>Report</Text>
              </Pressable>
              <Text style={styles.safetyDot}>·</Text>
              <Pressable onPress={() => block(a.workerId, a.workerName)}>
                <Text style={styles.safetyLink}>Block this person</Text>
              </Pressable>
            </View>
          </Card>
        ))
      )}

      <Button label="Delete this job" variant="danger" onPress={confirmDelete} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: spacing.xxl * 2 },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    marginTop: -spacing.xl,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  heroBottom: {
    marginTop: 'auto',
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: font.h1,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  payPill: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  payPillText: {
    fontSize: font.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metaItem: { width: '46%', gap: 2 },
  metaLabel: { fontSize: font.small, color: colors.muted },
  metaValue: { fontSize: font.body, fontWeight: '600', color: colors.text },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  sectionLabel: { fontSize: font.h3, fontWeight: '700', color: colors.text },
  description: { fontSize: font.body, color: colors.text, lineHeight: 22 },
  multiline: { minHeight: 100, textAlignVertical: 'top', paddingTop: spacing.md },
  appliedEmoji: { fontSize: 40 },
  appliedTitle: { fontSize: font.h3, fontWeight: '800', color: colors.text },
  appliedSub: {
    fontSize: font.small,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 19,
  },
  applicantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applicantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applicantName: { fontSize: font.body, fontWeight: '700', color: colors.text },
  applicantMsg: { fontSize: font.body, color: colors.text, lineHeight: 21 },
  applicantTime: { fontSize: font.tiny, color: colors.muted },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  safetyLink: { fontSize: font.small, color: colors.muted, fontWeight: '600' },
  safetyDot: { fontSize: font.small, color: colors.muted },
  error: {
    fontSize: font.small,
    color: colors.danger,
    backgroundColor: colors.dangerTint,
    padding: spacing.sm,
    borderRadius: radius.sm,
    textAlign: 'center',
  },
});
