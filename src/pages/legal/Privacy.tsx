import { Link } from 'react-router-dom'
import { LEGAL } from '../../lib/legal'
import LegalPage, { Ext, Mail } from './LegalPage'

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary={
        <ul>
          <li>
            We only collect what YearlyBingos needs to work: your account, the cards and comments you make, and a
            record of the payment if you buy Premium.
          </li>
          <li>Public cards, their comments and your profile can be seen by anyone. Your email address is never shown.</li>
          <li>No ads, no analytics, no tracking cookies — and we never sell your data.</li>
          <li>You can edit or delete your content at any time, and ask us to delete your account.</li>
        </ul>
      }
    >
      <h2>1. Who we are</h2>
      <p>
        YearlyBingos is run by {LEGAL.operator}, based in Finland, who is the controller of your personal data under
        the EU General Data Protection Regulation (GDPR). For anything about your data, email <Mail />.
      </p>

      <h2>2. What we collect</h2>
      <h3>Your account</h3>
      <p>
        Your email address, username and — if you add them — a display name and a link to a profile picture. Your
        password is stored only as a secure hash by our sign-in provider; nobody at YearlyBingos can see it.
      </p>
      <h3>Signing in with Google or X</h3>
      <p>
        If you choose to sign in this way, the provider shares your name, email address and profile picture link with
        us, and we use them to set up your profile. We never get your password for those services.
      </p>
      <h3>What you create</h3>
      <p>
        Your cards (title, year, squares, which squares you’ve crossed off, colors, and whether the card is public or
        private), your comments, the cards you like, and when you did these things.
      </p>
      <h3>Payments</h3>
      <p>
        If you buy Premium, PayPal handles the payment. We keep the PayPal order and transaction IDs, the amount,
        currency, status and date, linked to your account. We never see or store your card or bank details.
      </p>
      <h3>Technical data</h3>
      <p>
        When you use the site, our hosting and database providers process technical data such as your IP address,
        browser type and request logs, so pages can be delivered and the service kept secure.
      </p>
      <h3>On your device</h3>
      <p>
        Your browser stores your sign-in session and your light/dark theme choice. See{' '}
        <Link to="/cookies">Cookies</Link>.
      </p>

      <h2>3. Why we use it</h2>
      <div className="table-wrap">
        <table className="legal-table">
          <thead>
            <tr>
              <th>Purpose</th>
              <th>Legal basis (GDPR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Running your account and the site: cards, comments, likes and your profile</td>
              <td>Contract — art. 6(1)(b)</td>
            </tr>
            <tr>
              <td>Selling and delivering Premium, and keeping payment records</td>
              <td>Contract and legal obligation — art. 6(1)(b) and (c)</td>
            </tr>
            <tr>
              <td>Keeping the service secure, preventing abuse and moderating content</td>
              <td>Legitimate interests — art. 6(1)(f)</td>
            </tr>
            <tr>
              <td>Suggesting popular squares as ideas when people make cards</td>
              <td>Legitimate interests — art. 6(1)(f)</td>
            </tr>
            <tr>
              <td>Answering your messages</td>
              <td>Legitimate interests — art. 6(1)(f)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>We don’t use your data for advertising or profiling, and we don’t make automated decisions about you.</p>

      <h2>4. What other people can see</h2>
      <ul>
        <li>
          <strong>Public cards</strong>, the comments on them, their like counts, and your <strong>profile</strong>{' '}
          (username, display name, profile picture, Premium badge and join date) can be seen by anyone, including
          people who aren’t signed in.
        </li>
        <li>
          <strong>Private cards</strong> and the comments on them are only visible to you.
        </li>
        <li>Squares that appear on the public cards of at least two different people may be suggested to others as ideas, without any names.</li>
        <li>
          Your <strong>email address</strong> is never shown to other users.
        </li>
      </ul>

      <h2>5. Who we share it with</h2>
      <p>Service providers that process data on our behalf, under data processing agreements:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — our database, sign-in, live updates and server functions (
          <Ext href="https://supabase.com/privacy">privacy policy</Ext>).
        </li>
        <li>
          <strong>Our web host</strong> — serves the website’s files.
        </li>
      </ul>
      <p>Services you choose to use, which handle your data under their own privacy policies:</p>
      <ul>
        <li>
          <strong>PayPal</strong> — Premium payments (
          <Ext href="https://www.paypal.com/webapps/mpp/ua/privacy-full">privacy statement</Ext>).
        </li>
        <li>
          <strong>Google</strong> and <strong>X</strong> — only if you sign in with them (
          <Ext href="https://policies.google.com/privacy">Google</Ext>, <Ext href="https://x.com/en/privacy">X</Ext>).
        </li>
      </ul>
      <p>
        The site’s fonts are loaded from <strong>Google Fonts</strong>, so your browser sends your IP address to Google
        when it downloads them (<Ext href="https://developers.google.com/fonts/faq/privacy">details</Ext>). Profile
        pictures are loaded from wherever they’re hosted, such as Google’s or X’s image servers.
      </p>
      <p>We may share data when the law requires it, for example with the authorities. We never sell your data.</p>

      <h2>6. Transfers outside the EU</h2>
      <p>
        Some of these providers are based in, or can access data from, the United States or other countries outside
        the EU/EEA. When that happens, the transfer is protected by safeguards the GDPR accepts, such as the European
        Commission’s Standard Contractual Clauses or the EU–US Data Privacy Framework.
      </p>

      <h2>7. How long we keep it</h2>
      <ul>
        <li>
          <strong>Account and profile:</strong> until you delete your account.
        </li>
        <li>
          <strong>Cards, comments and likes:</strong> until you delete them or your account.
        </li>
        <li>
          <strong>Payment records:</strong> as long as accounting and tax laws require.
        </li>
        <li>
          <strong>Technical logs:</strong> a short time, as set by our providers.
        </li>
        <li>
          <strong>Messages to us:</strong> as long as needed to deal with them.
        </li>
      </ul>
      <p>
        When your account is deleted, your profile, cards, comments and likes go with it. Copies in backups disappear
        as the backups are replaced.
      </p>

      <h2>8. Your rights</h2>
      <p>Under the GDPR you can:</p>
      <ul>
        <li>ask for a copy of your data;</li>
        <li>
          correct it — most of it you can edit yourself in <Link to="/settings">Settings</Link>;
        </li>
        <li>have it deleted — delete cards and comments yourself, or email us to delete your account;</li>
        <li>object to processing based on our legitimate interests, or ask us to restrict it;</li>
        <li>get your data in a machine-readable format to take it elsewhere.</li>
      </ul>
      <p>
        Email <Mail /> to use any of these rights. We’ll answer within one month, and may ask you to confirm it’s
        really you.
      </p>
      <p>
        You can also complain to a data protection authority. In Finland that’s the{' '}
        <Ext href="https://tietosuoja.fi/en">Office of the Data Protection Ombudsman</Ext>; you can also contact the
        authority in the country where you live.
      </p>

      <h2>9. Security</h2>
      <p>
        Everything travels over encrypted HTTPS connections, passwords are hashed, and database rules make sure people
        can only change their own data. No system is perfectly secure, but we take reasonable steps to protect yours.
      </p>

      <h2>10. Children</h2>
      <p>
        YearlyBingos isn’t meant for children under 13, and they shouldn’t create an account. If you’re under the age
        where you can agree to this yourself in your country, ask a parent or guardian first.
      </p>

      <h2>11. Changes</h2>
      <p>
        If we change this policy, we’ll update the date at the top. If the changes are important, we’ll also let you
        know on the site.
      </p>
    </LegalPage>
  )
}
