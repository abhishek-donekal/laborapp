# HireMe

A marketplace for **day labor** — employers post jobs, workers apply. Built with
Expo (React Native) + Expo Router + TypeScript, backed by Firebase.

Two roles, one account:

- **Workers** browse open jobs, filter by category, and apply with a message.
- **Employers** post jobs, review applicants, and accept or reject them.

Anyone can switch between the two from their profile.

## Platforms

| Platform | Sign-in | Status |
|---|---|---|
| iOS | Email + password, or browse as a guest | App Store submission |
| Web | Adds Google and Facebook sign-in (popup OAuth) | Vercel |
| Android | Email + password | Not released |

Google and Facebook sign-in are web-only on purpose: popup OAuth does not work
in a native build, and offering third-party login on iOS would require Sign in
with Apple alongside it (App Store guideline 4.8).

## Data

Jobs and applications live in **Cloud Firestore**, so every device sees the same
marketplace. The last 60 jobs are cached on-device so the feed still renders
offline. Accounts are Firebase Authentication.

Collections:

| Collection | Who can read | Who can write |
|---|---|---|
| `jobs` | anyone, including signed-out guests | the employer who posted it |
| `applications` | the worker who sent it and the employer who received it | worker creates, employer decides |
| `users` | only you | only you |
| `reports` | nobody in the app | any signed-in user can file one |

Rules live in `firestore.rules` and are the source of truth — the client trusts
nothing.

## Safety

Job posts and applications are user-generated, so the app ships with:

- **Report** on every job post and every applicant, with a reason picker
- **Block**, which hides that account's jobs and applications everywhere
- A content agreement that must be ticked before a job can be posted
- **Account deletion** in Profile, which erases the profile, posts, and
  applications together

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the Firebase web config
npm start
```

Press `i` for iOS, `a` for Android, or `w` for web.

## Scripts

| Command | What it does |
|---|---|
| `node scripts/deploy-rules.mjs` | Publishes `firestore.rules` (auth via the gcloud CLI) |
| `node scripts/seed.mjs` | Seeds employers, workers, jobs, and the App Review account |
| `npx tsc --noEmit` | Type-checks |
| `npx expo export --platform web` | Builds the web bundle Vercel serves |

## Project structure

```
app/                 # Expo Router routes
  _layout.tsx        # providers + hydration gate
  index.tsx          # auth redirect
  login.tsx          # email/password, guest entry, web-only social
  onboarding.tsx     # pick worker or employer
  legal/             # privacy policy + terms
  (tabs)/            # main app (role-aware tabs)
    index.tsx        # job feed / my postings
    post.tsx         # post a job (employer)
    applications.tsx # my applications (worker)
    profile.tsx      # profile, role switch, blocks, account deletion
  job/[id].tsx       # job detail: apply / manage applicants / report
src/
  store.tsx          # auth + app state
  data.ts            # Firestore reads and writes
  firebase.ts        # SDK initialisation
  config.ts          # support email, app name, minimum age
  types.ts           # domain models
  components.tsx     # Button, Badge, Card, Field, EmptyState
  LegalPage.tsx      # shared chrome for the legal screens
  JobCard.tsx        # shared job list item
  format.ts          # pay / date / time helpers
  theme.ts           # colors, spacing, typography
```

## Roadmap

- Push notifications on new applicants and status changes
- In-app messaging between worker and employer
- Ratings and reviews
- Location-based discovery (maps + distance)
