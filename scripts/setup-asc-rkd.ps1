# Replays the full App Store listing onto the RKD Tech Group record.
#   powershell -File scripts/setup-asc-rkd.ps1 -AppId <NEW_ASC_APP_ID>
# Assumes the asc default profile is rkd-tech-group.
param([Parameter(Mandatory = $true)][string]$AppId)
$ErrorActionPreference = 'Continue'

$desc = @'
HireMe connects people who need hands today with people looking for paid work.

Need help? Post the job in under a minute - what the work is, where it is, what it pays, and when you need someone. Applications come straight to you, and you decide who gets the job.

Looking for work? Browse every open job near you, filter by the kind of work you do, and apply with a short message about why you are a good fit. Track every application in one place and see the moment an employer accepts you.

FOR WORKERS
- Browse open jobs without creating an account
- Filter by Construction, Moving, Cleaning, Landscaping, Warehouse, Painting, Delivery, or General
- Search by job title, location, or description
- See the pay up front - hourly, daily, or a flat rate
- Apply with a message and track accepted, pending, and rejected applications

FOR EMPLOYERS
- Post a job with the category, pay, location, and date you need someone
- Read every applicant message before you decide
- Accept or reject with one tap
- Close a job when it is filled, or delete it entirely

ONE ACCOUNT, BOTH SIDES
Switch between finding work and hiring help from your profile whenever you need to. You are not locked into the choice you made when you signed up.

NO FEES, EVER
HireMe takes no commission and charges nothing. There is nothing to buy in the app. Employers and workers agree the pay and settle it directly between themselves.

SAFETY
Every job post and every applicant can be reported from inside the app, and you can block any account so their posts and messages disappear from your view. Reports are reviewed within 24 hours and accounts that break the rules are removed. You can delete your account, and everything you posted, at any time from your profile.

HireMe is a listing service. We introduce employers and workers - we are not an employment agency, we do not handle payments, and we do not run background checks. Agree the terms in writing and use your judgement.
'@

$notes = @'
HireMe is a free marketplace for day labor. There are no in-app purchases, no subscriptions, and no payments of any kind inside the app - employers and workers settle payment directly between themselves.

Sign in with the demo account above. It is seeded with real content on both sides of the marketplace.

1. JOBS TAB - 14 open jobs posted by four employer accounts, searchable and filterable by category. The feed is also visible without signing in: tap Browse jobs on the sign-in screen.

2. JOB DETAIL - tap any job. As a worker you can apply with a message. Jobs you already applied to show the employer decision.

3. APPLIED TAB - the demo account has three applications already sent, one of each state: accepted, pending, and rejected.

4. PROFILE TAB - edit your details, then tap Switch to hiring to become an employer. The tabs change to My Jobs and Post.

5. AS AN EMPLOYER - the demo account has two of its own job posts with three applicants between them. Open either post to read applicant messages and accept or reject them.

6. MODERATION (guideline 1.2) - every job page has Report this job and Block employer beneath the apply panel, and every applicant row has Report and Block this person. Blocked accounts disappear from the feed and from applications. Posting a job requires ticking a content agreement.

7. ACCOUNT DELETION (guideline 5.1.1 v) - Profile then Delete my account. Confirming with the password permanently erases the account, its job posts, and its applications. Please use a throwaway account rather than the demo one if you want to test this end to end.

Sign-in is email and password only on iOS. Google and Facebook sign-in appear on the web version only, so no third-party login service is offered in this app.

The app requests no device permissions: no location, camera, photos, contacts, or notifications.
'@

$promo = 'Post a job in under a minute, or find paid work near you today. Free for workers and employers, with no fees, no commission, and no middleman.'
$kw = 'day labor,gig work,hire,jobs,construction,moving,cleaning,landscaping,handyman,odd jobs,local work'
$url = 'https://laborapp-blue.vercel.app'

function Step($label, $ok) {
  if ($ok) { Write-Output "  OK   $label" } else { Write-Output "  FAIL $label" }
}

Write-Output "== resolving version for app $AppId =="
$vers = asc versions list --app $AppId 2>&1 | Out-String | ConvertFrom-Json
$ver = $vers.data | Where-Object { $_.attributes.versionString -eq '1.0' } | Select-Object -First 1
if (-not $ver) { $ver = $vers.data | Select-Object -First 1 }
$verId = $ver.id
Write-Output "version id: $verId"

Write-Output "== app-info: name, subtitle, privacy url =="
$r = asc localizations update --app $AppId --type app-info --locale en-US --name 'HireMe: Day Labor Jobs' --subtitle 'Day labor jobs, hire or work' --privacy-policy-url "$url/legal/privacy" 2>&1 | Out-String
Step 'app-info localization' ($r -match '"id"')

