#!/usr/bin/env node
/**
 * honDana catalogue ingestion — builds the volumes table honDana needs.
 *
 *   node ingest-covers.mjs                 # everything in series.json
 *   node ingest-covers.mjs --only csm      # one series
 *   node ingest-covers.mjs --no-download   # metadata + URLs, skip image files
 *   node ingest-covers.mjs --check-new     # weekly mode: look for volumes that
 *                                          # have appeared since the last run,
 *                                          # and retry anything unmatched
 *   node ingest-covers.mjs --discover 4    # find series that aren't in the
 *                                          # catalogue yet and add them
 *
 * --check-new probes a few volumes past the highest one it already knows about
 * for each series. When it finds one, it appends it, bumps the count in
 * series.json, and lists it in new-volumes.json so the scheduled job can
 * announce it. Run it weekly from GitHub Actions — see update-catalogue.yml.
 *
 * Sources, all documented public APIs (no scraping):
 *   AniList GraphQL   — series metadata + series-level cover art. No key.
 *   Google Books      — per-volume ISBN-13 and thumbnail. Set GOOGLE_BOOKS_KEY.
 *   Open Library      — cover fallback by ISBN, openly licensed.
 *
 * Output:
 *   volumes.json      — [{ seriesId, volume, isbn13, title, coverUrl, source }]
 *   covers/<isbn>.jpg — downloaded originals (resize + upload to R2 separately)
 *   .ingest-cache.json — resume file; delete it to start over
 *
 * Read the terms for each source before you ship. Google Books restricts how
 * long you may cache their thumbnails; Open Library does not. Cover art is the
 * publisher's copyright — thumbnails for identification in a catalogue is
 * normal practice, but the cleanly licensed route is Amazon PA-API images
 * under the Associates agreement you already have.
 */

import fs from "node:fs/promises";
import path from "node:path";

const CACHE = ".ingest-cache.json";
const OUT = "volumes.json";
const COVER_DIR = "covers";
const GB_KEY = process.env.GOOGLE_BOOKS_KEY || "";
const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const download = !args.includes("--no-download");
const checkNew = args.includes("--check-new");
const discoverPages = args.includes("--discover")
  ? Number(args[args.indexOf("--discover") + 1] || 4) : 0;
const MIN_POPULARITY = Number(process.env.MIN_POPULARITY || 4000);
const PROBE_AHEAD = 3;        // volumes to look for past the last one we know
const META_TTL_DAYS = 30;     // how often to re-ask AniList about a series

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function loadJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return fallback; }
}

/** Highest volume we already have an ISBN for. */
function knownMax(cache, seriesId) {
  let max = 0;
  for (const [key, val] of Object.entries(cache)) {
    if (!key.startsWith(`${seriesId}:`) || !val?.isbn13) continue;
    max = Math.max(max, Number(key.split(":")[1]) || 0);
  }
  return max;
}
const staleMeta = (meta) =>
  !meta || !meta.fetchedAt || Date.now() - Date.parse(meta.fetchedAt) > META_TTL_DAYS * 864e5;

/* ------------------------------------------------------- AniList discovery */

const DISCOVER_QUERY = `
query ($page: Int) {
  Page(page: $page, perPage: 50) {
    pageInfo { hasNextPage }
    media(type: MANGA, format: MANGA, sort: POPULARITY_DESC, countryOfOrigin: "JP", isAdult: false) {
      id popularity volumes status
      title { romaji english }
      staff(perPage: 2) { edges { role node { name { full } } } }
    }
  }
}`;

const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

/**
 * Adds series that aren't in series.json yet, most-read first. Anything without
 * a volume count has no tankōbon release, so it can't be shelved and is skipped.
 * Titles are matched to shops by name, so nothing here needs a human.
 */
async function discover(series, pages) {
  const known = new Set(series.map((s) => s.id));
  const knownTitles = new Set(series.map((s) => (s.searchTitle || s.title).toLowerCase()));
  const added = [];

  for (let page = 1; page <= pages; page++) {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: DISCOVER_QUERY, variables: { page } }),
    });
    if (res.status === 429) {
      const wait = Number(res.headers.get("retry-after") || 60);
      console.log(`   rate limited, waiting ${wait}s`);
      await sleep(wait * 1000);
      page -= 1;
      continue;
    }
    if (!res.ok) { console.log(`   discovery page ${page} failed: ${res.status}`); break; }
    const { data } = await res.json();
    const list = data?.Page?.media || [];

    for (const m of list) {
      const title = m.title.english || m.title.romaji;
      if (!title || !m.volumes || m.volumes < 1) continue;         // no print run
      if (m.popularity < MIN_POPULARITY) continue;                  // too obscure to price
      const id = slug(title);
      if (known.has(id) || knownTitles.has(title.toLowerCase())) continue;
      known.add(id);
      knownTitles.add(title.toLowerCase());
      const entry = {
        id, title, volumes: m.volumes, edition: "Standard",
        author: m.staff?.edges?.find((e) => /story|art/i.test(e.role))?.node?.name?.full || null,
        anilistId: m.id, discovered: new Date().toISOString().slice(0, 10),
      };
      series.push(entry);
      added.push(entry);
    }
    if (!data?.Page?.pageInfo?.hasNextPage) break;
    await sleep(2100);                                              // 30 requests/minute
  }

  if (added.length) {
    await fs.writeFile("series.json", JSON.stringify(series, null, 2));
    console.log(`Discovered ${added.length} new series:`);
    for (const a of added.slice(0, 25)) console.log(`   ${a.title} (${a.volumes} volumes)`);
    if (added.length > 25) console.log(`   …and ${added.length - 25} more`);
  } else {
    console.log("Discovery found nothing new.");
  }
  return added;
}

