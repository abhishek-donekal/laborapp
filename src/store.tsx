import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile as updateFbProfile,
  type User as FbUser,
} from 'firebase/auth';
import { Application, ApplicationStatus, Job, Role, User } from './types';
import {
  ProfileDoc,
  ReportTarget,
  createApplication,
  createJob,
  deleteJob as deleteJobRemote,
  purgeUserData,
  setApplicationStatusRemote,
  setJobStatus,
  submitReport,
  watchApplications,
  watchJobs,
  watchProfile,
  writeProfile,
} from './data';
import { auth, facebookProvider, firebaseEnabled, googleProvider } from './firebase';

export { firebaseEnabled };

/** Popup OAuth only works in the browser, so those buttons are web-only. */
export const socialLoginAvailable = firebaseEnabled && Platform.OS === 'web';

const GUEST_KEY = 'hireme:guest';
const JOBS_CACHE_KEY = 'hireme:jobs-cache';

interface Ctx {
  ready: boolean;
  user: User | null;
  /** Signed in but hasn't picked worker/employer yet. */
  needsRole: boolean;
  pendingName: string;
  /** Browsing the job feed without an account. */
  isGuest: boolean;
  connected: boolean;

  jobs: Job[];
  applications: Application[];

  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  continueAsGuest: () => void;
  leaveGuest: () => void;
  logout: () => Promise<void>;
  chooseRole: (role: Role, name?: string) => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;

  postJob: (
    input: Omit<Job, 'id' | 'employerId' | 'employerName' | 'status' | 'createdAt'>
  ) => Promise<void>;
  closeJob: (jobId: string) => Promise<void>;
  removeJob: (jobId: string) => Promise<void>;
  applyToJob: (job: Job, message: string) => Promise<void>;
  setApplicationStatus: (id: string, status: ApplicationStatus) => Promise<void>;
  hasApplied: (jobId: string) => boolean;

  blockUser: (uid: string) => Promise<void>;
  unblockUser: (uid: string) => Promise<void>;
  isBlocked: (uid: string) => boolean;
  reportContent: (input: {
    targetType: ReportTarget;
    targetId: string;
    targetOwnerId: string;
    reason: string;
    details?: string;
  }) => Promise<void>;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(!firebaseEnabled);
  const [fbUser, setFbUser] = useState<FbUser | null>(null);
  const [profile, setProfile] = useState<ProfileDoc | null>(null);

  const [guest, setGuest] = useState(false);
  const [guestReady, setGuestReady] = useState(false);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [connected, setConnected] = useState(false);

  // Restore "browsing as guest" so the feed isn't gated on every cold start.
  useEffect(() => {
    AsyncStorage.getItem(GUEST_KEY)
      .then((v) => setGuest(v === '1'))
      .catch(() => {})
      .finally(() => setGuestReady(true));
  }, []);

