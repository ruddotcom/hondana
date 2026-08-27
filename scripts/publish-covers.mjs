#!/usr/bin/env node
/**
 * Resize the covers ingest-covers.mjs downloaded and push them to R2.
 *
 *   npm i sharp
 *   node publish-covers.mjs            # anything not published yet
 *   node publish-covers.mjs --all      # re-do everything (after a size change)
 *
 * Needs, in the environment:
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_API_TOKEN   (Workers R2 Storage: Edit)
 *   R2_BUCKET              (defaults to hondana-covers)
 *
 * Writes <bucket>/<width>/<isbn>.webp for each width, and records what it has
 * uploaded in .published.json so repeat runs only touch new files.
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";

const run = promisify(execFile);
const WIDTHS = [120, 300, 600];        // spine thumb, card, cover-out / detail
const BUCKET = process.env.R2_BUCKET || "hondana-covers";
const STATE = ".published.json";
const all = process.argv.includes("--all");

const load = async (f, d) => { try { return JSON.parse(await fs.readFile(f, "utf8")); } catch { return d; } };

async function upload(key, file) {
  await run("npx", ["--yes", "wrangler", "r2", "object", "put", `${BUCKET}/${key}`,
    "--file", file, "--content-type", "image/webp", "--remote"], {
    env: process.env, maxBuffer: 1024 * 1024 * 8,
  });
}

async function main() {
  const volumes = await load("volumes.json", []);
  const done = all ? {} : await load(STATE, {});
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "hondana-"));

  const todo = volumes.filter((v) => v.isbn13 && v.file && !done[v.isbn13]);
  if (!todo.length) { console.log("Nothing new to publish."); return; }
  console.log(`Publishing ${todo.length} covers at ${WIDTHS.join(", ")}px…`);

  let ok = 0;
  for (const v of todo) {
    try {
      for (const width of WIDTHS) {
        const out = path.join(tmp, `${v.isbn13}-${width}.webp`);
        await sharp(v.file).resize({ width, withoutEnlargement: true })
          .webp({ quality: 80 }).toFile(out);
        await upload(`${width}/${v.isbn13}.webp`, out);
      }
      done[v.isbn13] = new Date().toISOString();
      ok += 1;
      await fs.writeFile(STATE, JSON.stringify(done, null, 2));   // resumable
      console.log(`   ${v.seriesId} vol. ${v.volume} → ${v.isbn13}`);
    } catch (err) {
      console.log(`   FAILED ${v.isbn13}: ${err.message.split("\n")[0]}`);
    }
  }

  await fs.rm(tmp, { recursive: true, force: true });
  console.log(`\nPublished ${ok}/${todo.length}. They're live at`);
  console.log(`   https://<your-r2-domain>/600/<isbn>.webp`);
}

main().catch((err) => { console.error(err); process.exit(1); });