/* ---------------------------------------------------------------- AniList */

const ANILIST_QUERY = `
query ($search: String) {
  Media(search: $search, type: MANGA, format_in: [MANGA]) {
    id title { romaji english native }
    coverImage { extraLarge large }
    volumes chapters status genres startDate { year }
    staff(perPage: 3) { edges { role node { name { full } } } }
    description(asHtml: false)
  }
}`;

async function anilist(search) {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: ANILIST_QUERY, variables: { search } }),
  });
  if (res.status === 429) {
    const wait = Number(res.headers.get("retry-after") || 60);
    console.log(`   AniList rate limited, waiting ${wait}s`);
    await sleep(wait * 1000);
    return anilist(search);
  }
  if (!res.ok) throw new Error(`AniList ${res.status}`);
  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors[0].message);
  return data.Media;
}

/* ----------------------------------------------------------- Google Books */

/** Volume titles are published as "Chainsaw Man, Vol. 7" almost universally. */
function matchesVolume(candidateTitle, seriesTitle, vol) {
  const t = norm(candidateTitle);
  if (!t.startsWith(norm(seriesTitle))) return false;
  const m = t.match(/vol(?:ume)?\s*(\d+)/) || t.match(/\b(\d{1,3})\b\s*$/);
  return m ? Number(m[1]) === vol : false;
}

async function googleBooksVolume(series, vol) {
  const q = [
    `intitle:"${series.searchTitle || series.title}"`,
    series.publisherEn ? `inpublisher:"${series.publisherEn}"` : "",
    `"${vol}"`,
  ].filter(Boolean).join("+");
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}`
    + `&maxResults=20&printType=books&country=US${GB_KEY ? `&key=${GB_KEY}` : ""}`;

  const res = await fetch(url);
  if (res.status === 429) { console.log("   Google Books rate limited, waiting 60s"); await sleep(60000); return googleBooksVolume(series, vol); }
  if (!res.ok) throw new Error(`Google Books ${res.status}`);
  const { items = [] } = await res.json();

  for (const item of items) {
    const info = item.volumeInfo || {};
    if (!matchesVolume(info.title || "", series.title, vol)) continue;
    const isbn13 = (info.industryIdentifiers || []).find((i) => i.type === "ISBN_13")?.identifier;
    if (!isbn13) continue;
    // zoom=2 is roughly 400px wide; the default thumbnail is ~128px and unusable.
    const thumb = (info.imageLinks?.thumbnail || "")
      .replace("http://", "https://").replace("&edge=curl", "").replace(/zoom=\d/, "zoom=2");
    return { isbn13, title: info.title, coverUrl: thumb || null, source: "google-books" };
  }
  return null;
}

/* ----------------------------------------------------------- Open Library */

async function openLibraryCover(isbn13) {
  const url = `https://covers.openlibrary.org/b/isbn/${isbn13}-L.jpg?default=false`;
  const res = await fetch(url, { method: "HEAD" });
  return res.ok ? url : null;
}

/* ----------------------------------------------------------------- images */

async function fetchCover(url, isbn13) {
  const file = path.join(COVER_DIR, `${isbn13}.jpg`);
  try { await fs.access(file); return file; } catch { /* not cached yet */ }
  const res = await fetch(url);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 3000) return null;             // Google's "no image" placeholder
  await fs.mkdir(COVER_DIR, { recursive: true });
  await fs.writeFile(file, buf);
  return file;
}

/* ------------------------------------------------------------------- main */

