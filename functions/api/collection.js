/**
 * honDana — shelf persistence.
 *
 *   GET  /api/collection   → the signed-in user's whole shelf
 *   PUT  /api/collection   → replace the whole shelf with the posted state
 *
 * Every request is authenticated by verifying the Clerk session token
 * server-side. The browser never tells us *who* it is — it hands us a token,
 * and we ask Clerk to confirm it. A forged token gets rejected here, so no one
 * can read or write someone else's shelf.
 *
 * Bindings this needs (already in wrangler.toml / the dashboard):
 *   env.DB                 the D1 database, bound as DB
 *   env.CLERK_SECRET_KEY   set via: wrangler pages secret put CLERK_SECRET_KEY
 */

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

/**
 * Confirm the caller's Clerk session and return their Clerk user record.
 * Returns null if the token is missing, malformed or rejected by Clerk.
 */
/**
 * Confirm the caller's Clerk session and return their user id. This is the
 * one call every request needs — cheap, single round trip.
 */
async function verifySession(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;

  const res = await fetch("https://api.clerk.com/v1/sessions/verify", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) return null;
  const session = await res.json();
  return session?.user_id || null;
}

/**
 * Full profile lookup — email and username. Only needed the first time we
 * see a user, to create their row; every save after that skips this call
 * entirely, which is most of what made saves feel slow.
 */
async function fetchProfile(userId, env) {
  const ures = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: { Authorization: `Bearer ${env.CLERK_SECRET_KEY}` },
  });
  if (!ures.ok) return null;
  const u = await ures.json();
  const email =
    u?.email_addresses?.find((e) => e.id === u.primary_email_address_id)?.email_address ||
    u?.email_addresses?.[0]?.email_address ||
    null;
  return {
    id: userId,
    email,
    username: u?.username || u?.first_name || (email ? email.split("@")[0] : userId.slice(-8)),
  };
}

/**
 * Make sure a row exists in `users` for this Clerk account. Keyed by the Clerk
 * id, so it's created once and updated (last seen) thereafter. The email's
 * UNIQUE COLLATE NOCASE index is what actually guarantees one account per
 * address at the database level.
 */
/**
 * Make sure a row exists in `users` for this Clerk account. On the very first
 * request from a new account this does a Clerk profile lookup and a
 * username-clash check; on every request after that it's a single indexed
 * lookup that finds the row already there and does nothing further. That's
 * what keeps ordinary saves down to one D1 round trip instead of three.
 */
async function ensureUser(env, userId) {
  const existing = await env.DB.prepare("SELECT id FROM users WHERE id = ?").bind(userId).first();
  if (existing) {
    // Fire-and-forget last-seen touch — doesn't need to block the response.
    env.DB.prepare("UPDATE users SET last_seen_at = ? WHERE id = ?")
      .bind(Math.floor(Date.now() / 1000), userId).run().catch(() => {});
    return;
  }

  const who = await fetchProfile(userId, env);
  if (!who) return;   // Clerk hiccup — the row will get created on the next request instead

  const now = Math.floor(Date.now() / 1000);
  let username = who.username;
  const clash = await env.DB.prepare(
    "SELECT id FROM users WHERE username = ? COLLATE NOCASE AND id <> ?"
  ).bind(username, userId).first();
  if (clash) username = `${username}-${userId.slice(-4)}`;

  await env.DB.prepare(
    `INSERT INTO users (id, email, username, last_seen_at, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO NOTHING`
  ).bind(userId, who.email || `${userId}@clerk.local`, username, now, now).run();
}

