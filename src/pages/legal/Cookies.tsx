import { Link } from 'react-router-dom'
import LegalPage, { Ext, Mail } from './LegalPage'

export default function Cookies() {
  return (
    <LegalPage
      title="Cookies"
      summary={
        <p>
          We don’t use advertising or analytics cookies, so there’s no cookie banner. Your browser only stores what the
          site needs to work.
        </p>
      }
    >
      <h2>What we store on your device</h2>
      <p>
        YearlyBingos keeps a few small items in your browser’s local storage. It works much like a cookie, but it’s
        never sent to a server on its own.
      </p>
      <div className="table-wrap">
        <table className="legal-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>What it’s for</th>
              <th>How long</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>sb-…-auth-token</code>
              </td>
              <td>Keeps you signed in</td>
              <td>Until you sign out</td>
            </tr>
            <tr>
              <td>
                <code>sb-…-auth-token-code-verifier</code>
              </td>
              <td>Secures email links and signing in with Google or X</td>
              <td>Removed once you’re signed in</td>
            </tr>
            <tr>
              <td>
                <code>yb-theme</code>
              </td>
              <td>Remembers the light or dark theme you picked</td>
              <td>Until you clear it</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>These are strictly necessary for things you ask for, so under EU and Finnish law they don’t need your consent.</p>

      <h2>Other services</h2>
      <ul>
        <li>
          <strong>PayPal:</strong> when checkout is shown on the Premium page, PayPal’s payment buttons load and may set
          cookies for security and fraud prevention. See{' '}
          <Ext href="https://www.paypal.com/webapps/mpp/ua/cookie-full">PayPal’s cookie statement</Ext>.
        </li>
        <li>
          <strong>Google and X:</strong> if you sign in with them, you visit their sites, which use their own cookies.
        </li>
        <li>
          <strong>Google Fonts:</strong> the site’s fonts are downloaded from Google’s servers. That doesn’t set
          cookies, but it does send your IP address to Google.
        </li>
      </ul>

      <h2>Clearing it</h2>
      <p>
        You can delete stored site data at any time in your browser’s settings. You’ll be signed out and the theme
        goes back to light.
      </p>
      <p>
        Questions? Email <Mail />. There’s more about how we handle data in the{' '}
        <Link to="/privacy">Privacy Policy</Link>.
      </p>
    </LegalPage>
  )
}