Write-Output "== version localization =="
$r = asc localizations update --version $verId --locale en-US --description $desc --keywords $kw --promotional-text $promo --support-url $url --marketing-url $url 2>&1 | Out-String
Step 'version localization' ($r -match '"id"')

Write-Output "== copyright =="
$r = asc versions update --version-id $verId --copyright '2026 RKD Tech Group LLC' 2>&1 | Out-String
Step 'copyright' ($r -match 'versionString|"id"')

Write-Output "== age rating: all none, UGC true, 18+ =="
asc age-rating edit --app $AppId --all-none 2>&1 | Out-Null
$r = asc age-rating edit --app $AppId --user-generated-content true --age-rating-override-v2 EIGHTEEN_PLUS 2>&1 | Out-String
Step 'age rating' ($r -match 'userGeneratedContent')

Write-Output "== categories =="
$r = asc categories set --app $AppId --primary BUSINESS --secondary PRODUCTIVITY 2>&1 | Out-String
Step 'categories' ($r -match '"id"')

Write-Output "== content rights =="
$r = asc apps content-rights edit --app $AppId --uses-third-party-content=false 2>&1 | Out-String
if (-not ($r -match 'DOES_NOT_USE_THIRD_PARTY_CONTENT')) {
  $r = asc apps update --id $AppId --content-rights DOES_NOT_USE_THIRD_PARTY_CONTENT 2>&1 | Out-String
}
Step 'content rights' ($r -match 'DOES_NOT_USE_THIRD_PARTY_CONTENT')

Write-Output "== review details, demo account required =="
$r = asc review details-create --version-id $verId --contact-first-name 'Abhishek' --contact-last-name 'Donekal' --contact-email 'info@rkdtechgroup.com' --contact-phone '7863342880' --demo-account-required true --demo-account-name 'appreview@hiremeapp.dev' --demo-account-password 'HireMe#Review26' --notes $notes 2>&1 | Out-String
if (-not ($r -match '"id"')) {
  $d = asc review details-for-version --version-id $verId 2>&1 | Out-String | ConvertFrom-Json
  if ($d.data.id) {
    $r = asc review details-update --id $d.data.id --contact-first-name 'Abhishek' --contact-last-name 'Donekal' --contact-email 'info@rkdtechgroup.com' --contact-phone '7863342880' --demo-account-required true --demo-account-name 'appreview@hiremeapp.dev' --demo-account-password 'HireMe#Review26' --notes $notes 2>&1 | Out-String
  }
}
Step 'review details' ($r -match '"id"')

# Long text passed to a native CLI truncates silently on an embedded quote, with
# no error. Read the values back and compare lengths rather than trusting write.
Write-Output "== verify stored text was not truncated =="
$d = asc review details-for-version --version-id $verId 2>&1 | Out-String | ConvertFrom-Json
$l = asc localizations list --version $verId 2>&1 | Out-String | ConvertFrom-Json
$enUS = $l.data | Where-Object { $_.attributes.locale -eq 'en-US' }
$storedNotes = [int]$d.data.attributes.notes.Length
$storedDesc = [int]$enUS.attributes.description.Length
Write-Output "  notes stored $storedNotes chars, expected $($notes.Length)"
Write-Output "  desc  stored $storedDesc chars, expected $($desc.Length)"
if ($storedNotes -lt ($notes.Length - 50)) { Write-Output '  !! NOTES TRUNCATED - fix before submitting' }
if ($storedDesc -lt ($desc.Length - 50)) { Write-Output '  !! DESCRIPTION TRUNCATED - fix before submitting' }

Write-Output "== screenshots, must be 24-bit RGB with no alpha =="
$v = asc screenshots validate --path 'store/screenshots' --device-type IPHONE_69 2>&1 | Out-String
Write-Output ('  validate errorCount: ' + ($(if ($v -match '"errorCount":(\d+)') { $Matches[1] } else { '?' })))
$r = asc screenshots upload --version-localization $enUS.id --path 'store/screenshots' --device-type IPHONE_69 2>&1 | Out-String
Step 'screenshots upload' ($r -match '"uploaded":6')

Write-Output ''
Write-Output "== validate =="
asc validate --app $AppId --version '1.0' 2>&1 | Out-String | ConvertFrom-Json | ForEach-Object {
  "errors: $($_.summary.errors)  blocking: $($_.summary.blocking)"
  $_.remediation.steps | ForEach-Object { "  - [$($_.checkId)] $($_.message)" }
}
