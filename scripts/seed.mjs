/**
 * Seeds the HireMe Firestore project with a working marketplace:
 * employer accounts posting real jobs, worker accounts applying to them, and
 * the App Review account carrying content on both sides of the marketplace.
 *
 * Idempotent — re-running signs into the existing accounts and skips jobs that
 * are already there.
 *
 *   node scripts/seed.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const here = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(here, '..', '.env'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.includes('=') && !line.trimStart().startsWith('#'))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
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

const EMPLOYERS = [
  {
    email: 'ramirez.construction@hiremeapp.dev',
    name: 'Ramirez Construction',
    bio: 'Residential concrete and framing crew working across the Austin metro. 14 years in business.',
    phone: '(512) 555-0143',
  },
  {
    email: 'quickmove@hiremeapp.dev',
    name: 'QuickMove LLC',
    bio: 'Local moving company. We book the truck, you bring the muscle.',
    phone: '(512) 555-0177',
  },
  {
    email: 'greenleaf@hiremeapp.dev',
    name: 'GreenLeaf Landscaping',
    bio: 'Yard maintenance, mulch, and seasonal cleanups for homes and small commercial lots.',
    phone: '(512) 555-0198',
  },
  {
    email: 'brighthome@hiremeapp.dev',
    name: 'BrightHome Cleaning',
    bio: 'Move-out and turnover cleaning for property managers. Supplies always provided.',
    phone: '(512) 555-0121',
  },
];

const WORKERS = [
  {
    email: 'marcus.day@hiremeapp.dev',
    name: 'Marcus Delgado',
    bio: 'Six years on framing and concrete crews. Own tools, own truck, OSHA 10 card.',
    phone: '(512) 555-0166',
  },
  {
    email: 'tina.reyes@hiremeapp.dev',
    name: 'Tina Reyes',
    bio: 'Warehouse and delivery work. Forklift certified, available weekday mornings.',
    phone: '(512) 555-0155',
  },
  {
    email: 'devon.hart@hiremeapp.dev',
    name: 'Devon Hart',
    bio: 'Landscaping and cleanup crews. Reliable, early riser, comfortable with heavy lifting.',
    phone: '(512) 555-0134',
  },
];

const REVIEWER = {
  email: 'appreview@hiremeapp.dev',
  name: 'Alex Rivera',
  bio: 'General labor, moving, and warehouse work. Available most weekdays around Austin.',
  phone: '(512) 555-0100',
};

const day = 24 * 60 * 60 * 1000;
const now = Date.now();
const inDays = (n) => new Date(now + n * day).toISOString().slice(0, 10);

/** Jobs posted by the seeded employers, keyed by employer email. */
const JOBS = [
  {
    by: 'ramirez.construction@hiremeapp.dev',
    title: 'Concrete pour helpers needed',
    description:
      'Need 3 laborers for a residential driveway pour. Must be able to lift 50 lbs and work a full day on your feet. Tools, gloves, and water provided. Start time 7:00 AM.',
    category: 'Construction',
    payRate: 22,
    payType: 'hourly',
    location: 'Austin, TX',
    date: inDays(3),
    age: 1,
  },
  {
    by: 'ramirez.construction@hiremeapp.dev',
    title: 'Warehouse loading crew',
    description:
      'Unload two shipping containers and organise stock on pallets. 4-6 hours of work. Steel-toe boots required, no experience necessary.',
    category: 'Warehouse',
    payRate: 20,
    payType: 'hourly',
    location: 'Austin, TX',
    date: inDays(5),
    age: 2,
  },
  {
    by: 'ramirez.construction@hiremeapp.dev',
    title: 'Framing helper — two-day job',
    description:
      'Assisting a framing crew on a garage addition. Carrying lumber, cutting to measure, cleaning the site at the end of each day. Two consecutive days.',
    category: 'Construction',
    payRate: 190,
    payType: 'daily',
    location: 'Georgetown, TX',
    date: inDays(8),
    age: 3,
  },
  {
    by: 'quickmove@hiremeapp.dev',
    title: 'Apartment move — 2 movers',
    description:
      'Moving a 2-bedroom apartment across town. Roughly 5 hours. Some heavy furniture including a sleeper sofa. Truck is already booked, we just need the hands.',
    category: 'Moving',
    payRate: 140,
    payType: 'fixed',
    location: 'Round Rock, TX',
    date: inDays(2),
    age: 1,
  },
  {
    by: 'quickmove@hiremeapp.dev',
    title: 'Office relocation — weekend crew',
    description:
      'Small office relocation on Saturday. Desks, filing cabinets, and about 40 boxes. Dolly and straps provided. Lunch included.',
    category: 'Moving',
    payRate: 25,
    payType: 'hourly',
    location: 'Austin, TX',
    date: inDays(6),
    age: 4,
  },
  {
    by: 'quickmove@hiremeapp.dev',
    title: 'Furniture delivery assistant',
    description:
      'Ride along on a delivery route and help carry furniture into homes. Valid ID required. Roughly 6 hours, route ends back at the warehouse.',
    category: 'Delivery',
    payRate: 19,
    payType: 'hourly',
    location: 'Pflugerville, TX',
    date: inDays(4),
    age: 2,
  },
  {
    by: 'greenleaf@hiremeapp.dev',
    title: 'Yard cleanup + mulch spreading',
    description:
      'Full day of yard work: hauling brush to the trailer, spreading 4 yards of mulch, trimming hedges along the fence line. Gloves recommended, tools provided.',
    category: 'Landscaping',
    payRate: 160,
    payType: 'daily',
    location: 'Cedar Park, TX',
    date: inDays(3),
    age: 3,
  },
  {
    by: 'greenleaf@hiremeapp.dev',
    title: 'Sod installation crew — 2 needed',
    description:
      'Laying sod on a front and back lawn, about 3,000 sq ft total. Physical work in the sun, shade breaks every hour. Water and lunch provided.',
    category: 'Landscaping',
    payRate: 170,
    payType: 'daily',
    location: 'Leander, TX',
    date: inDays(7),
    age: 5,
  },
  {
    by: 'greenleaf@hiremeapp.dev',
    title: 'Fence panel replacement helper',
    description:
      'Replacing 12 damaged cedar fence panels. Pulling old panels, setting new ones, hauling the debris. One day, tools supplied.',
    category: 'General',
    payRate: 165,
    payType: 'daily',
    location: 'Cedar Park, TX',
    date: inDays(9),
    age: 6,
  },
  {
    by: 'brighthome@hiremeapp.dev',
    title: 'Deep clean — move-out',
    description:
      'Move-out deep clean of a 3-bed house. Supplies provided. Real attention to detail needed on the kitchen appliances and both bathrooms.',
    category: 'Cleaning',
    payRate: 18,
    payType: 'hourly',
    location: 'Pflugerville, TX',
    date: inDays(2),
    age: 2,
  },
  {
    by: 'brighthome@hiremeapp.dev',
    title: 'Post-construction cleanup',
    description:
      'Clearing dust and debris from a newly finished remodel before handover. Shop vac, window cleaning, wiping down trim. About 7 hours.',
    category: 'Cleaning',
    payRate: 21,
    payType: 'hourly',
    location: 'Austin, TX',
    date: inDays(5),
    age: 4,
  },
  {
    by: 'brighthome@hiremeapp.dev',
    title: 'Interior painting assistant',
    description:
      'Helping a painter prep and roll two bedrooms and a hallway. Taping, drop cloths, cutting in, and cleanup. Prior painting experience preferred but not required.',
    category: 'Painting',
    payRate: 20,
    payType: 'hourly',
    location: 'Round Rock, TX',
    date: inDays(6),
    age: 5,
  },
];

