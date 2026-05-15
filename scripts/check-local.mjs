#!/usr/bin/env node
/**
 * Quick smoke test for local dev URLs. Run from repo root: npm run check:local
 */
import http from "node:http";

function get(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 4000 }, (res) => {
      let body = "";
      res.on("data", (c) => {
        body += c;
      });
      res.on("end", () => {
        resolve({ ok: true, status: res.statusCode, url, snippet: body.slice(0, 120) });
      });
    });
    req.on("error", (err) => resolve({ ok: false, url, error: err.code || err.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, url, error: "timeout" });
    });
  });
}

const checks = [
  ["API (Nest)", "http://127.0.0.1:4000/api"],
  ["API venues (DB)", "http://127.0.0.1:4000/api/mobile/venues"],
  ["Web :3000", "http://127.0.0.1:3000/"],
  ["Web :3002", "http://127.0.0.1:3002/"],
  ["Admin :3001", "http://127.0.0.1:3001/"],
];

console.log("Rezervame — local dev check (127.0.0.1)\n");

for (const [label, url] of checks) {
  const r = await get(url);
  const ok = r.ok && r.status && (r.status < 400 || r.status === 307 || r.status === 308);
  if (ok) {
    console.log(`  OK   ${label.padEnd(18)} ${url}  → HTTP ${r.status}`);
  } else {
    console.log(`  FAIL ${label.padEnd(18)} ${url}  → ${r.error || `HTTP ${r.status}`}`);
  }
}

console.log(`
If anything failed:

  1) Database + API (port 4000)
     cd Backend && docker compose up -d
     cd Backend && npm install && npm run db:setup && npm run start:dev
     Or one step:  cd Backend && npm run dev:local

  2) Web (port 3000)
     cd Web && npm install && npm run dev
     If the UI loads but search hangs, ensure the API is up. Optional Web/.env.local:
     NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4000/api

  3) Admin (port 3001)
     cd Admin && npm install && npm run dev

  Next.js "Cannot find module" chunk errors:  cd Web && npm run dev:clean
`);
