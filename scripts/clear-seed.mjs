/**
 * Removes all seeded demonstration content from Firestore: the sample job posts
 * attributed to invented employers, and every application attached to them.
 *
 * Signs in as each seed account because the security rules only let an account
 * delete its own records. Auth accounts are left in place so the App Review
 * demo login keeps working; only the fabricated marketplace content goes.
 *
 *   node scripts/clear-seed.mjs          # delete
 *   node scripts/clear-seed.mjs --dry    # report only
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  query,
  where,
} from 'firebase/firestore';

const dry = process.argv.includes('--dry');
const here = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(here, '..', '.env'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const app = initializeApp({
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

const PASSWORD = 'HireMe#Seed2026';
const REVIEW_PASSWORD = 'HireMe#Review26';

const ACCOUNTS = [
  { email: 'ramirez.construction@hiremeapp.dev', password: PASSWORD },
  { email: 'quickmove@hiremeapp.dev', password: PASSWORD },
  { email: 'greenleaf@hiremeapp.dev', password: PASSWORD },
  { email: 'brighthome@hiremeapp.dev', password: PASSWORD },
  { email: 'marcus.day@hiremeapp.dev', password: PASSWORD },
  { email: 'tina.reyes@hiremeapp.dev', password: PASSWORD },
  { email: 'devon.hart@hiremeapp.dev', password: PASSWORD },
  { email: 'appreview@hiremeapp.dev', password: REVIEW_PASSWORD },
];

let jobsGone = 0;
let appsGone = 0;

async function purge({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  const [ownedJobs, sentApps, receivedApps] = await Promise.all([
    getDocs(query(collection(db, 'jobs'), where('employerId', '==', uid))),
    getDocs(query(collection(db, 'applications'), where('workerId', '==', uid))),
    getDocs(query(collection(db, 'applications'), where('employerId', '==', uid))),
  ]);

  const appRefs = new Map();
  [...sentApps.docs, ...receivedApps.docs].forEach((d) => appRefs.set(d.id, d.ref));

  console.log(
    `  ${email}: ${ownedJobs.size} job(s), ${appRefs.size} application(s)` +
      (dry ? ' [dry run]' : '')
  );

  if (!dry) {
    for (const ref of appRefs.values()) await deleteDoc(ref);
    for (const d of ownedJobs.docs) await deleteDoc(doc(db, 'jobs', d.id));
  }
  jobsGone += ownedJobs.size;
  appsGone += appRefs.size;

  await signOut(auth);
}

async function main() {
  console.log(
    `${dry ? 'Reporting' : 'Clearing'} seeded content in ${env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}\n`
  );
  for (const account of ACCOUNTS) {
    try {
      await purge(account);
    } catch (e) {
      console.log(`  ${account.email}: SKIPPED (${e.code || e.message})`);
    }
  }

  const remaining = await getDocs(collection(db, 'jobs'));
  console.log(`\njobs removed: ${jobsGone}`);
  console.log(`applications removed: ${appsGone}`);
  console.log(`jobs remaining in the public feed: ${remaining.size}`);
  process.exit(0);
}

main().catch((e) => {
  console.error('failed:', e.code || '', e.message);
  process.exit(1);
});