/** Read the whole shelf back in the shape the client already uses. */
async function loadShelf(env, userId) {
  const [coll, prefs, favs] = await Promise.all([
    env.DB.prepare("SELECT series_id, volume, status, target FROM collection WHERE user_id = ?").bind(userId).all(),
    env.DB.prepare("SELECT series_id, followed, cover_out, sort_index FROM series_prefs WHERE user_id = ?").bind(userId).all(),
    env.DB.prepare("SELECT slot, series_id, volume FROM favourites WHERE user_id = ?").bind(userId).all(),
  ]);

  const collection = {};
  const ensure = (id) => (collection[id] ||= { owned: [], wishlist: [], followed: false, coverOut: null, target: {} });

  for (const r of coll.results || []) {
    const c = ensure(r.series_id);
    if (r.status === "owned") c.owned.push(r.volume);
    else {
      c.wishlist.push(r.volume);
      if (r.target != null) c.target[r.volume] = r.target;
    }
  }
  for (const p of prefs.results || []) {
    const c = ensure(p.series_id);
    c.followed = !!p.followed;
    c.coverOut = p.cover_out;
    c.sortIndex = p.sort_index;
  }
  for (const id in collection) {
    collection[id].owned.sort((a, b) => a - b);
    collection[id].wishlist.sort((a, b) => a - b);
  }

  // shelfOrder is whatever sort_index the prefs recorded, low to high.
  const shelfOrder = (prefs.results || [])
    .filter((p) => p.sort_index != null)
    .sort((a, b) => a.sort_index - b.sort_index)
    .map((p) => p.series_id);

  const favourites = [null, null, null, null];
  let favouriteVolume = null;
  for (const f of favs.results || []) {
    if (f.slot >= 0 && f.slot <= 3) favourites[f.slot] = f.series_id;
    if (f.volume != null) favouriteVolume = { id: f.series_id, vol: f.volume };
  }

  return { collection, shelfOrder, favourites, favouriteVolume };
}

/** Overwrite the whole shelf with the posted state. Simplest correct model:
 *  wipe this user's rows and reinsert. A shelf is small, so this is cheap and
 *  removes any chance of drift between client and server. */
async function saveShelf(env, userId, body) {
  const { collection = {}, shelfOrder = [], favourites = [], favouriteVolume = null } = body;
  const stmts = [
    env.DB.prepare("DELETE FROM collection WHERE user_id = ?").bind(userId),
    env.DB.prepare("DELETE FROM series_prefs WHERE user_id = ?").bind(userId),
    env.DB.prepare("DELETE FROM favourites WHERE user_id = ?").bind(userId),
  ];

  const orderOf = (id) => {
    const i = shelfOrder.indexOf(id);
    return i === -1 ? null : i;
  };

  for (const [seriesId, c] of Object.entries(collection)) {
    for (const v of c.owned || [])
      stmts.push(env.DB.prepare(
        "INSERT INTO collection (user_id, series_id, volume, status) VALUES (?, ?, ?, 'owned')"
      ).bind(userId, seriesId, v));
    for (const v of c.wishlist || [])
      stmts.push(env.DB.prepare(
        "INSERT INTO collection (user_id, series_id, volume, status, target) VALUES (?, ?, ?, 'wishlist', ?)"
      ).bind(userId, seriesId, v, c.target?.[v] ?? null));

    // A prefs row is worth keeping if anything about the series is non-default.
    if (c.followed || c.coverOut != null || orderOf(seriesId) != null)
      stmts.push(env.DB.prepare(
        "INSERT INTO series_prefs (user_id, series_id, followed, cover_out, sort_index) VALUES (?, ?, ?, ?, ?)"
      ).bind(userId, seriesId, c.followed ? 1 : 0, c.coverOut ?? null, orderOf(seriesId)));
  }

  favourites.forEach((id, slot) => {
    if (!id) return;
    const vol = favouriteVolume && favouriteVolume.id === id ? favouriteVolume.vol : null;
    stmts.push(env.DB.prepare(
      "INSERT INTO favourites (user_id, slot, series_id, volume) VALUES (?, ?, ?, ?)"
    ).bind(userId, slot, id, vol));
  });
  // If the favourite volume's series isn't one of the four slots, still store it.
  if (favouriteVolume && !favourites.includes(favouriteVolume.id)) {
    stmts.push(env.DB.prepare(
      "INSERT INTO favourites (user_id, slot, series_id, volume) VALUES (?, 4, ?, ?)"
    ).bind(userId, favouriteVolume.id, favouriteVolume.vol));
  }

  await env.DB.batch(stmts);
}

export async function onRequest({ request, env }) {
  if (!env.DB) return json({ error: "Database not bound" }, 500);
  if (!env.CLERK_SECRET_KEY) return json({ error: "Auth not configured" }, 500);

  const userId = await verifySession(request, env);
  if (!userId) return json({ error: "Not signed in" }, 401);

  try {
    if (request.method === "GET") {
      await ensureUser(env, userId);   // must finish before we can read their shelf
      return json(await loadShelf(env, userId));
    }
    if (request.method === "PUT") {
      const body = await request.json();
      await ensureUser(env, userId);   // usually a single cheap lookup — see above
      await saveShelf(env, userId, body);
      return json({ ok: true, savedAt: Date.now() });
    }
    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
}