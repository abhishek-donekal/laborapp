import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut as fbSignOut,
  type User as FbUser,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  Application,
  ApplicationStatus,
  Job,
  Role,
  User,
} from './types';
import { MOCK_JOBS } from './mockData';
import { auth, db, firebaseEnabled, googleProvider } from './firebase';

export { firebaseEnabled };

const STORAGE_KEY = 'laborapp:v1';

// ---- Local (jobs/applications/demo-user) reducer ----------------------------

interface LocalState {
  demoUser: User | null;
  jobs: Job[];
  applications: Application[];
  hydrated: boolean;
}

type Action =
  | { type: 'HYDRATE'; payload: Partial<LocalState> }
  | { type: 'DEMO_LOGIN'; payload: User }
  | { type: 'DEMO_LOGOUT' }
  | { type: 'UPDATE_DEMO_PROFILE'; payload: Partial<User> }
  | { type: 'ADD_JOB'; payload: Job }
  | { type: 'CLOSE_JOB'; payload: string }
  | { type: 'ADD_APPLICATION'; payload: Application }
  | {
      type: 'SET_APPLICATION_STATUS';
      payload: { id: string; status: ApplicationStatus };
    };

const initialLocal: LocalState = {
  demoUser: null,
  jobs: MOCK_JOBS,
  applications: [],
  hydrated: false,
};

function reducer(state: LocalState, action: Action): LocalState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, hydrated: true };
    case 'DEMO_LOGIN':
      return { ...state, demoUser: action.payload };
    case 'DEMO_LOGOUT':
      return { ...state, demoUser: null };
    case 'UPDATE_DEMO_PROFILE':
      return {
        ...state,
        demoUser: state.demoUser
          ? { ...state.demoUser, ...action.payload }
          : state.demoUser,
      };
    case 'ADD_JOB':
      return { ...state, jobs: [action.payload, ...state.jobs] };
    case 'CLOSE_JOB':
      return {
        ...state,
        jobs: state.jobs.map((j) =>
          j.id === action.payload ? { ...j, status: 'closed' } : j
        ),
      };
    case 'ADD_APPLICATION':
      return { ...state, applications: [action.payload, ...state.applications] };
    case 'SET_APPLICATION_STATUS':
      return {
        ...state,
        applications: state.applications.map((a) =>
          a.id === action.payload.id
            ? { ...a, status: action.payload.status }
            : a
        ),
      };
    default:
      return state;
  }
}

let idCounter = 0;
export function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

// ---- Firestore profile shape ------------------------------------------------

interface Profile {
  name?: string;
  role?: Role;
  phone?: string;
  bio?: string;
}

// ---- Context ----------------------------------------------------------------

interface Ctx {
  ready: boolean;
  user: User | null;
  needsRole: boolean; // signed in with Google but hasn't picked a role
  pendingName: string; // Google display name awaiting role selection
  usingFirebase: boolean;
  jobs: Job[];
  applications: Application[];

  signInWithGoogle: () => Promise<void>;
  signInWithGoogleIdToken: (idToken: string) => Promise<void>;
  demoLogin: (name: string, role: Role) => void;
  logout: () => void;
  chooseRole: (role: Role) => Promise<void>;
  updateProfile: (patch: Partial<User>) => void;