  // Warm the feed from the last cached copy so the list is never empty offline.
  useEffect(() => {
    AsyncStorage.getItem(JOBS_CACHE_KEY)
      .then((raw) => {
        if (!raw) return;
        const cached = JSON.parse(raw) as Job[];
        setJobs((current) => (current.length ? current : cached));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!firebaseEnabled || !auth) return;
    return onAuthStateChanged(auth, (u) => {
      setFbUser(u);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!firebaseEnabled || !fbUser) {
      setProfile(null);
      return;
    }
    return watchProfile(fbUser.uid, setProfile);
  }, [fbUser]);

  // Public job feed — runs signed in or out.
  useEffect(() => {
    if (!firebaseEnabled) return;
    return watchJobs((next) => {
      setJobs(next);
      setConnected(true);
      AsyncStorage.setItem(
        JOBS_CACHE_KEY,
        JSON.stringify(next.slice(0, 60))
      ).catch(() => {});
    });
  }, []);

  const role = profile?.role;

  useEffect(() => {
    if (!firebaseEnabled || !fbUser || !role) {
      setApplications([]);
      return;
    }
    return watchApplications(fbUser.uid, role, setApplications);
  }, [fbUser, role]);

  const blockedUserIds = useMemo(
    () => profile?.blockedUserIds ?? [],
    [profile?.blockedUserIds]
  );

  const user: User | null =
    fbUser && role
      ? {
          id: fbUser.uid,
          name: profile?.name || fbUser.displayName || 'HireMe user',
          role,
          email: fbUser.email || undefined,
          photoURL: fbUser.photoURL || undefined,
          phone: profile?.phone,
          bio: profile?.bio,
          blockedUserIds,
        }
      : null;

  const needsRole = !!fbUser && !!profile && !role;
  const ready = authReady && guestReady;

  // Anything from a blocked account disappears everywhere in the app.
  const visibleJobs = useMemo(
    () => jobs.filter((j) => !blockedUserIds.includes(j.employerId)),
    [jobs, blockedUserIds]
  );
  const visibleApplications = useMemo(
    () =>
      applications.filter(
        (a) =>
          !blockedUserIds.includes(a.workerId) &&
          !blockedUserIds.includes(a.employerId)
      ),
    [applications, blockedUserIds]
  );

  const setGuestFlag = useCallback((value: boolean) => {
    setGuest(value);
    AsyncStorage.setItem(GUEST_KEY, value ? '1' : '0').catch(() => {});
  }, []);

  const value = useMemo<Ctx>(() => {
    function requireUser(): User {
      if (!user) throw new Error('Sign in to continue.');
      return user;
    }

    return {
      ready,
      user,
      needsRole,
      pendingName: fbUser?.displayName ?? '',
      isGuest: guest && !fbUser,
      connected,
      jobs: visibleJobs,
      applications: visibleApplications,

      signUpWithEmail: async (name, email, password) => {
        if (!auth) throw new Error('Sign-in is unavailable right now.');
        const trimmed = name.trim();
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        if (trimmed) await updateFbProfile(cred.user, { displayName: trimmed });
        await writeProfile(cred.user.uid, {
          name: trimmed || 'HireMe user',
          createdAt: Date.now(),
        });
        setGuestFlag(false);
      },

      signInWithEmail: async (email, password) => {
        if (!auth) throw new Error('Sign-in is unavailable right now.');
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setGuestFlag(false);
      },

      signInWithGoogle: async () => {
        if (!auth || !socialLoginAvailable) {
          throw new Error('Use your email and password to sign in.');
        }
        await signInWithPopup(auth, googleProvider);
        setGuestFlag(false);
      },

      signInWithFacebook: async () => {
        if (!auth || !socialLoginAvailable) {
          throw new Error('Use your email and password to sign in.');
        }
        await signInWithPopup(auth, facebookProvider);
        setGuestFlag(false);
      },

      resetPassword: async (email) => {
        if (!auth) throw new Error('Sign-in is unavailable right now.');
        await sendPasswordResetEmail(auth, email.trim());
      },

      continueAsGuest: () => setGuestFlag(true),
      leaveGuest: () => setGuestFlag(false),

      logout: async () => {
        setGuestFlag(false);
        if (auth && fbUser) await fbSignOut(auth);
      },

      chooseRole: async (nextRole, name) => {
        if (!fbUser) throw new Error('Sign in to continue.');
        await writeProfile(fbUser.uid, {
          role: nextRole,
          name: name?.trim() || profile?.name || fbUser.displayName || 'HireMe user',
          acceptedTermsAt: Date.now(),
        });
      },

      updateProfile: async (patch) => {
        if (!fbUser) throw new Error('Sign in to continue.');
        await writeProfile(fbUser.uid, {
          name: patch.name,
          phone: patch.phone,
          bio: patch.bio,
        });
      },

      deleteAccount: async (password) => {
        if (!auth?.currentUser) throw new Error('Sign in to continue.');
        const current = auth.currentUser;
        if (current.email) {
          const credential = EmailAuthProvider.credential(current.email, password);
          await reauthenticateWithCredential(current, credential);
        }
        await purgeUserData(current.uid);
        await deleteUser(current);
        setGuestFlag(false);
      },

      postJob: async (input) => {
        const me = requireUser();
        await createJob({ ...input, employerId: me.id, employerName: me.name });
      },

      closeJob: (jobId) => setJobStatus(jobId, 'closed'),
      removeJob: async (jobId) => {
        const me = requireUser();
        await deleteJobRemote(jobId, me.id);
      },

      applyToJob: async (job, message) => {
        const me = requireUser();
        await createApplication({
          jobId: job.id,
          employerId: job.employerId,
          workerId: me.id,
          workerName: me.name,
          message: message.trim(),
        });
      },

      setApplicationStatus: (id, status) => setApplicationStatusRemote(id, status),

      hasApplied: (jobId) =>
        !!user &&
        applications.some((a) => a.jobId === jobId && a.workerId === user.id),

      blockUser: async (uid) => {
        const me = requireUser();
        if (uid === me.id) return;
        await writeProfile(me.id, {
          blockedUserIds: Array.from(new Set([...blockedUserIds, uid])),
        });
      },

      unblockUser: async (uid) => {
        const me = requireUser();
        await writeProfile(me.id, {
          blockedUserIds: blockedUserIds.filter((id) => id !== uid),
        });
      },

      isBlocked: (uid) => blockedUserIds.includes(uid),

      reportContent: async ({
        targetType,
        targetId,
        targetOwnerId,
        reason,
        details,
      }) => {
        const me = requireUser();
        await submitReport({
          reporterId: me.id,
          targetType,
          targetId,
          targetOwnerId,
          reason,
          details,
        });
      },
    };
  }, [
    ready,
    user,
    needsRole,
    fbUser,
    profile,
    guest,
    connected,
    visibleJobs,
    visibleApplications,
    applications,
    blockedUserIds,
    setGuestFlag,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
