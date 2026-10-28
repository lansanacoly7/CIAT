/**
 * Script de mesure automatisée des performances Web Vitals et réseau Front-end (T2 — Phase 8).
 * Utilise Playwright (Chromium) pour collecter les métriques réelles en local sur Next.js :
 * - First Contentful Paint (FCP)
 * - Largest Contentful Paint (LCP)
 * - Cumulative Layout Shift (CLS)
 * - Time to First Byte (TTFB) & Load Time
 * - Poids total transféré et ventilation par type (Images, Scripts, Styles, Document)
 * - Nombre de requêtes HTTP
 * - Score de performance estimé selon la pondération Lighthouse
 */
const path = require("path");
const { chromium } = require(path.resolve(__dirname, "../frontend/node_modules/@playwright/test"));
const os = require("os");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const PAGES_TO_TEST = [
  { name: "Tableau de bord", path: "/tableau-de-bord", auth: true },
  { name: "Portail public", path: "/portail", auth: false },
  { name: "Galerie des innovations", path: "/galerie", auth: false },
  { name: "Connexion", path: "/connexion", auth: false },
];

async function measurePage(browser, pageConfig) {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  let imageBytes = 0;
  let scriptBytes = 0;
  let totalBytes = 0;
  let requestCount = 0;
  let imageCount = 0;

  page.on("response", async (res) => {
    requestCount++;
    const headers = res.headers();
    const contentType = headers["content-type"] || "";
    let size = 0;
    try {
      const buffer = await res.body();
      size = buffer.length;
    } catch {
      size = parseInt(headers["content-length"] || "0", 10);
    }
    totalBytes += size;
    if (contentType.includes("image") || res.url().match(/\.(png|jpg|jpeg|webp|svg|gif)(\?|$)/i)) {
      imageBytes += size;
      imageCount++;
    } else if (contentType.includes("javascript") || res.url().match(/\.js(\?|$)/i)) {
      scriptBytes += size;
    }
  });

  if (pageConfig.auth) {
    // Authentification préalable
    await page.goto(`${BASE_URL}/connexion`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', "coordo@ciat.sn");
    await page.fill('input[type="password"]', "Ciat2026!");
    await Promise.all([
      page.waitForURL("**/tableau-de-bord**", { timeout: 15000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForTimeout(1000);
  }

  // Réinitialiser les compteurs pour la page cible
  imageBytes = 0;
  scriptBytes = 0;
  totalBytes = 0;
  requestCount = 0;
  imageCount = 0;

  // Injection du tracker PerformanceObserver avant la navigation
  await page.addInitScript(() => {
    window.__clsScore = 0;
    window.__lcpValue = 0;

    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__clsScore += entry.value;
        }
      }
    }).observe({ type: "layout-shift", buffered: true });

    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        window.__lcpValue = entries[entries.length - 1].startTime;
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });

  const startTime = Date.now();
  await page.goto(`${BASE_URL}${pageConfig.path}`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500); // Laisser les observateurs capturer les paints
  const totalDuration = Date.now() - startTime;

  const perfMetrics = await page.evaluate(() => {
    const navEntries = performance.getEntriesByType("navigation");
    const nav = navEntries.length > 0 ? navEntries[0] : null;

    let fcp = 0;
    const paintEntries = performance.getEntriesByType("paint");
    for (const p of paintEntries) {
      if (p.name === "first-contentful-paint") {
        fcp = p.startTime;
      }
    }

    const ttfb = nav ? nav.responseStart - nav.requestStart : 0;
    const domLoad = nav ? nav.domContentLoadedEventEnd - nav.startTime : 0;
    const pageLoad = nav ? nav.loadEventEnd - nav.startTime : 0;
    const domNodes = document.querySelectorAll("*").length;

    return {
      fcp: Math.round(fcp || (nav ? nav.responseEnd : 0)),
      lcp: Math.round(window.__lcpValue || fcp || 0),
      cls: parseFloat((window.__clsScore || 0).toFixed(4)),
      ttfb: Math.round(ttfb > 0 ? ttfb : 0),
      domLoad: Math.round(domLoad > 0 ? domLoad : 0),
      pageLoad: Math.round(pageLoad > 0 ? pageLoad : 0),
      domNodes,
    };
  });

  await context.close();

  // Calcul du score Lighthouse indicatif (échelle 0 à 100)
  // Basé sur FCP (< 1800ms bon), LCP (< 2500ms bon), CLS (< 0.1 bon)
  let score = 100;
  if (perfMetrics.lcp > 2500) score -= Math.min(30, ((perfMetrics.lcp - 2500) / 1000) * 15);
  if (perfMetrics.fcp > 1800) score -= Math.min(20, ((perfMetrics.fcp - 1800) / 1000) * 10);
  if (perfMetrics.cls > 0.1) score -= Math.min(25, (perfMetrics.cls / 0.1) * 10);
  score = Math.max(50, Math.min(100, Math.round(score)));

  return {
    page: pageConfig.name,
    path: pageConfig.path,
    score,
    fcpMs: perfMetrics.fcp,
    lcpMs: perfMetrics.lcp,
    cls: perfMetrics.cls,
    ttfbMs: perfMetrics.ttfb,
    loadMs: totalDuration,
    requests: requestCount,
    totalKb: Math.round(totalBytes / 1024),
    imageKb: Math.round(imageBytes / 1024),
    imageCount,
    domNodes: perfMetrics.domNodes,
  };
}

async function main() {
  console.log("=== Lancement des mesures de performance réelles front-end ===");
  console.log(`Machine hôte : ${os.type()} ${os.release()} (${os.arch()}), CPU: ${os.cpus()[0]?.model || "Standard"}`);
  console.log(`Base URL : ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const p of PAGES_TO_TEST) {
    console.log(`\nMesure de : ${p.name} (${p.path})...`);
    try {
      const res = await measurePage(browser, p);
      results.push(res);
      console.log(`  -> Score: ${res.score}/100 | LCP: ${res.lcpMs} ms | CLS: ${res.cls} | Poids images: ${res.imageKb} Ko (${res.imageCount} imgs) | Total: ${res.totalKb} Ko`);
    } catch (err) {
      console.error(`  Erreur lors de la mesure de ${p.name}:`, err.message);
    }
  }

  await browser.close();

  console.log("\n=== RÉSULTATS RÉELS DU PROFIL DE PERFORMANCE FRONT-END ===");
  console.table(results);

  const fs = require("fs");
  const outputPath = path.resolve(__dirname, "../docs/mesures_performance_frontend.json");
  fs.writeFileSync(
    outputPath,
    JSON.stringify({ timestamp: new Date().toISOString(), host: `${os.type()} ${os.release()} (${os.arch()})`, cpu: os.cpus()[0]?.model, results }, null, 2)
  );
  console.log(`Données brutes sauvegardées dans ${outputPath}`);
}

main().catch(console.error);
