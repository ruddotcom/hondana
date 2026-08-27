/**
 * honDana — Stripe subscription Worker.
 *
 * The secret key lives here and only here. Set it as a secret binding, never
 * in a file and never in the frontend bundle:
 *
 *   npx wrangler secret put STRIPE_SECRET_KEY
 *   npx wrangler secret put STRIPE_WEBHOOK_SECRET
 *
 * Routes:
 *   POST /api/subscribe   → { clientSecret }  (the browser confirms with Stripe.js)
 *   POST /api/stripe/webhook → flips the plan flag when Stripe says it's paid
 *   POST /api/cancel      → cancels at period end
 *
 * The client sends an interval ("monthly" | "yearly") and nothing else. The
 * price is chosen here from PRICE_IDS by the country the *edge* reports, so a
 * user can't pick Nigeria's price from Sydney by editing a request.
 */

// Create these Prices in the Stripe dashboard (one per currency + interval)
// and paste the IDs. Amounts live in Stripe, not in your code.
const PRICE_IDS = {
  US: { monthly: "price_us_monthly", yearly: "price_us_yearly" },
  AU: { monthly: "price_au_monthly", yearly: "price_au_yearly" },
  GB: { monthly: "price_gb_monthly", yearly: "price_gb_yearly" },
  IN: { monthly: "price_in_monthly", yearly: "price_in_yearly" },
  // …one row per market you price for. Fall back to US.
};
const priceFor = (country, interval) =>
  (PRICE_IDS[country] || PRICE_IDS.US)[interval === "monthly" ? "monthly" : "yearly"];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

/** Stripe's REST API takes form encoding, including for nested fields. */
async function stripe(env, path, form, method = "POST") {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form ? new URLSearchParams(form) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Stripe request failed");
  return data;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    /* ---------------------------------------------- create a subscription */
    if (url.pathname === "/api/subscribe" && request.method === "POST") {
      const user = await requireUser(request, env);       // your own session check
      if (!user) return json({ error: "Not signed in" }, 401);

      const { interval } = await request.json();
      const country = request.cf?.country || "US";        // edge geolocation, not the client
      const price = priceFor(country, interval);

      try {
        // Reuse the customer if this user has subscribed before.
        let customerId = user.stripe_customer_id;
        if (!customerId) {
          const customer = await stripe(env, "customers", {
            email: user.email,
            "metadata[user_id]": user.id,
          });
          customerId = customer.id;
          await env.DB.prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?")
            .bind(customerId, user.id).run();
        }

        const subscription = await stripe(env, "subscriptions", {
          customer: customerId,
          "items[0][price]": price,
          payment_behavior: "default_incomplete",
          "payment_settings[save_default_payment_method]": "on_subscription",
          "expand[0]": "latest_invoice.payment_intent",
          "metadata[user_id]": user.id,
        });

        return json({
          clientSecret: subscription.latest_invoice.payment_intent.client_secret,
          subscriptionId: subscription.id,
        });
      } catch (err) {
        return json({ error: err.message }, 400);
      }
    }

    /* ------------------------------------------------------------ webhook */
    if (url.pathname === "/api/stripe/webhook" && request.method === "POST") {
      const signature = request.headers.get("stripe-signature") || "";
      const body = await request.text();
      if (!(await verifyStripeSignature(body, signature, env.STRIPE_WEBHOOK_SECRET))) {
        return json({ error: "Bad signature" }, 400);
      }

      const event = JSON.parse(body);
      const sub = event.data.object;
      const userId = sub.metadata?.user_id;

      // The plan flag is only ever set from here — never from the browser.
      if (userId) {
        if (event.type === "customer.subscription.created" ||
            event.type === "customer.subscription.updated") {
          const active = ["active", "trialing"].includes(sub.status);
          await env.DB.prepare(
            "UPDATE users SET plan = ?, current_period_end = ? WHERE id = ?"
          ).bind(active ? "premium" : "free", sub.current_period_end, userId).run();
        }
        if (event.type === "customer.subscription.deleted") {
          await env.DB.prepare("UPDATE users SET plan = 'free' WHERE id = ?").bind(userId).run();
        }
      }
      return json({ received: true });
    }

    /* ------------------------------------------------------------- cancel */
    if (url.pathname === "/api/cancel" && request.method === "POST") {
      const user = await requireUser(request, env);
      if (!user?.stripe_customer_id) return json({ error: "No subscription" }, 400);
      const subs = await stripe(env, `subscriptions?customer=${user.stripe_customer_id}&status=active&limit=1`, null, "GET");
      const sub = subs.data?.[0];
      if (!sub) return json({ error: "No active subscription" }, 400);
      await stripe(env, `subscriptions/${sub.id}`, { cancel_at_period_end: "true" });
      return json({ ok: true, endsAt: sub.current_period_end });
    }

    return json({ error: "Not found" }, 404);
  },
};

/* ------------------------------------------------------------------ utils */

/** Stripe signs webhooks with HMAC-SHA256 over `${timestamp}.${body}`. */
async function verifyStripeSignature(body, header, secret) {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  if (!parts.t || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;   // replay window
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${parts.t}.${body}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  // Constant-time compare.
  if (expected.length !== parts.v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ parts.v1.charCodeAt(i);
  return diff === 0;
}

/** Replace with whatever session mechanism you land on (Better Auth, Clerk…). */
async function requireUser(request, env) {
  const token = (request.headers.get("cookie") || "").match(/session=([^;]+)/)?.[1];
  if (!token) return null;
  return env.DB.prepare(
    "SELECT id, email, plan, stripe_customer_id FROM users WHERE session_token = ?"
  ).bind(token).first();
}
