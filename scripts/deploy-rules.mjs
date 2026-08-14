/**
 * Publishes firestore.rules to the Firebase project.
 *
 * Auth comes from the gcloud CLI, so no service-account key is stored in the repo:
 *   node scripts/deploy-rules.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const env = Object.fromEntries(
  readFileSync(join(root, '.env'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const project = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const source = readFileSync(join(root, 'firestore.rules'), 'utf8');

const token = execFileSync(
  'gcloud',
  ['auth', 'print-access-token'],
  { encoding: 'utf8', shell: true }
).trim();

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  // gcloud user credentials need an explicit billing/quota project.
  'x-goog-user-project': project,
};

async function call(method, url, body) {
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status}\n${text}`);
  return text ? JSON.parse(text) : {};
}

const base = `https://firebaserules.googleapis.com/v1/projects/${project}`;

const ruleset = await call('POST', `${base}/rulesets`, {
  source: { files: [{ name: 'firestore.rules', content: source }] },
});
console.log('ruleset created:', ruleset.name);

const releaseName = `projects/${project}/releases/cloud.firestore`;
try {
  const released = await call('PATCH', `${base}/releases/cloud.firestore`, {
    release: { name: releaseName, rulesetName: ruleset.name },
  });
  console.log('released:', released.rulesetName);
} catch {
  const released = await call('POST', `${base}/releases`, {
    name: releaseName,
    rulesetName: ruleset.name,
  });
  console.log('released:', released.rulesetName);
}
