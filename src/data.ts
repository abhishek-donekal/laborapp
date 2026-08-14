import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { Application, ApplicationStatus, Job, Role } from './types';

/**
 * Firestore data layer. Jobs and applications are shared server-side records —
 * every signed-in device sees the same marketplace. `src/store.tsx` owns the
 * React state; this module owns the reads/writes.
 */

const JOB_FEED_LIMIT = 200;

export interface ProfileDoc {
  name?: string;
  role?: Role;
  phone?: string;
  bio?: string;
  blockedUserIds?: string[];
  acceptedTermsAt?: number;
  createdAt?: number;
}

function requireDb() {
  if (!db) throw new Error('HireMe is not connected right now. Try again shortly.');
  return db;
}

// ---- Profiles ---------------------------------------------------------------

export function watchProfile(
  uid: string,
  onChange: (profile: ProfileDoc | null) => void
): Unsubscribe {
  return onSnapshot(
    doc(requireDb(), 'users', uid),
    (snap) => onChange(snap.exists() ? (snap.data() as ProfileDoc) : {}),
    () => onChange({})
  );
}

export async function writeProfile(uid: string, patch: ProfileDoc): Promise<void> {
  const clean = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined)
  );
  await setDoc(doc(requireDb(), 'users', uid), clean, { merge: true });
}

// ---- Jobs -------------------------------------------------------------------

function toJob(id: string, data: Record<string, unknown>): Job {
  return {
    id,
    employerId: String(data.employerId ?? ''),
    employerName: String(data.employerName ?? 'Employer'),
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    category: (data.category ?? 'General') as Job['category'],
    payRate: Number(data.payRate ?? 0),
    payType: (data.payType ?? 'hourly') as Job['payType'],
    location: String(data.location ?? ''),
    date: String(data.date ?? ''),
    status: (data.status ?? 'open') as Job['status'],
    createdAt: Number(data.createdAt ?? 0),
  };
}

/** Public job feed — readable signed out so people can browse before joining. */
export function watchJobs(onChange: (jobs: Job[]) => void): Unsubscribe {
  const q = query(
    collection(requireDb(), 'jobs'),
    orderBy('createdAt', 'desc'),
    limit(JOB_FEED_LIMIT)
  );
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => toJob(d.id, d.data()))),
    () => onChange([])
  );
}

export async function createJob(
  input: Omit<Job, 'id' | 'status' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(requireDb(), 'jobs'), {
    ...input,
    status: 'open',
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function setJobStatus(jobId: string, status: Job['status']): Promise<void> {
  await updateDoc(doc(requireDb(), 'jobs', jobId), { status });
}

/**
 * `employerId` is part of the applications query on purpose: the security rules
 * only let you read applications you own, so filtering by jobId alone is denied.
 */
export async function deleteJob(jobId: string, employerId: string): Promise<void> {
  const database = requireDb();
  const apps = await getDocs(
    query(
      collection(database, 'applications'),
      where('employerId', '==', employerId),
      where('jobId', '==', jobId)
    )
  );
  const batch = writeBatch(database);
  apps.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(database, 'jobs', jobId));
  await batch.commit();
}

// ---- Applications -----------------------------------------------------------

function toApplication(id: string, data: Record<string, unknown>): Application {
  return {
    id,
    jobId: String(data.jobId ?? ''),
    employerId: String(data.employerId ?? ''),
    workerId: String(data.workerId ?? ''),
    workerName: String(data.workerName ?? 'Worker'),
    message: String(data.message ?? ''),
    status: (data.status ?? 'pending') as ApplicationStatus,
    createdAt: Number(data.createdAt ?? 0),
  };
}

/**
 * Workers see the applications they sent; employers see the ones sent to them.
 * Two single-field queries so no composite index is required.
 */
export function watchApplications(
  uid: string,
  role: Role,
  onChange: (applications: Application[]) => void
): Unsubscribe {
  const field = role === 'employer' ? 'employerId' : 'workerId';
  const q = query(collection(requireDb(), 'applications'), where(field, '==', uid));
  return onSnapshot(
    q,
    (snap) =>
      onChange(
        snap.docs
          .map((d) => toApplication(d.id, d.data()))
          .sort((a, b) => b.createdAt - a.createdAt)
      ),
    () => onChange([])
  );
}

export async function createApplication(
  input: Omit<Application, 'id' | 'status' | 'createdAt'>
): Promise<void> {
  await addDoc(collection(requireDb(), 'applications'), {
    ...input,
    status: 'pending',
    createdAt: Date.now(),
  });
}

export async function setApplicationStatusRemote(
  id: string,
  status: ApplicationStatus
): Promise<void> {
  await updateDoc(doc(requireDb(), 'applications', id), { status });
}

// ---- Safety: reports, blocks, account deletion -------------------------------

export type ReportTarget = 'job' | 'application' | 'user';

export async function submitReport(input: {
  reporterId: string;
  targetType: ReportTarget;
  targetId: string;
  targetOwnerId: string;
  reason: string;
  details?: string;
}): Promise<void> {
  await addDoc(collection(requireDb(), 'reports'), {
    ...input,
    details: input.details ?? '',
    status: 'open',
    createdAt: Date.now(),
  });
}

/** Erases everything the user authored, then their profile. */
export async function purgeUserData(uid: string): Promise<void> {
  const database = requireDb();

  const [postedJobs, sentApps, receivedApps] = await Promise.all([
    getDocs(query(collection(database, 'jobs'), where('employerId', '==', uid))),
    getDocs(query(collection(database, 'applications'), where('workerId', '==', uid))),
    getDocs(query(collection(database, 'applications'), where('employerId', '==', uid))),
  ]);

  const refs = [
    ...postedJobs.docs.map((d) => d.ref),
    ...sentApps.docs.map((d) => d.ref),
    ...receivedApps.docs.map((d) => d.ref),
  ];

  // Firestore batches cap at 500 writes.
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(database);
    refs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  await deleteDoc(doc(database, 'users', uid));
}
