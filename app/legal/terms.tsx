import { LegalPage } from '../../src/LegalPage';
import { SUPPORT_EMAIL } from '../../src/config';

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="14 August 2026"
      intro="These terms cover your use of HireMe. By creating an account or posting on HireMe, you agree to them."
      sections={[
        {
          heading: 'Who can use HireMe',
          body: [
            'You must be at least 18 years old and legally able to work or hire in your area. One account per person.',
          ],
        },
        {
          heading: 'What HireMe is — and is not',
          body: [
            'HireMe is a listing service. We introduce employers and workers; we are not a party to any agreement you make, not an employment agency, and not your employer.',
            'We do not run background checks, verify licences, or vet the people you meet through the app, and we make no promise about anyone you find here. Agree terms in writing, meet somewhere sensible, and use your judgement.',
            'Payment happens directly between the employer and the worker. HireMe never handles, holds, or processes money, and takes no fee or commission.',
          ],
        },
        {
          heading: 'Rules for what you post',
          body: [
            'Post only genuine jobs and genuine applications, with honest pay and honest descriptions.',
            'Zero tolerance for objectionable content: no harassment, threats, hate speech, or slurs; no discriminatory job requirements; no sexual content; no scams, fake listings, or advance-fee requests; no illegal or unsafe work; no requests for anyone under 18.',
            'Do not post another person\'s private information, and do not impersonate anyone.',
          ],
        },
        {
          heading: 'Reporting and enforcement',
          body: [
            'Every job post and every applicant can be reported from inside the app, and you can block any account so its content disappears from your view.',
            'We review reports within 24 hours. Content that breaks these rules is removed and the account behind it is terminated. Serious cases are reported to the relevant authorities.',
            'We may remove content or suspend accounts without notice when we believe someone is being harmed.',
          ],
        },
        {
          heading: 'Your content',
          body: [
            'You keep ownership of what you post. You give HireMe permission to display it inside the app so the service can function.',
          ],
        },
        {
          heading: 'Ending your account',
          body: [
            'You can delete your account at any time from Profile — this permanently erases your posts and applications along with it.',
            'We may end your access if you break these terms.',
          ],
        },
        {
          heading: 'No warranty and limits',
          body: [
            'HireMe is provided as-is. We cannot guarantee that a job gets filled, that work gets paid, or that the service is always available.',
            'To the extent the law allows, HireMe is not liable for disputes, losses, injuries, or damages arising from arrangements made between users.',
          ],
        },
        {
          heading: 'Contact',
          body: [`Questions about these terms: ${SUPPORT_EMAIL}.`],
        },
      ]}
    />
  );
}
