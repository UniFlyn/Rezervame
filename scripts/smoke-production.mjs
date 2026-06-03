#!/usr/bin/env node
/**
 * Production smoke test — run with backend up:
 *   API_BASE=http://localhost:4000 node scripts/smoke-production.mjs
 */
const origin = (process.env.API_BASE || "https://rezervame.onrender.com").replace(/\/$/, "");
const apiBase = origin.endsWith("/api") ? origin : `${origin}/api`;

async function req(path, opts = {}) {
  const url = `${apiBase}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

function assert(name, ok, detail = "") {
  if (!ok) {
    console.error(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
    process.exitCode = 1;
    return false;
  }
  console.log(`OK: ${name}`);
  return true;
}

async function main() {
  console.log(`Smoke test → ${apiBase}\n`);

  const healthUrl = `${origin}/api/v1/health`;
  const health = await fetch(healthUrl);
  assert("health", health.status === 200);

  const payCfg = await req("/public/payment-config");
  assert("payment-config", payCfg.status === 200 && Array.isArray(payCfg.body?.methods));

  const badLogin = await req("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "nobody@example.com", password: "wrong" }),
  });
  assert("login rejects bad creds", badLogin.status === 400);

  const goodLogin = await req("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "customer@rezervame.com", password: "password" }),
  });
  const token = goodLogin.body?.token;
  assert(
    "login returns JWT or legacy token",
    [200, 201].includes(goodLogin.status) && typeof token === "string" && token.length > 10,
  );

  if (token) {
    const session = await req("/auth/user-session", {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert("user-session with token", session.status === 200 && session.body?.email);
  }

  const googleBad = await req("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken: "invalid" }),
  });
  assert("google rejects invalid token", googleBad.status === 400);

  console.log("\nDone.", process.exitCode ? "Some checks failed." : "All checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