/** Jobs posted by the App Review account so the employer side has content. */
const REVIEWER_JOBS = [
  {
    title: 'Garage cleanout — one day',
    description:
      'Two-car garage cleanout. Sorting, hauling items to the curb, and sweeping out at the end. Dumpster is already on site.',
    category: 'General',
    payRate: 150,
    payType: 'fixed',
    location: 'Austin, TX',
    date: inDays(4),
    age: 2,
  },
  {
    title: 'Help unloading a moving truck',
    description:
      'Need two people for about three hours to unload a 20 ft truck into a ground-floor apartment. Straps and dollies provided.',
    category: 'Moving',
    payRate: 24,
    payType: 'hourly',
    location: 'Austin, TX',
    date: inDays(3),
    age: 1,
  },
];

async function ensureAccount({ email, name, bio, phone }, role) {
  let uid;
  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      email,
      email === REVIEWER.email ? REVIEW_PASSWORD : PASSWORD
    );
    await updateProfile(cred.user, { displayName: name });
    uid = cred.user.uid;
    console.log(`  created ${email}`);
  } catch (e) {
    if (e.code !== 'auth/email-already-in-use') throw e;
    const cred = await signInWithEmailAndPassword(
      auth,
      email,
      email === REVIEWER.email ? REVIEW_PASSWORD : PASSWORD
    );
    uid = cred.user.uid;
    console.log(`  reusing ${email}`);
  }

  await setDoc(
    doc(db, 'users', uid),
    { name, role, bio, phone, acceptedTermsAt: Date.now(), createdAt: Date.now() },
    { merge: true }
  );
  return uid;
}

