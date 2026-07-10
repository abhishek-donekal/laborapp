import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, jobs } = useApp();
  const job = jobs.find((j) => j.id === id);

  if (!job) {
    return (
      <View style={styles.screen}>
        <EmptyState title="Job not found" />
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
          <EmployerPanel jobId={job.id} jobOpen={job.status === 'open'} />
        ) : (
          <WorkerPanel jobId={job.id} jobOpen={job.status === 'open'} />
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

function WorkerPanel({ jobId, jobOpen }: { jobId: string; jobOpen: boolean }) {
  const { hasApplied, applyToJob, applications, user } = useApp();
  const [message, setMessage] = useState('');
  const applied = hasApplied(jobId);

  const myApp = applications.find(
    (a) => a.jobId === jobId && a.workerId === user?.id
  );

  if (applied) {
    return (
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
          The employer will review your application.
        </Text>
      </Card>
    );
  }

  if (!jobOpen) {
    return (
      <Card>
        <EmptyState title="This job is closed" subtitle="No longer accepting applicants." />
      </Card>
    );
  }

  return (
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
      <Button
        label="Send application"
        onPress={() => {
          applyToJob(jobId, message);
        }}
        disabled={message.trim().length < 5}
      />
    </Card>
  );
}

function EmployerPanel({ jobId, jobOpen }: { jobId: string; jobOpen: boolean }) {
  const { applications, setApplicationStatus, closeJob } = useApp();
  const applicants = useMemo(
    () =>
      applications
        .filter((a) => a.jobId === jobId)
        .sort((a, b) => b.createdAt - a.createdAt),
    [applications, jobId]
  );

  function confirmClose() {
    Alert.alert('Close this job?', 'It will stop accepting new applicants.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close job', style: 'destructive', onPress: () => closeJob(jobId) },
    ]);
  }

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.applicantHeader}>
        <Text style={styles.sectionLabel}>
          Applicants ({applicants.length})
        </Text>
        {jobOpen ? (
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
            subtitle="Applications will show up here."
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
          </Card>
        ))
      )}
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
  payPillText: { fontSize: font.body, fontWeight: '800', color: colors.primaryDark },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: { width: '46%', gap: 2 },
  metaLabel: { fontSize: font.small, color: colors.muted },
  metaValue: { fontSize: font.body, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  sectionLabel: { fontSize: font.h3, fontWeight: '700', color: colors.text },
  description: { fontSize: font.body, color: colors.text, lineHeight: 22 },
  multiline: { minHeight: 100, textAlignVertical: 'top', paddingTop: spacing.md },
  appliedEmoji: { fontSize: 40 },
  appliedTitle: { fontSize: font.h3, fontWeight: '800', color: colors.text },
  appliedSub: { fontSize: font.small, color: colors.muted, textAlign: 'center' },
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
});