  postJob: (
    input: Omit<Job, 'id' | 'employerId' | 'employerName' | 'status' | 'createdAt'>
  ) => void;
  closeJob: (jobId: string) => void;
  applyToJob: (jobId: string, message: string) => void;
  setApplicationStatus: (id: string, status: ApplicationStatus) => void;
  hasApplied: (jobId: string) => boolean;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialLocal);

  const [authReady, setAuthReady] = useState(!firebaseEnabled);
  const [fbUser, setFbUser] = useState<FbUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Hydrate persisted local state once.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as Partial<LocalState>) : {};
        dispatch({ type: 'HYDRATE', payload: parsed });
      } catch {
        dispatch({ type: 'HYDRATE', payload: {} });
      }
    })();
  }, []);

  // Persist local state (jobs, applications, demo user) after hydration.
  useEffect(() => {
    if (!state.hydrated) return;
    const { demoUser, jobs, applications } = state;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ demoUser, jobs, applications })
    ).catch(() => {});
  }, [state]);

  // Subscribe to Firebase auth.
  useEffect(() => {
    if (!firebaseEnabled || !auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setFbUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  // Subscribe to the signed-in user's Firestore profile doc.
  useEffect(() => {
    if (!firebaseEnabled || !db || !fbUser) {
      setProfile(null);
      return;
    }
    const ref = doc(db, 'users', fbUser.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => setProfile(snap.exists() ? (snap.data() as Profile) : {}),
      () => setProfile({})
    );
    return unsub;
  }, [fbUser]);

  // Derive the effective user.
  const firebaseUser: User | null =
    fbUser && profile?.role
      ? {
          id: fbUser.uid,
          name: profile.name || fbUser.displayName || 'User',
          role: profile.role,
          email: fbUser.email || undefined,
          photoURL: fbUser.photoURL || undefined,
          phone: profile.phone,
          bio: profile.bio,
        }
      : null;

  const user = firebaseUser ?? state.demoUser;
  const needsRole = !!fbUser && !profile?.role;
  const ready = state.hydrated && authReady;

  const value = useMemo<Ctx>(() => {
    async function writeProfile(patch: Profile) {
      if (!db || !fbUser) return;
      await setDoc(doc(db, 'users', fbUser.uid), patch, { merge: true });
    }

    return {
      ready,
      user,
      needsRole,
      pendingName: fbUser?.displayName ?? '',
      usingFirebase: firebaseEnabled,
      jobs: state.jobs,
      applications: state.applications,

      signInWithGoogle: async () => {
        if (!auth) throw new Error('Firebase is not configured.');
        if (Platform.OS !== 'web') {
          throw new Error(
            'Google sign-in popup is only wired for web. Use the web app, or add native OAuth in a dev build.'
          );
        }
        await signInWithPopup(auth, googleProvider);
      },

      signInWithGoogleIdToken: async (idToken: string) => {
        if (!auth) throw new Error('Firebase is not configured.');
        const cred = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, cred);
      },

      demoLogin: (name, role) =>
        dispatch({
          type: 'DEMO_LOGIN',
          payload: { id: makeId(role), name: name.trim(), role },
        }),

      logout: () => {
        if (auth && fbUser) fbSignOut(auth).catch(() => {});
        dispatch({ type: 'DEMO_LOGOUT' });
      },

      chooseRole: async (role) => {
        if (fbUser) {
          await writeProfile({
            role,
            name: fbUser.displayName || 'User',
          });
        }
      },

      updateProfile: (patch) => {
        if (fbUser) {
          writeProfile({ phone: patch.phone, bio: patch.bio }).catch(() => {});
        } else {
          dispatch({ type: 'UPDATE_DEMO_PROFILE', payload: patch });
        }
      },

      postJob: (input) => {
        if (!user) return;
        dispatch({
          type: 'ADD_JOB',
          payload: {
            ...input,
            id: makeId('job'),
            employerId: user.id,
            employerName: user.name,
            status: 'open',
            createdAt: Date.now(),
          },
        });
      },
      closeJob: (jobId) => dispatch({ type: 'CLOSE_JOB', payload: jobId }),
      applyToJob: (jobId, message) => {
        if (!user) return;
        dispatch({
          type: 'ADD_APPLICATION',
          payload: {
            id: makeId('app'),
            jobId,
            workerId: user.id,
            workerName: user.name,
            message: message.trim(),
            status: 'pending',
            createdAt: Date.now(),
          },
        });
      },
      setApplicationStatus: (id, status) =>
        dispatch({ type: 'SET_APPLICATION_STATUS', payload: { id, status } }),
      hasApplied: (jobId) =>
        !!user &&
        state.applications.some(
          (a) => a.jobId === jobId && a.workerId === user.id
        ),
    };
  }, [ready, user, needsRole, fbUser, state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
