#!/usr/bin/env node
/**
 * Script de génération et régénération des supports de communication du CIAT.
 * Conforme aux exigences de la Phase 3 (Tâche T3 - Massogui).
 *
 * Génère :
 * - affiche_ciat_a4.png (Format A4)
 * - affiche_ciat_a4.pdf (Format A4 PDF)
 * - post_1_lancement.png (1080 x 1080 px)
 * - post_2_incubation.png (1080 x 1080 px)
 * - post_3_galerie.png (1080 x 1080 px)
 * - banniere_ciat_1200x630.png (1200 x 630 px)
 *
 * Utilise Playwright si disponible, ou le moteur Chrome Headless standard.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const COMM_DIR = path.join(ROOT_DIR, 'docs', 'communication');
const SOURCES_DIR = path.join(COMM_DIR, 'sources');

const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const ITEMS = [
  {
    name: 'Affiche A4 (PNG)',
    source: path.join(SOURCES_DIR, 'affiche_a4.html'),
    target: path.join(COMM_DIR, 'affiche_ciat_a4.png'),
    type: 'png',
    width: 1240,
    height: 1754,
  },
  {
    name: 'Affiche A4 (PDF)',
    source: path.join(SOURCES_DIR, 'affiche_a4.html'),
    target: path.join(COMM_DIR, 'affiche_ciat_a4.pdf'),
    type: 'pdf',
    width: 1240,
    height: 1754,
  },
  {
    name: 'Post Réseaux Sociaux 1 — Lancement',
    source: path.join(SOURCES_DIR, 'post_1_lancement.html'),
    target: path.join(COMM_DIR, 'post_1_lancement.png'),
    type: 'png',
    width: 1080,
    height: 1080,
  },
  {
    name: 'Post Réseaux Sociaux 2 — Incubation',
    source: path.join(SOURCES_DIR, 'post_2_incubation.html'),
    target: path.join(COMM_DIR, 'post_2_incubation.png'),
    type: 'png',
    width: 1080,
    height: 1080,
  },
  {
    name: 'Post Réseaux Sociaux 3 — Galerie & QR',
    source: path.join(SOURCES_DIR, 'post_3_galerie.html'),
    target: path.join(COMM_DIR, 'post_3_galerie.png'),
    type: 'png',
    width: 1080,
    height: 1080,
  },
  {
    name: 'Bannière de Partage 1200x630',
    source: path.join(SOURCES_DIR, 'banniere_partage.html'),
    target: path.join(COMM_DIR, 'banniere_ciat_1200x630.png'),
    type: 'png',
    width: 1200,
    height: 630,
  },
];

async function generateWithPlaywright(playwright) {
  console.log('Utilisation du moteur Playwright...');
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    for (const item of ITEMS) {
      const page = await browser.newPage({
        viewport: { width: item.width, height: item.height },
        deviceScaleFactor: 1,
      });
      const fileUrl = pathToFileURL(item.source).href;
      await page.goto(fileUrl, { waitUntil: 'networkidle' });

      if (item.type === 'png') {
        await page.screenshot({ path: item.target, type: 'png' });
      } else if (item.type === 'pdf') {
        await page.pdf({
          path: item.target,
          format: 'A4',
          printBackground: true,
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
        });
      }
      await page.close();
      const stats = fs.statSync(item.target);
      console.log(`[Playwright] ✓ ${item.name} généré (${stats.size} octets) -> ${path.basename(item.target)}`);
    }
  } finally {
    await browser.close();
  }
}

function generateWithChrome(chromePath) {
  console.log(`Utilisation du moteur Chrome Headless : ${chromePath}`);
  for (const item of ITEMS) {
    const fileUrl = pathToFileURL(item.source).href;
    if (item.type === 'png') {
      execFileSync(chromePath, [
        '--headless=new',
        `--screenshot=${item.target}`,
        `--window-size=${item.width},${item.height}`,
        '--default-background-color=00000000',
        '--hide-scrollbars',
        '--virtual-time-budget=2000',
        fileUrl,
      ], { stdio: 'pipe' });
    } else if (item.type === 'pdf') {
      execFileSync(chromePath, [
        '--headless=new',
        `--print-to-pdf=${item.target}`,
        '--no-pdf-header-footer',
        '--virtual-time-budget=2000',
        fileUrl,
      ], { stdio: 'pipe' });
    }
    const stats = fs.statSync(item.target);
    console.log(`[Chrome] ✓ ${item.name} généré (${stats.size} octets) -> ${path.basename(item.target)}`);
  }
}

async function main() {
  console.log('=== Génération du kit de communication officiel CIAT 360 ===\n');

  let usedPlaywright = false;
  try {
    const playwright = await import('playwright');
    if (playwright && playwright.chromium) {
      await generateWithPlaywright(playwright);
      usedPlaywright = true;
    }
  } catch {
    // Playwright non installé dans ce contexte, fallback Chrome headless
  }

  if (!usedPlaywright) {
    const chromePath = findChrome();
    if (!chromePath) {
      console.error('Erreur : Aucun moteur Chromium ou Chrome trouvé.');
      process.exit(1);
    }
    generateWithChrome(chromePath);
  }

  // Optimisation post-génération : Règle stricte < 500 Ko sur toutes les images
  const pythonBin = path.join(ROOT_DIR, 'backend', '.venv', 'Scripts', 'python.exe');
  if (fs.existsSync(pythonBin)) {
    console.log('\nApplication du compresseur adaptatif (< 500 Ko)...');
    try {
      execFileSync(pythonBin, [
        '-c',
        `from PIL import Image
import os
for f in ['affiche_ciat_a4.png', 'post_1_lancement.png', 'banniere_ciat_1200x630.png']:
    p = os.path.join(r"${COMM_DIR}", f)
    if os.path.exists(p) and os.path.getsize(p) > 500000:
        im = Image.open(p)
        q = im.convert('P', palette=Image.ADAPTIVE, colors=256)
        q.save(p, optimize=True)
        print(f"[Opt] {f} allégé -> {os.path.getsize(p)} octets")
`
      ], { stdio: 'inherit' });
    } catch {
      // Ignorer si non disponible
    }
  }

  console.log('\n=== Succès : Tous les livrables de communication sont générés dans docs/communication/ ===');
}

main().catch((err) => {
  console.error('Erreur de génération :', err);
  process.exit(1);
});
