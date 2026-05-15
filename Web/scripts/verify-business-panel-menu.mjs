#!/usr/bin/env node
/**
 * Ensures every merchant sidebar route has a Next.js page.
 * Menu source of truth: Backend MERCHANT_NAV_ITEMS + Sidebar FALLBACK_MENU (must stay aligned).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, '..');
const businessRoot = path.join(webRoot, 'src/app/business');

/** Path segments under /business that appear in the merchant panel sidebar (not login/join/public storefront). */
const MENU_SEGMENTS = [
  'dashboard',
  'appointments',
  'services',
  'staff',
  'users',
  'reviews',
  'transactions',
  'withdrawals',
  'profile',
  'settings',
  'support',
];

let failed = false;
for (const seg of MENU_SEGMENTS) {
  const pagePath = path.join(businessRoot, seg, 'page.tsx');
  if (!fs.existsSync(pagePath)) {
    console.error(`MISSING: /business/${seg} → expected ${path.relative(webRoot, pagePath)}`);
    failed = true;
  }
}

if (failed) {
  console.error(`\nverify-business-panel-menu: ${MENU_SEGMENTS.length} routes expected; fix missing pages.`);
  process.exit(1);
}

console.log(`verify-business-panel-menu: OK — ${MENU_SEGMENTS.length} sidebar routes have page.tsx`);
