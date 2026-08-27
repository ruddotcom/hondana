# honDana

Track the manga you physically own. React + Vite on Cloudflare Pages, D1 for data,
R2 for cover art, Stripe for Premium.

**Do these in order.** Steps 1–4 get the site live. Steps 5–9 turn on covers,
accounts and payments. Nothing here costs money except a domain.

---

## 0. Before you start

Install/create these once:

| What | How |
|---|---|
| Node 20+ | https://nodejs.org — check with `node --version` |
| Git | `git --version`; if missing, https://git-scm.com |
| GitHub account | github.com |
| Cloudflare account | dash.cloudflare.com (free plan) |
| Stripe account | dashboard.stripe.com — stay in **Test mode** until step 8 |
| Google Books API key | console.cloud.google.com → new project → APIs → enable "Books API" → Credentials → API key |

---

## 1. Get it running locally

```bash
git clone <your-empty-repo-url> hondana && cd hondana
# copy these files in, then:
npm install
npm run dev
```

Open http://localhost:5173. The app runs entirely on mock data at this point —
that's fine, everything you see is real UI.

---

## 2. Push to GitHub

```bash
git init
git add -A
git commit -m "honDana"
git branch -M main
git remote add origin https://github.com/<you>/hondana.git
git push -u origin main
```

**Before you push, check `.gitignore` covers `.dev.vars`, `.env` and `covers/`.**
Never commit a Stripe secret key. If you ever do, roll it immediately in the
Stripe dashboard — a committed key is a compromised key even in a private repo.

---

## 3. Deploy to Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Pick the repo. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
3. **Save and Deploy.** Two minutes later you're live at `hondana.pages.dev`.

Every push to `main` redeploys automatically from here on.

---

## 4. Custom domain (optional, ~$12/yr)

Pages project → **Custom domains** → add `hondana.app`. If you buy the domain
through Cloudflare Registrar the DNS is configured for you; otherwise point the
nameservers at Cloudflare first.

---

## 5. The database (D1)

```bash
npx wrangler login
npx wrangler d1 create hondana
```

It prints a `database_id`. Paste it into `wrangler.toml`, then create the tables:

```bash
npm run db:local     # local dev copy
npm run db:remote    # the real one
```

Then bind it: Pages project → **Settings** → **Functions** → **D1 database
bindings** → variable name `DB`, database `hondana`. Redeploy.

Sanity check:

```bash
npx wrangler d1 execute hondana --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```

---

## 6. Cover art (this is the long one)

**6a. Write `series.json`.** Start from `series.example.json`. One object per
series *and per edition* — a Deluxe edition is its own product with its own
ISBNs. Do ten series first to check your matching, then expand.

**6b. Run the ingest.**

```bash
export GOOGLE_BOOKS_KEY=your_key_here      # Windows: set GOOGLE_BOOKS_KEY=...
npm run ingest -- --only csm               # test one series
npm run ingest                             # then the whole file
```

Expect 80–90% matched automatically. It's resumable — Ctrl-C and re-run any time.
You get `volumes.json` and a `covers/` folder.

**6c. Fix the misses.** The run lists what it couldn't match. Find those ISBNs on
the publisher's site and put them in `overrides.json`:

```json
{ "csm:22": { "isbn13": "9784088838526", "coverUrl": "https://..." } }
```

Re-run `npm run ingest`.

**6d. Make the R2 bucket.**

```bash
npx wrangler r2 bucket create hondana-covers
```

Dashboard → R2 → `hondana-covers` → **Settings** → **Public access** → connect a
custom domain like `covers.hondana.app`. **Do this properly** — serving images
through a Worker instead burns your 100k daily requests on thumbnails.

**6e. Resize and upload.**

```bash
export CLOUDFLARE_ACCOUNT_ID=...     # dashboard right-hand sidebar
export CLOUDFLARE_API_TOKEN=...      # My Profile → API Tokens → Workers R2 Storage: Edit
npm run covers:publish
```

**6f. Point the app at them.** In `src/App.jsx` find `coverImage()` and return
your URL:

