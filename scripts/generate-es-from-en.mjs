#!/usr/bin/env node
/**
 * Generates es.json from en.json using MyMemory translate API (en|es).
 * Usage: node scripts/generate-es-from-en.mjs [path/to/en.json] [path/to/es.json]
 */
import fs from "fs";
import path from "path";

const enPath = process.argv[2] || path.join(process.cwd(), "Mobile/assets/translations/en.json");
const esPath = process.argv[3] || path.join(path.dirname(enPath), "es.json");

const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
const existingEs = fs.existsSync(esPath)
  ? JSON.parse(fs.readFileSync(esPath, "utf8"))
  : {};
const cache = new Map();

const SKIP_PATTERN =
  /^(https?:\/\/|data:|photo-|REZERVAME$|\$|\+?\d|#[0-9a-f]{3,8}$)/i;
const DO_NOT_TRANSLATE = new Set(["REZERVAME", "Yappy", "Google", "Facebook", "Instagram"]);

function shouldSkip(value) {
  const v = value.trim();
  if (!v) return true;
  if (SKIP_PATTERN.test(v)) return true;
  if (v.includes("@") && v.includes(".")) return true;
  if (/^\d+(\.\d+)?$/.test(v)) return true;
  if (DO_NOT_TRANSLATE.has(v)) return true;
  return false;
}

function isBadApiTranslation(text) {
  return /MYMEMORY WARNING|USAGE LIMITS|TRANSLATED\.NET\/DOC\/USAGELIMITS/i.test(text);
}

async function translateText(text) {
  const key = text.trim();
  if (cache.has(key)) return cache.get(key);

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(key)}&langpair=en|es`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const out = data?.responseData?.translatedText?.trim() || key;
  if (isBadApiTranslation(out)) {
    throw new Error("MyMemory quota exceeded — use scripts/repair-es-locales.mjs instead");
  }
  cache.set(key, out);
  await new Promise((r) => setTimeout(r, 350));
  return out;
}

async function main() {
  const keys = Object.keys(en);
  const es = {};
  let i = 0;
  for (const k of keys) {
    const v = en[k];
    if (typeof v !== "string") {
      es[k] = v;
      continue;
    }
    i += 1;
    if (shouldSkip(v)) {
      es[k] = v;
    } else {
      try {
        es[k] = await translateText(v);
        process.stdout.write(`\r[${i}/${keys.length}] ${k.slice(0, 40)}`);
      } catch (e) {
        console.warn(`\nSkip ${k}: ${e.message}`);
        // Keep existing es.json value when re-running; never write API errors to file.
        const prev = existingEs[k];
        es[k] =
          typeof prev === "string" && !isBadApiTranslation(prev) ? prev : v;
      }
    }
  }
  console.log(`\nWriting ${esPath}`);
  fs.writeFileSync(esPath, `${JSON.stringify(es, null, 2)}\n`);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
