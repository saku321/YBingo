/** Shown instead of the app when .env.local hasn't been filled in yet. */
export default function SetupNotice() {
  return (
    <main className="container page narrow">
      <div className="panel setup">
        <h1>Connect Supabase</h1>
        <p>
          YearlyBingos needs your Supabase project URL and public key. Create a file called{' '}
          <code>.env.local</code> in the project folder:
        </p>
        <pre>
          {`VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon / publishable key>`}
        </pre>
        <p>
          Find both under <strong>Project Settings → API</strong> in the Supabase dashboard, then restart{' '}
          <code>npm run dev</code>.
        </p>
      </div>
    </main>
  )
}
