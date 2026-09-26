# YearlyBingos

Make a bingo card of your predictions for the year, share it, argue in the comments, and cross squares off with an X as they come true.

Built with **Vite + React + TypeScript** and **Supabase** (Postgres, Auth, Realtime, Edge Functions).

## Features

- Sign in with **email + password**, **Google** or **X** (Supabase Auth), password reset
- Create / edit / delete 5×5 cards, public or private, idea suggestions, shuffle
- Card page with **likes**, **live comments** (edit / delete, card owners can moderate) and **mark mode** (X marks) with BINGO detection
- Community feed: newest, most liked, most discussed
- Profiles (`/u/username`), settings, light & dark theme
- Premium ($3.49 one-time via PayPal): custom card colors + unlimited cards, with a looping theme showcase
- Legal pages: `/privacy`, `/terms`, `/cookies` — fill in your name and contact email in `src/lib/legal.ts` before going live

## Run it

Needs Node **20.19+**.

```bash
npm install
npm run dev        # http://localhost:5173
```

`.env.local` holds the Supabase connection (see `.env.example`). Only the public **publishable/anon** key goes there — never the secret/service_role key.

## Supabase setup

1. **Database** – run `supabase/migrations/20260925120000_init.sql` in the SQL editor (already done for project `ryfkvmcdimjigcgyuzxb`). It creates the tables, row-level-security policies, triggers (profile on sign-up, like/comment counters, premium checks) and enables Realtime on `comments` and `boards`.
2. **Auth → URL Configuration** – Site URL `http://localhost:5173`, redirect URL `http://localhost:5173/**` (add your production URL when you deploy).
3. **Auth → Sign In / Providers**
   - Email: enabled. "Confirm email" is off because Supabase's built-in mailer only delivers to your own team. Turn it back on after adding custom SMTP (Auth → Emails → SMTP).
   - **Google**: create an OAuth client in Google Cloud Console (type *Web application*), add `https://ryfkvmcdimjigcgyuzxb.supabase.co/auth/v1/callback` as an authorized redirect URI, then paste the client ID + secret into Supabase.
   - **X / Twitter (OAuth 2.0)**: in the X developer portal set the callback URL to the same Supabase callback, turn on "Request email from users", then paste the client ID + secret into Supabase.
4. **Premium (optional)** – deploy the PayPal edge function and set its secrets:
   ```bash
   npx supabase login
   npx supabase functions deploy paypal --project-ref ryfkvmcdimjigcgyuzxb
   npx supabase secrets set --project-ref ryfkvmcdimjigcgyuzxb PAYPAL_CLIENT_ID=... PAYPAL_SECRET=... PAYPAL_ENV=sandbox
   ```
   Then put the PayPal **client ID** (public) in `.env.local` as `VITE_PAYPAL_CLIENT_ID`.

## Project layout

```
src/
  auth/AuthProvider.tsx    session + profile context
  components/              BingoTicket (the card), Card3D, Comments, Header, …
  pages/                   Home, Login, Editor, BoardPage, MyCards, ProfilePage, Settings, Premium
  pages/legal/             Privacy, Terms, Cookies
  lib/                     supabase client, data api, bingo helpers, legal details
  styles/global.css        design tokens (light + dark) and all styles
supabase/
  migrations/              database schema
  functions/paypal/        PayPal checkout edge function
```