async function postJobsAs(account, role, jobs, employerName, uid) {
  const existing = await getDocs(
    query(collection(db, 'jobs'), where('employerId', '==', uid))
  );
  const titles = new Set(existing.docs.map((d) => d.data().title));

  const created = [];
  for (const job of jobs) {
    if (titles.has(job.title)) {
      const match = existing.docs.find((d) => d.data().title === job.title);
      created.push({ id: match.id, title: job.title, employerId: uid });
      continue;
    }
    const { by, age, ...fields } = job;
    const ref = await addDoc(collection(db, 'jobs'), {
      ...fields,
      employerId: uid,
      employerName,
      status: 'open',
      createdAt: now - (age ?? 1) * day,
    });
    created.push({ id: ref.id, title: job.title, employerId: uid });
    console.log(`    posted "${job.title}"`);
  }
  return created;
}

/**
 * Applications can only be created as 'pending' (the rules enforce it), so the
 * accepted/rejected states are applied afterwards while signed in as employer.
 */
async function applyAs(uid, name, job, message) {
  const existing = await getDocs(
    query(
      collection(db, 'applications'),
      where('workerId', '==', uid),
      where('jobId', '==', job.id)
    )
  );
  if (!existing.empty) return existing.docs[0].id;
  const ref = await addDoc(collection(db, 'applications'), {
    jobId: job.id,
    employerId: job.employerId,
    workerId: uid,
    workerName: name,
    message,
    status: 'pending',
    createdAt: now - day,
  });
  console.log(`    ${name} -> "${job.title}"`);
  return ref.id;
}

async function main() {
  console.log(`Seeding project ${env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}\n`);

  const employerJobs = [];
  const employerEmailByUid = new Map();
  console.log('Employers:');
  for (const employer of EMPLOYERS) {
    const uid = await ensureAccount(employer, 'employer');
    employerEmailByUid.set(uid, employer.email);
    const mine = JOBS.filter((j) => j.by === employer.email);
    const posted = await postJobsAs(employer, 'employer', mine, employer.name, uid);
    employerJobs.push(...posted);
    await signOut(auth);
  }

  console.log('\nApp Review account:');
  const reviewerUid = await ensureAccount(REVIEWER, 'worker');
  const reviewerPosted = await postJobsAs(
    REVIEWER,
    'worker',
    REVIEWER_JOBS,
    REVIEWER.name,
    reviewerUid
  );

  // The reviewer has already applied to three jobs, one of each status.
  const targets = employerJobs.slice(0, 3);
  const messages = [
    "I've done concrete work for the last six years and can start at 7 AM. I have my own boots and gloves.",
    'Available all week and comfortable with heavy furniture. I moved apartments professionally for two summers.',
    'I can bring my own trimmer and rake. Happy to start early to beat the heat.',
  ];
  const statuses = ['accepted', 'pending', 'rejected'];
  console.log('  applications sent by the reviewer:');
  const decisions = [];
  for (let i = 0; i < targets.length; i += 1) {
    const applicationId = await applyAs(
      reviewerUid,
      REVIEWER.name,
      targets[i],
      messages[i]
    );
    if (statuses[i] !== 'pending') {
      decisions.push({
        applicationId,
        employerId: targets[i].employerId,
        status: statuses[i],
      });
    }
  }
  await signOut(auth);

  // Employers respond, so the reviewer sees accepted and rejected states too.
  console.log('  employers responding:');
  for (const decision of decisions) {
    const email = employerEmailByUid.get(decision.employerId);
    if (!email) continue;
    await signInWithEmailAndPassword(auth, email, PASSWORD);
    await updateDoc(doc(db, 'applications', decision.applicationId), {
      status: decision.status,
    });
    console.log(`    ${email} -> ${decision.status}`);
    await signOut(auth);
  }

  console.log('\nWorkers applying to the reviewer\'s postings:');
  const workerMessages = [
    'I can be there at 8 and stay until the job is done. I have a truck if anything needs hauling.',
    'Forklift certified and used to warehouse loads. Available that morning.',
    "I've done a lot of cleanouts. I'm quick, careful with walls and doorframes, and I clean up after.",
  ];
  for (let i = 0; i < WORKERS.length; i += 1) {
    const worker = WORKERS[i];
    const uid = await ensureAccount(worker, 'worker');
    const job = reviewerPosted[i % reviewerPosted.length];
    await applyAs(uid, worker.name, job, workerMessages[i]);
    await signOut(auth);
  }

  console.log('\nDone.');
  console.log(`App Review login: ${REVIEWER.email} / ${REVIEW_PASSWORD}`);
  process.exit(0);
}

main().catch((e) => {
  console.error('\nSeed failed:', e.code || '', e.message);
  process.exit(1);
});
