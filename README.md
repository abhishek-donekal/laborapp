# laborapp

A mobile marketplace for hiring **day laborers** — and finding work. Built with Expo (React Native) + Expo Router + TypeScript.

Two roles, one app:

- **Workers** browse open jobs, filter by category, and apply with a message.
- **Employers** post jobs, review applicants, and accept or reject them.

State is persisted on-device with AsyncStorage. No backend yet — the data layer is isolated in `src/store.tsx` so a real API (e.g. Supabase) can slot in later.

## Features

- Role-based onboarding (worker / employer)
- Job feed with search + category filters
- Job detail with apply flow
- Employer posting form (title, description, category, pay type/rate, location, date)
- Applicant management (accept / reject, close job)
- Editable profile with activity stats
- Persistent local storage across app restarts

## Getting started

```bash
npm install
npm start
```

Then press `a` (Android), `i` (iOS, macOS only), or scan the QR code with the **Expo Go** app.

## Project structure

```
app/                 # Expo Router routes
  _layout.tsx        # root: providers + hydration gate
  index.tsx          # auth redirect
  login.tsx          # name + role select
  (tabs)/            # main app (role-aware tabs)
    index.tsx        # job feed / my postings
    post.tsx         # post a job (employer)
    applications.tsx # my applications (worker)
    profile.tsx
  job/[id].tsx       # job detail: apply / manage applicants
src/
  store.tsx          # global state (auth, jobs, applications) + persistence
  types.ts           # domain models
  mockData.ts        # seed jobs
  components.tsx     # Button, Badge, Card, Field, EmptyState
  JobCard.tsx        # shared job list item
  format.ts          # pay / date / time helpers
  theme.ts           # colors, spacing, typography
```

## Roadmap

- Real auth + backend (Supabase / Postgres)
- Push notifications on new applicants / status changes
- In-app messaging between worker and employer
- Ratings & reviews
- Location-based job discovery (maps + distance)
- Payments

---

Demo app — data stays on device. Not production auth.