async function main() {
  const series = await loadJson("series.json", null);
  if (!series) {
    console.error(`No series.json found. It should look like:

[
  { "id": "csm", "title": "Chainsaw Man", "publisherEn": "VIZ Media", "volumes": 24, "edition": "Standard" },
  { "id": "berserk-deluxe", "title": "Berserk Deluxe Volume", "searchTitle": "Berserk Deluxe",
    "publisherEn": "Dark Horse Manga", "volumes": 14, "edition": "Deluxe Edition" }
]`);
    process.exit(1);
  }

  const cache = await loadJson(CACHE, {});
  const fresh = [];               // volumes that appeared since the last run
  let seriesChanged = false;

  if (discoverPages) {
    const added = await discover(series, discoverPages);
    if (added.length) seriesChanged = true;
  }
  const overrides = await loadJson("overrides.json", {});   // { "csm:22": { isbn13, coverUrl } }
  const out = [];
  const targets = only ? series.filter((s) => s.id === only) : series;

  for (const s of targets) {
    console.log(`\n${s.title}${s.edition && s.edition !== "Standard" ? ` (${s.edition})` : ""} — ${s.volumes} volumes`);

    if (staleMeta(cache[`meta:${s.id}`])) {
      try {
        const media = await anilist(s.searchTitle || s.title);
        cache[`meta:${s.id}`] = {
          fetchedAt: new Date().toISOString(),
          anilistId: media.id,
          anilistVolumes: media.volumes || null,
          seriesCover: media.coverImage?.extraLarge || media.coverImage?.large || null,
          genres: media.genres, status: media.status, year: media.startDate?.year,
          author: media.staff?.edges?.find((e) => /story|art/i.test(e.role))?.node?.name?.full || null,
        };
        console.log(`   metadata ok (AniList #${media.id})`);
      } catch (err) {
        console.log(`   metadata failed: ${err.message}`);
        cache[`meta:${s.id}`] = { fetchedAt: new Date().toISOString(), error: String(err.message) };
      }
      await sleep(2100);                            // AniList: 30 requests/minute
    }

    // AniList sometimes knows the count before the shops list the book. When it
    // reports more volumes than series.json has, trust it and write it back.
    const anilistCount = cache[`meta:${s.id}`]?.anilistVolumes || 0;
    if (checkNew && anilistCount > s.volumes) {
      console.log(`   count updated: ${s.volumes} → ${anilistCount} (AniList)`);
      s.volumes = anilistCount;
      seriesChanged = true;
    }
    const ceiling = checkNew
      ? Math.max(s.volumes, anilistCount, knownMax(cache, s.id) + PROBE_AHEAD)
      : s.volumes;

    for (let vol = 1; vol <= ceiling; vol++) {
      const key = `${s.id}:${vol}`;
      if (overrides[key]) { cache[key] = { ...overrides[key], source: "manual" }; }
      const cached = cache[key];
      if (cached?.isbn13) { out.push({ seriesId: s.id, volume: vol, ...cached }); continue; }
      // A previous miss is retried on --check-new: the volume may exist now.
      if (cached?.missing && !checkNew) continue;

      let hit = null;
      try { hit = await googleBooksVolume(s, vol); } catch (err) { console.log(`   vol ${vol}: ${err.message}`); }
      await sleep(GB_KEY ? 350 : 1600);             // unkeyed quota is small — get a key

      if (hit && !hit.coverUrl) hit.coverUrl = await openLibraryCover(hit.isbn13);

      if (!hit) {
        cache[key] = { missing: true, checkedAt: new Date().toISOString() };
        // Past the known run, one miss means we've reached the end for now.
        if (vol > s.volumes) { console.log(`   vol ${vol}: not out yet — stopping here`); break; }
        console.log(`   vol ${vol}: no match — add it to overrides.json`);
        continue;
      }

      if (download && hit.coverUrl) {
        const file = await fetchCover(hit.coverUrl, hit.isbn13);
        hit.file = file;
        if (!file) console.log(`   vol ${vol}: cover download failed (${hit.isbn13})`);
      }

      cache[key] = hit;
      out.push({ seriesId: s.id, volume: vol, ...hit });
      if (vol > s.volumes) {
        fresh.push({ seriesId: s.id, series: s.title, edition: s.edition || "Standard", volume: vol, isbn13: hit.isbn13, title: hit.title });
        s.volumes = vol;              // series.json is rewritten below
        seriesChanged = true;
        console.log(`   vol ${vol}: NEW — ${hit.isbn13}`);
      } else {
        console.log(`   vol ${vol}: ${hit.isbn13}${hit.coverUrl ? "" : " (no cover)"}`);
      }
      await fs.writeFile(CACHE, JSON.stringify(cache, null, 2));   // resumable
    }
  }

  await fs.writeFile(CACHE, JSON.stringify(cache, null, 2));
  await fs.writeFile(OUT, JSON.stringify(out, null, 2));
  await fs.writeFile("new-volumes.json", JSON.stringify(fresh, null, 2));
  if (seriesChanged) await fs.writeFile("series.json", JSON.stringify(series, null, 2));

  if (fresh.length) {
    console.log(`\nNew volumes found:`);
    for (const f of fresh) console.log(`   ${f.series}${f.edition !== "Standard" ? ` (${f.edition})` : ""} vol. ${f.volume} — ${f.isbn13}`);
  } else if (checkNew) {
    console.log(`\nNo new volumes this run.`);
  }

  const withCover = out.filter((v) => v.coverUrl).length;
  const missing = Object.entries(cache).filter(([, v]) => v?.missing).map(([k]) => k);
  console.log(`\nWrote ${out.length} volumes to ${OUT} (${withCover} with covers).`);
  if (missing.length) console.log(`Unmatched (${missing.length}): ${missing.slice(0, 20).join(", ")}${missing.length > 20 ? " …" : ""}`);
  console.log(`Next: resize to 3 widths as WebP, upload to R2, and point coverImage() at your own URLs.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
