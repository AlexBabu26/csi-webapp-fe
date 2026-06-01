import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:3000/';
const OUT = 'D:/CSI Projects/Youth Movement/ui-review';
const DESKTOP = { width: 1366, height: 900 };
const MOBILE = { width: 390, height: 844 };

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const PUBLIC = [
  ['01-public-home', '#/'],
  ['02-login', '#/login'],
  ['03-register', '#/register'],
  ['04-kalamela-public', '#/kalamela'],
  ['05-kalamela-results', '#/kalamela/results'],
  ['06-conference-public', '#/conference'],
  ['07-yuvalokham-public', '#/yuvalokham'],
  ['08-yuvalokham-login', '#/yuvalokham/login'],
  ['09-yuvalokham-register', '#/yuvalokham/register'],
];

const ADMIN = [
  ['10-admin-dashboard', '#/admin/dashboard'],
  ['11-admin-units', '#/admin/units'],
  ['12-admin-not-onboarded', '#/admin/units/not-onboarded'],
  ['13-admin-officials', '#/admin/officials'],
  ['14-admin-councilors', '#/admin/councilors'],
  ['15-admin-members', '#/admin/members'],
  ['16-admin-archived-members', '#/admin/archived-members'],
  ['17-admin-blood-donor-search', '#/admin/blood-donor-search'],
  ['18-admin-req-transfers', '#/admin/requests/transfers'],
  ['19-admin-req-member-info', '#/admin/requests/member-info'],
  ['20-admin-req-officials', '#/admin/requests/officials'],
  ['21-admin-req-councilors', '#/admin/requests/councilors'],
  ['22-admin-req-member-add', '#/admin/requests/member-add'],
  ['23-admin-payments', '#/admin/payments'],
  ['24-admin-payment-settings', '#/admin/payments/settings'],
  ['25-admin-export', '#/admin/export'],
  ['26-admin-site-settings', '#/admin/site-settings'],
  ['27-admin-user-management', '#/admin/user-management'],
  ['28-conf-admin-home', '#/admin/conference/home'],
  ['29-conf-admin-officials', '#/admin/conference/officials'],
  ['30-conf-admin-info', '#/admin/conference/info'],
  ['31-conf-admin-payments', '#/admin/conference/payments'],
  ['32-kala-admin-events', '#/kalamela/admin/events'],
  ['33-kala-admin-schedules', '#/kalamela/admin/schedules'],
  ['34-kala-admin-categories', '#/kalamela/admin/categories'],
  ['35-kala-admin-master-data', '#/kalamela/admin/master-data'],
  ['36-kala-admin-scores', '#/kalamela/admin/scores'],
  ['37-kala-admin-results', '#/kalamela/admin/results'],
  ['38-kala-admin-payments', '#/kalamela/admin/payments'],
  ['39-kala-admin-appeals', '#/kalamela/admin/appeals'],
  ['40-kala-official-home', '#/kalamela/official/home'],
  ['41-kala-official-participants', '#/kalamela/official/participants'],
  ['42-kala-official-preview', '#/kalamela/official/preview'],
  ['43-kala-top-performers', '#/kalamela/top-performers'],
];

const UNIT = [
  ['50-unit-register-wizard', '#/register/wizard'],
  ['51-unit-update-locations', '#/unit/update-locations'],
  ['52-unit-my-requests', '#/unit/my-requests'],
  ['53-unit-submit-transfer', '#/unit/submit-transfer'],
  ['54-unit-submit-member-info', '#/unit/submit-member-info'],
  ['55-unit-submit-officials', '#/unit/submit-officials'],
  ['56-unit-submit-councilor', '#/unit/submit-councilor'],
  ['57-unit-submit-member-add', '#/unit/submit-member-add'],
];

const report = [];

async function capture(page, label, hash) {
  const entry = { label, hash };
  try {
    await page.evaluate((h) => { window.location.hash = h; }, hash);
    await page.waitForTimeout(1500);
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

    // Desktop
    await page.setViewportSize(DESKTOP);
    await page.waitForTimeout(500);
    const d = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      iw: window.innerWidth,
      title: document.title,
      bodyText: (document.body.innerText || '').slice(0, 120),
    }));
    entry.desktop = { scrollWidth: d.sw, innerWidth: d.iw, overflow: d.sw - d.iw };
    entry.curHash = await page.evaluate(() => window.location.hash);
    entry.bodyText = d.bodyText.replace(/\s+/g, ' ').trim();
    await page.screenshot({ path: path.join(OUT, `${label}_desktop.png`), fullPage: true });

    // Mobile
    await page.setViewportSize(MOBILE);
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      iw: window.innerWidth,
    }));
    entry.mobile = { scrollWidth: m.sw, innerWidth: m.iw, overflow: m.sw - m.iw };
    await page.screenshot({ path: path.join(OUT, `${label}_mobile.png`), fullPage: true });
  } catch (e) {
    entry.error = String(e).slice(0, 200);
  }
  report.push(entry);
  console.log(`${label.padEnd(34)} dHash=${(entry.curHash||'').padEnd(34)} dOvf=${entry.desktop?.overflow ?? 'ERR'} mOvf=${entry.mobile?.overflow ?? 'ERR'}`);
}

async function login(page, username, password) {
  await page.goto(BASE + '#/login', { waitUntil: 'networkidle' });
  await page.fill('#email', username);
  await page.fill('#password', password);
  await page.click('button[type=submit]');
  await page.waitForFunction(() => !window.location.hash.includes('/login'), null, { timeout: 15000 })
    .catch(() => console.log('  (login navigation timeout)'));
  await page.waitForTimeout(1500);
  const hash = await page.evaluate(() => window.location.hash);
  const utype = await page.evaluate(() => localStorage.getItem('user_type'));
  console.log(`  logged in ${username} -> hash=${hash} user_type=${utype}`);
}

(async () => {
  const browser = await chromium.launch();

  // ---- PUBLIC ----
  let ctx = await browser.newContext({ viewport: DESKTOP });
  let page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  console.log('=== PUBLIC ===');
  for (const [l, h] of PUBLIC) await capture(page, l, h);
  await ctx.close();

  // ---- ADMIN ----
  ctx = await browser.newContext({ viewport: DESKTOP });
  page = await ctx.newPage();
  console.log('=== ADMIN (login) ===');
  await login(page, 'admin', 'admin');
  for (const [l, h] of ADMIN) await capture(page, l, h);
  await ctx.close();

  // ---- UNIT ----
  ctx = await browser.newContext({ viewport: DESKTOP });
  page = await ctx.newPage();
  console.log('=== UNIT (login) ===');
  await login(page, '9539922014', 'TkPncAtH6a');
  for (const [l, h] of UNIT) await capture(page, l, h);
  await ctx.close();

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log('\nDONE. Report written to report.json');
})();
