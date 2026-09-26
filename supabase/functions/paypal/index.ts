// Supabase Edge Function: PayPal checkout for YearlyBingos Premium.
//
// POST { action: "create" }                 -> { id }   (PayPal order id)
// POST { action: "capture", orderID: "..." } -> { ok: true }
//
// Secrets (Dashboard -> Edge Functions -> Secrets, or `supabase secrets set`):
//   PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_ENV ("sandbox" | "live")
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import { createClient } from 'npm:@supabase/supabase-js@2'

const PRICE = '3.49'
const CURRENCY = 'USD'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const PAYPAL_API =
  Deno.env.get('PAYPAL_ENV') === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

let cachedToken: { value: string; expires: number } | null = null

async function paypalToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.value
  const id = Deno.env.get('PAYPAL_CLIENT_ID')
  const secret = Deno.env.get('PAYPAL_SECRET')
  if (!id || !secret) throw new Error('PayPal is not configured (missing PAYPAL_CLIENT_ID / PAYPAL_SECRET).')
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error('Could not authenticate with PayPal.')
  const data = await res.json()
  cachedToken = { value: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 }
  return cachedToken.value
}

async function paypal(path: string, body: unknown) {
  const res = await fetch(`${PAYPAL_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await paypalToken()}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message ?? `PayPal request failed (${res.status})`)
  return data
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

  // Who is calling? (supabase.functions.invoke sends the user's access token)
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: auth, error: authError } = await admin.auth.getUser(token)
  const user = auth?.user
  if (authError || !user) return json({ error: 'Please sign in first.' }, 401)

  let payload: { action?: string; orderID?: string } = {}
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  try {
    const { data: profile } = await admin.from('profiles').select('is_premium').eq('id', user.id).single()
    if (profile?.is_premium) return json({ error: 'You already have Premium.' }, 400)

    if (payload.action === 'create') {
      const order = await paypal('/v2/checkout/orders', {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: CURRENCY, value: PRICE },
            description: 'YearlyBingos Premium (lifetime)',
            custom_id: user.id,
          },
        ],
        application_context: { brand_name: 'YearlyBingos', shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW' },
      })
      const { error } = await admin.from('payments').insert({
        user_id: user.id,
        order_id: order.id,
        amount: PRICE,
        currency: CURRENCY,
        status: order.status ?? 'CREATED',
      })
      if (error) throw error
      return json({ id: order.id })
    }

    if (payload.action === 'capture') {
      const orderID = String(payload.orderID ?? '')
      if (!/^[A-Z0-9]{8,40}$/i.test(orderID)) return json({ error: 'Invalid order id' }, 400)

      // The order must have been created by this same user.
      const { data: payment } = await admin.from('payments').select('user_id, status').eq('order_id', orderID).maybeSingle()
      if (!payment || payment.user_id !== user.id) return json({ error: 'Unknown order' }, 404)

      const order = await paypal(`/v2/checkout/orders/${orderID}/capture`, {})
      const capture = order?.purchase_units?.[0]?.payments?.captures?.[0]
      const paid =
        order?.status === 'COMPLETED' &&
        capture?.status === 'COMPLETED' &&
        capture?.amount?.value === PRICE &&
        capture?.amount?.currency_code === CURRENCY

      await admin
        .from('payments')
        .update({ status: order?.status ?? 'UNKNOWN', capture_id: capture?.id ?? null })
        .eq('order_id', orderID)

      if (!paid) return json({ error: 'Payment was not completed. You have not been charged.' }, 402)

      const { error } = await admin
        .from('profiles')
        .update({ is_premium: true, premium_since: new Date().toISOString() })
        .eq('id', user.id)
      if (error) throw error
      return json({ ok: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err) {
    console.error('paypal function error', err)
    return json({ error: err instanceof Error ? err.message : 'Something went wrong' }, 500)
  }
})
