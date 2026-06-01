#!/usr/bin/env node
/**
 * Repairs es.json entries corrupted by MyMemory API quota errors.
 * Usage: node scripts/repair-es-locales.mjs [es.json path]
 */
import fs from "fs";
import path from "path";
import { EN_TO_ES, isBadTranslation, translateEn } from "./shared-es-overrides.mjs";

const root = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const esPath = process.argv[2] || path.join(root, "shared/locales/es.json");
const enPath = path.join(path.dirname(esPath), "en.json");

const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
const es = JSON.parse(fs.readFileSync(esPath, "utf8"));

let fixed = 0;
let missing = [];

for (const key of Object.keys(es)) {
  if (!isBadTranslation(es[key])) continue;
  const source = en[key];
  const translated = translateEn(source);
  if (translated) {
    es[key] = translated;
    fixed += 1;
  } else {
    missing.push({ key, source: String(source).slice(0, 80) });
  }
}

fs.writeFileSync(esPath, `${JSON.stringify(es, null, 2)}\n`);

console.log(`Repaired ${fixed} keys in ${esPath}`);
if (missing.length) {
  console.warn(`Still missing ${missing.length} translations — add to shared-es-overrides.mjs:`);
  missing.slice(0, 20).forEach((m) => console.warn(`  ${m.key}: ${m.source}`));
  process.exitCode = 1;
} else {
  const remaining = Object.values(es).filter(isBadTranslation).length;
  console.log(`Remaining MYMEMORY entries: ${remaining}`);
}
