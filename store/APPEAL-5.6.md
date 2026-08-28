# Reply to App Review — Guideline 5.6 (Developer Code of Conduct)

App: HireMe: Day Labor Jobs · 6803748819 · com.rkdtech.hireme · build 1.0.0 (3)
Submission: 39970e73-9ea3-44b2-9f53-4a7a1f309215

Paste the body below into **Reply to App Review**. It is written to be accurate — every
claim in it is verifiable in the binary and the account history.

---

Dear App Review Team,

Thank you for reviewing HireMe: Day Labor Jobs. There are no hidden features, no
undisclosed code paths, and no functionality that behaves differently from what the
listing describes. Below is a complete account of the app, and proactive disclosure of
the three things we think may have prompted this flag.

**What the app is**

HireMe is a listing board for day labor. Employers post short-term jobs; workers browse
those jobs and apply with a written message. The employer accepts or rejects each
applicant. That is the entire product.

**Complete feature list — this is everything the app does**

- Browse open jobs, filter by eight categories, search by title, location, or description
- Browse without an account; an account is required only to apply or to post
- Post a job (category, pay rate, pay type, location, date needed)
- Apply to a job with a written message
- Employer reviews applicants and accepts or rejects them; employer can close or delete a post
- One account can switch between the worker and employer sides from Profile
- Report and Block on every job post and every applicant
- Edit profile (phone, short bio); delete account, which erases the profile, posts, and applications

There is no messaging or chat feature, no payment of any kind, no in-app purchase, no
subscription, no advertising, no analytics or tracking SDK, and no third-party SDK beyond
Google Firebase (Authentication and Cloud Firestore). The app requests no device
permissions: no location, camera, photos, contacts, or notifications. Employers and
workers arrange and settle payment directly between themselves, outside the app.

**Disclosure 1 — code in the binary that is intentionally unreachable on iOS**

The app shares a codebase with our web version. Google and Facebook sign-in are offered
on the web only. Their code is therefore present in the shipped binary but is gated off
on iOS by a platform check, so those buttons never appear and those paths never execute
on an iOS device. We disabled them deliberately: they use popup OAuth, which does not
work in a native build, and offering third-party login on iOS would require us to offer
Sign in with Apple alongside it under Guideline 4.8. iOS sign-in is email and password
only. If you would prefer the code removed from the iOS bundle entirely rather than
gated, we will do that and upload a new build.

**Disclosure 2 — why this app moved to a new account and bundle ID**

An earlier version of this app was submitted from the individual developer account of
Abhishek Donekal (com.abhishekdonekal.hireme) and was rejected. We then moved our
development to RKD Tech Group LLC, our registered company, and resubmitted from the
organization account under com.rkdtech.hireme.

This was a business change, not an attempt to avoid a review decision. RKD Tech Group LLC
is the entity that now owns our apps, and our other apps were moved to the same account
in the same period. Because the earlier app had never been released, Apple's App Transfer
was not available to us, so a new record and bundle ID were the only route. The old record
has been renamed "HireMe Archived", its submission cancelled, and it will not be
resubmitted. We are happy to have it deleted if that helps.

If our earlier rejection raised an issue we have not addressed here, we would be grateful
if you could restate it, and we will fix it before resubmitting.

**Disclosure 3 — we have removed the demonstration listings**

The app has not launched and has no real users. Our earlier submission included sample job
posts attributed to example employer accounts, so that the review flow could be exercised
rather than showing an empty screen. On reflection those posts could be read as real job
offers, which is not acceptable to us either, so we have deleted all of them. The
marketplace is now empty, as an unlaunched marketplace should be.

The review notes for this version have been rewritten to match, and now include a short
sequence that lets you create a job and apply to it yourself using the single demo
account, which can act as both employer and worker. It takes under a minute and exercises
the entire product.

**Demo account**

    Email:    appreview@hiremeapp.dev
    Password: HireMe#Review26

The account is a worker by default and holds three applications already sent, one
accepted, one pending, one rejected. To see the employer side, open Profile and tap
"Switch to hiring"; the account has two of its own job posts with three applicants
between them. Report and Block appear beneath the apply panel on any job page and on
every applicant row. Account deletion is at the bottom of Profile.

We are glad to supply a video walkthrough of any flow, or additional accounts, if that
would help. Please tell us what would be most useful.

Best regards,
Abhishek Donekal
RKD Tech Group LLC
info@rkdtechgroup.com
