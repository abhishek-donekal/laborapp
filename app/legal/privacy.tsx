import { LegalPage } from '../../src/LegalPage';
import { SUPPORT_EMAIL } from '../../src/config';

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="14 August 2026"
      intro="HireMe connects people who need day labor with people looking for work. This policy explains exactly what we collect, why we collect it, and how you can get rid of it."
      sections={[
        {
          heading: 'What we collect',
          body: [
            'Account details: your name, email address, and the password you choose. Passwords are handled by Google Firebase Authentication and are never visible to us.',
            'Profile details you choose to add: a phone number and a short description of your business, skills, or availability. Both are optional.',
            'Content you create: job posts, applications you send, and the messages inside them.',
            'Basic technical data needed to run the service, such as error reports and the timestamps on your posts.',
          ],
        },
        {
          heading: 'What we do not collect',
          body: [
            'We do not collect your device location. We do not access your camera, photos, contacts, microphone, or health data. We do not track you across other apps or websites, and we do not use advertising identifiers.',
          ],
        },
        {
          heading: 'How your information is used',
          body: [
            'To show your job posts to workers, and to deliver your applications to the employer you applied to.',
            'To keep the marketplace safe: reviewing reports of abusive or fraudulent content, and enforcing blocks.',
            'We do not sell your data, we do not share it with advertisers, and we do not use it to build advertising profiles.',
          ],
        },
        {
          heading: 'Who can see what',
          body: [
            'Job posts are public — anyone using HireMe, including people browsing without an account, can see them along with the employer name on the post.',
            'An application is visible only to you and to the employer who posted that job.',
            'Your email address is never shown to other users.',
          ],
        },
        {
          heading: 'Where your data lives',
          body: [
            'HireMe runs on Google Firebase (Authentication and Cloud Firestore), which stores data on Google Cloud infrastructure and acts as our data processor. Their handling of that data is covered by the Firebase Data Processing Terms.',
          ],
        },
        {
          heading: 'Deleting your account and data',
          body: [
            'Open Profile and tap "Delete my account". Confirming permanently removes your account, your profile, every job you posted, and every application you sent or received. The deletion happens immediately and cannot be undone.',
            `You can also email ${SUPPORT_EMAIL} and we will delete your account for you.`,
          ],
        },
        {
          heading: 'Children',
          body: [
            'HireMe is for adults arranging paid work and is not directed at children. You must be 18 or older to create an account.',
          ],
        },
        {
          heading: 'Changes and contact',
          body: [
            'If this policy changes in a way that affects you, we will update the date at the top and note the change in the app.',
            `Questions, requests, or complaints: ${SUPPORT_EMAIL}.`,
          ],
        },
      ]}
    />
  );
}
