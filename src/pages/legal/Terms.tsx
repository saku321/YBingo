import { Link } from 'react-router-dom'
import { FREE_BOARD_LIMIT, PREMIUM_PRICE } from '../../lib/bingo'
import { LEGAL } from '../../lib/legal'
import LegalPage, { Ext, Mail } from './LegalPage'

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      summary={
        <ul>
          <li>YearlyBingos is a game for fun — nothing here is advice or betting.</li>
          <li>What you post stays yours, and you’re responsible for it. Be decent.</li>
          <li>Premium is a one-time purchase. Changed your mind? Full refund within 14 days.</li>
        </ul>
      }
    >
      <h2>1. About these terms</h2>
      <p>
        These terms apply when you use YearlyBingos, which is run by {LEGAL.operator} in Finland. By using the site or
        creating an account you agree to them. If you don’t agree, please don’t use YearlyBingos. How we handle
        personal data is explained in the <Link to="/privacy">Privacy Policy</Link>.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You must be at least 13 years old to create an account.</li>
        <li>Give accurate details and keep your password to yourself. Tell us if you think someone else has got into your account.</li>
        <li>You’re responsible for what happens on your account.</li>
        <li>Usernames and display names can’t pretend to be someone else or be offensive. We may change ones that are.</li>
      </ul>

      <h2>3. Your content</h2>
      <ul>
        <li>The cards and comments you post stay yours.</li>
        <li>
          So we can run the site, you give us a free, worldwide, non-exclusive permission to store, show and share
          them — for example showing public cards in the feed and on your profile, and suggesting popular squares as
          ideas. The permission ends when you delete the content or your account.
        </li>
        <li>Anyone can see public cards and the comments on them, so don’t post anything you want to keep private.</li>
        <li>Card owners can remove comments on their own cards.</li>
      </ul>

      <h2>4. House rules</h2>
      <p>Don’t use YearlyBingos to:</p>
      <ul>
        <li>post anything illegal, or anything that infringes other people’s rights, such as copyright or privacy;</li>
        <li>harass, threaten or bully anyone, or spread hate;</li>
        <li>share someone else’s personal information without their permission;</li>
        <li>post sexual content, or anything that sexualises minors;</li>
        <li>spam, advertise, scam or impersonate others;</li>
        <li>try to break, overload or scrape the site, or get around its limits and security.</li>
      </ul>
      <p>
        We may remove content that breaks these rules, and suspend or delete accounts that break them seriously or
        repeatedly. To report something, email <Mail />.
      </p>

      <h2>5. Just for fun</h2>
      <p>
        Cards are predictions made for fun. Nothing on YearlyBingos is financial, investment, betting or other
        professional advice, and we don’t check whether predictions come true. There’s no gambling and there are no
        prizes.
      </p>

      <h2>6. Premium</h2>
      <ul>
        <li>
          <strong>Price:</strong> a one-time payment of ${PREMIUM_PRICE} (USD) through PayPal. The price is always
          shown before you pay, and PayPal’s own terms apply to the payment.
        </li>
        <li>
          <strong>What you get:</strong> unlimited cards (free accounts can keep up to {FREE_BOARD_LIMIT}), custom
          card colors and theme presets, and a crown badge. Premium unlocks right after payment.
        </li>
        <li>
          <strong>How long:</strong> for as long as YearlyBingos runs. Premium belongs to your account and can’t be
          transferred.
        </li>
        <li>
          <strong>Refunds:</strong> if you change your mind, email <Mail /> within 14 days of buying and we’ll refund
          you in full through PayPal. Premium is then removed from your account.
        </li>
      </ul>
      <p>These terms don’t limit any rights you have under consumer protection law.</p>

      <h2>7. Changes to the service</h2>
      <p>
        We work to keep YearlyBingos running smoothly, but we can’t promise it will always be available or free of
        errors. We may change or remove features, and if we ever have to close the site, we’ll give notice where we
        reasonably can.
      </p>

      <h2>8. Liability</h2>
      <p>
        YearlyBingos is provided “as is”. As far as the law allows, we aren’t responsible for indirect losses or for
        content posted by users. Nothing in these terms limits liability that can’t be limited by law, or your rights
        as a consumer.
      </p>

      <h2>9. Closing your account</h2>
      <p>
        You can stop using YearlyBingos whenever you like and ask us to delete your account. We may suspend or close
        accounts that seriously or repeatedly break these terms.
      </p>

      <h2>10. Changes to these terms</h2>
      <p>
        We may update these terms. If a change matters, we’ll tell you on the site before it takes effect. If you
        keep using YearlyBingos after that, the new terms apply.
      </p>

      <h2>11. Law and disputes</h2>
      <p>
        These terms are governed by Finnish law. If you’re a consumer, you also keep the protection of the mandatory
        laws of the country where you live. If something goes wrong, please contact us first — we’ll try to sort it
        out. Consumers in Finland can also get help from the consumer advisory services and take a dispute to the{' '}
        <Ext href="https://www.kuluttajariita.fi/en/">Consumer Disputes Board</Ext>.
      </p>

      <h2>12. Contact</h2>
      <p>
        {LEGAL.operator} · <Mail />
      </p>
    </LegalPage>
  )
}