```js
function coverImage(series, vol) {
  const isbn = VOLUME_ISBNS[`${series.id}:${vol}`];
  return isbn ? `https://covers.hondana.app/600/${isbn}.webp` : null;
}
```

Commit, push, done — every book switches to real art.

**6g. Automate it.** In GitHub: **Settings → Secrets and variables → Actions**,
add `GOOGLE_BOOKS_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`. The
workflow in `.github/workflows/update-catalogue.yml` then checks for new volumes
every Monday. **Commit `.ingest-cache.json` and `volumes.json`** — that cache is
the state that makes the weekly run incremental.

---

## 7. Retailer prices

Sign up as an affiliate, then use each network's **product feed** — do not scrape.

- Australia: **Commission Factory** (QBD, Dymocks, Angus & Robertson, Kmart, Big W)
- Worldwide: **Impact**, **Awin**, **CJ**
- Amazon: **Associates** → PA-API after 3 qualifying sales

Load the feeds nightly into the `offers` table with a Cloudflare **Cron Trigger**,
and copy each day's cheapest into `offer_history` — that's what powers price
history and drop alerts. Swap `offersFor()` in `src/App.jsx` for a
`fetch("/api/offers?isbn=…&country=…")`; it returns the same shape.

Legally required: a visible "we may earn a commission" line on the buy sheet
(ACCC in Australia, FTC in the US).

---

## 8. Stripe and Premium

1. Stripe → **Products** → create "honDana Premium".
2. Add a **Price** for every currency and interval you support — monthly and
   yearly for each. Copy each Price ID into `PRICE_IDS` in `src/server/stripe.js`.
3. Set the secrets:

```bash
npx wrangler pages secret put STRIPE_SECRET_KEY      # sk_live_… — never in a file
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET
```

4. Put your **publishable** key (`pk_live_…`) in `STRIPE_PUBLISHABLE_KEY` in
   `src/App.jsx`. That one is meant to be public.
5. Stripe → **Developers → Webhooks** → add endpoint
   `https://hondana.app/api/stripe/webhook`, events
   `customer.subscription.created`, `.updated`, `.deleted`. Copy the signing
   secret into the secret above.
6. Replace the mock card fields with **Stripe Elements** so card numbers never
   touch your server:

```bash
npm i @stripe/stripe-js @stripe/react-stripe-js
```

The `CheckoutPanel` in `src/App.jsx` has the exact calls in a comment. The Luhn
check in there is only a typo-catcher — **premium is granted by the webhook, never
by the browser.**

7. Test with card `4242 4242 4242 4242`, any future expiry, any CVC. Then flip
   Stripe out of Test mode and swap the keys.

---

## 9. Accounts and email

- **Auth**: `npm i better-auth` and point it at D1, or use Clerk if you'd rather
  not own it. The `requireUser()` stub in `src/server/stripe.js` is where it plugs in.
- **Email**: Resend (100/day free) for export links, price alerts and password
  resets. `npx wrangler pages secret put RESEND_API_KEY`.

---

## Running costs

| | Free tier | When you'd pay |
|---|---|---|
| Pages | Unlimited bandwidth, 500 builds/mo | Never, realistically |
| Workers | 100k requests/day | $5/mo past that |
| D1 | 5GB, 5M reads/day | $5/mo past that |
| R2 | 10GB, no egress ever | $0.015/GB/mo past 10GB |
| Resend | 3,000 emails/mo | $20/mo past that |
| Stripe | no fixed fee | ~1.7% + 30c per charge |

**$0 until you have real traffic.** Only the domain is unavoidable.

---

## Before you tell anyone about it

- [ ] Privacy policy and terms (you're storing emails and taking payments)
- [ ] Affiliate disclosure on the buy sheet
- [ ] `robots.txt` and a sitemap
- [ ] Cloudflare Web Analytics turned on (free, no cookie banner needed)
- [ ] Sentry for errors (5k events/mo free)
- [ ] Test the scanner **on a real phone over HTTPS** — camera won't work otherwise
- [ ] Check the catalogue for a few series you own personally; wrong volume counts
      are the fastest way to lose a collector's trust
