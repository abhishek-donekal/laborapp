import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Application,
  ApplicationStatus,
  Job,
  Role,
  User,
} from './types';
import { MOCK_JOBS } from './mockData';

const STORAGE_KEY = 'laborapp:v1';

interface State {
  user: User | null;
  jobs: Job[];
  applications: Application[];
  hydrated: boolean;
}

type Action =
  | { type: 'HYDRATE'; payload: Partial<State> }
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<User> }
  | { type: 'ADD_JOB'; payload: Job }
  | { type: 'CLOSE_JOB'; payload: string }
  | { type: 'ADD_APPLICATION'; payload: Application }
  | {
      type: 'SET_APPLICATION_STATUS';
      payload: { id: string; status: ApplicationStatus };
    };

const initialState: State = {
  user: null,
  jobs: MOCK_JOBS,
  applications: [],
  hydrated: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, hydrated: true };
    case 'LOGIN':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { ...state, user: null };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : state.user,
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

interface Ctx extends State {
  login: (name: string, role: Role) => void;
  logout: () => void;
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
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate persisted state once.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<State>;
          dispatch({ type: 'HYDRATE', payload: parsed });
        } else {
          dispatch({ type: 'HYDRATE', payload: {} });
        }
      } catch {
        dispatch({ type: 'HYDRATE', payload: {} });
      }
    })();
  }, []);

  // Persist on change (after hydration).
  useEffect(() => {
    if (!state.hydrated) return;
    const { user, jobs, applications } = state;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user, jobs, applications })
    ).catch(() => {});
  }, [state]);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      login: (name, role) =>
        dispatch({
          type: 'LOGIN',
          payload: { id: makeId(role), name: name.trim(), role },
        }),
      logout: () => dispatch({ type: 'LOGOUT' }),
      updateProfile: (patch) =>
        dispatch({ type: 'UPDATE_PROFILE', payload: patch }),
      postJob: (input) => {
        if (!state.user) return;
        dispatch({
          type: 'ADD_JOB',
          payload: {
            ...input,
            id: makeId('job'),
            employerId: state.user.id,
            employerName: state.user.name,
            status: 'open',
            createdAt: Date.now(),
          },
        });
      },
      closeJob: (jobId) => dispatch({ type: 'CLOSE_JOB', payload: jobId }),
      applyToJob: (jobId, message) => {
        if (!state.user) return;
        dispatch({
          type: 'ADD_APPLICATION',
          payload: {
            id: makeId('app'),
            jobId,
            workerId: state.user.id,
            workerName: state.user.name,
            message: message.trim(),
            status: 'pending',
            createdAt: Date.now(),
          },
        });
      },
      setApplicationStatus: (id, status) =>
        dispatch({ type: 'SET_APPLICATION_STATUS', payload: { id, status } }),
      hasApplied: (jobId) =>
        !!state.user &&
        state.applications.some(
          (a) => a.jobId === jobId && a.workerId === state.user!.id
        ),
    }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
