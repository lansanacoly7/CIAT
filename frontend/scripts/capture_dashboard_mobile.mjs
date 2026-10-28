import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const API = process.env.API_URL || 'http://localhost:8000/api';
const PASSWORD = process.env.DEMO_PASSWORD || 'Ciat2026!';
const TARGET_DIR = path.resolve('../docs/design/dashboard_mobile');

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

const prefix = process.argv[2] || 'avant';

async function obtenirJetons(email) {
  const res = await fetch(`${API}/auth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Connexion impossible pour ${email} (${res.status})`);
  return res.json();
}

async function capture() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();

  // Connexion coordo
  const tokens = await obtenirJetons('coordo@ciat.sn');
  await page.goto('http://localhost:3000/');
  await page.evaluate(({ access, refresh }) => {
    localStorage.setItem('ciat_access', access);
    localStorage.setItem('ciat_refresh', refresh);
  }, tokens);

  const screens = [
    { name: '01_vue_d_ensemble', url: 'http://localhost:3000/tableau-de-bord?vue=vue-d-ensemble' },
    { name: '02_projets', url: 'http://localhost:3000/tableau-de-bord?vue=projets' },
    { name: '03_financements', url: 'http://localhost:3000/tableau-de-bord?vue=financements' },
    { name: '04_registre', url: 'http://localhost:3000/tableau-de-bord?vue=registre' },
    { name: '05_methodologie', url: 'http://localhost:3000/tableau-de-bord/methodologie' },
  ];

  for (const s of screens) {
    console.log(`Capture ${prefix} de ${s.name}...`);
    await page.goto(s.url);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const filePath = path.join(TARGET_DIR, `${prefix}_${s.name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`Sauvegardé : ${filePath}`);
  }

  // Modale Registre
  console.log(`Capture ${prefix} de la modale Registre...`);
  await page.goto('http://localhost:3000/tableau-de-bord?vue=registre');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  const openModalBtn = page.locator('button[title*="historique"], button:has-text("Historique")').first();
  if (await openModalBtn.isVisible()) {
    await openModalBtn.click();
    await page.waitForTimeout(500);
    const modalPath = path.join(TARGET_DIR, `${prefix}_06_registre_modale.png`);
    await page.screenshot({ path: modalPath, fullPage: false });
    console.log(`Sauvegardé : ${modalPath}`);
  }

  await browser.close();
  console.log(`Toutes les captures ${prefix} sont terminées dans ${TARGET_DIR}`);
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
