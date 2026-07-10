# Enabling Google login (Firebase)

The app runs in **demo mode** until Firebase is configured. Once these steps are
done, a **Continue with Google** button appears and profiles sync to Firestore.

## 1. Create a Firebase project

1. Go to <https://console.firebase.google.com> → **Add project**.
2. Name it (e.g. `laborapp`), finish the wizard.

## 2. Add a Web app

1. Project Overview → **</>** (Add web app).
2. Register the app. Copy the `firebaseConfig` values shown.

## 3. Enable Google sign-in

1. Build → **Authentication** → **Get started**.
2. **Sign-in method** tab → **Google** → Enable → set a support email → Save.

## 4. Authorize your domains

Authentication → **Settings** → **Authorized domains** → add:

- `localhost`
- your Vercel domain, e.g. `laborapp-blue.vercel.app`

(Google popup sign-in is rejected on domains not in this list.)

## 5. Create Firestore

Build → **Firestore Database** → **Create database** → Start in production mode.
Then set rules so a user can read/write only their own profile:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 6. Set the config values

**Local:** copy `.env.example` to `.env` and paste your values:

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=laborapp-xxxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=laborapp-xxxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=laborapp-xxxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

**Vercel (for the live site):** add the same 6 variables in
Project → Settings → Environment Variables (Production), then redeploy:

```
vercel deploy --prod
```

## Notes

- Google popup sign-in is wired for **web**. Native (Expo Go / device builds)
  needs `expo-auth-session` + native OAuth clients — not included yet.
- Jobs and applications are still stored **on-device**. Only auth + profile use
  Firebase in this pass. Moving jobs/applications to Firestore is the next step.
