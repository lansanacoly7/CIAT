import { chromium } from "../frontend/node_modules/playwright/index.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT_DIR, "docs", "maquettes");
const ARTIFACTS_DIR = "C:\\Users\\pc\\.gemini\\antigravity-ide\\brain\\3f5932c3-7a0a-4973-9201-9e4e63fb70ac";

const BASE_URL = "http://localhost:3000";
const API_URL = "http://localhost:8000/api";

async function fetchTokens(email = "porteur@ciat.sn", password = "Ciat2026!") {
  const res = await fetch(`${API_URL}/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Échec d'authentification pour ${email}: ${res.status}`);
  }
  return await res.json();
}

async function cleanDevOverlays(page) {
  await page.addStyleTag({
    content: `
      nextjs-portal,
      [data-nextjs-toast],
      [data-nextjs-dialog-overlay],
      #next-route-announcer,
      .__next-dev-overlay {
        display: none !important;
        visibility: hidden !important;
      }
    `,
  });
}

const PAGES_MAIMOUNA = [
  {
    id: "01_depot_candidature",
    title: "Dépôt de candidature (Incubateur)",
    route: "/incubateur",
    fullPage: true,
  },
  {
    id: "02_suivi_projets",
    title: "Suivi de mes projets (Liste)",
    route: "/incubateur/projets",
    fullPage: false,
  },
  {
    id: "03_projet_detail",
    title: "Fiche détaillée d'un projet & Suivi",
    route: "/incubateur/projets/67",
    fullPage: true,
  },
  {
    id: "04_alertes_retard",
    title: "Alertes de retard",
    route: "/incubateur/alertes",
    fullPage: true,
  },
  {
    id: "05_mon_compte",
    title: "Mon profil & Compte",
    route: "/compte",
    fullPage: true,
  },
  {
    id: "06_assistant_ia",
    title: "Assistant IA du CIAT",
    route: "/assistant",
    fullPage: false,
  },
];

async function run() {
  console.log("🚀 Lancement de la capture de toutes les pages de Maimouna...");
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const tokens = await fetchTokens();
  const browser = await chromium.launch({ headless: true });

  for (const pageConfig of PAGES_MAIMOUNA) {
    console.log(`\n📸 Capture : ${pageConfig.title} (${pageConfig.route})...`);

    // 1. Desktop (1440 x 900)
    {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1.5,
      });
      await context.addInitScript(({ access, refresh }) => {
        localStorage.setItem("ciat_access", access);
        localStorage.setItem("ciat_refresh", refresh);
      }, tokens);

      const page = await context.newPage();
      try {
        await page.goto(`${BASE_URL}${pageConfig.route}`, { waitUntil: "networkidle", timeout: 20000 });
      } catch (e) {
        console.warn(`Timeout navigation partiel pour ${pageConfig.route}, suite normale...`);
      }
      await page.waitForTimeout(1500);
      await cleanDevOverlays(page);

      const desktopFileName = `${pageConfig.id}_desktop.png`;
      const desktopPath = path.resolve(OUT_DIR, desktopFileName);
      await page.screenshot({ path: desktopPath, fullPage: pageConfig.fullPage });
      console.log(`  ✅ Desktop ok: ${desktopFileName}`);

      // Copie vers dossier artifacts
      fs.copyFileSync(desktopPath, path.join(ARTIFACTS_DIR, desktopFileName));
      await context.close();
    }

    // 2. Mobile (390 x 844)
    {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2.0,
        isMobile: true,
        hasTouch: true,
      });
      await context.addInitScript(({ access, refresh }) => {
        localStorage.setItem("ciat_access", access);
        localStorage.setItem("ciat_refresh", refresh);
      }, tokens);

      const page = await context.newPage();
      try {
        await page.goto(`${BASE_URL}${pageConfig.route}`, { waitUntil: "networkidle", timeout: 20000 });
      } catch (e) {
        console.warn(`Timeout navigation partiel mobile pour ${pageConfig.route}, suite normale...`);
      }
      await page.waitForTimeout(1500);
      await cleanDevOverlays(page);

      const mobileFileName = `${pageConfig.id}_mobile.png`;
      const mobilePath = path.resolve(OUT_DIR, mobileFileName);
      await page.screenshot({ path: mobilePath, fullPage: pageConfig.fullPage });
      console.log(`  ✅ Mobile ok: ${mobileFileName}`);

      // Copie vers dossier artifacts
      fs.copyFileSync(mobilePath, path.join(ARTIFACTS_DIR, mobileFileName));
      await context.close();
    }
  }

  await browser.close();
  console.log("\n🎉 Toutes les pages de Maimouna ont été capturées avec succès (Desktop + Mobile) !");
}

run().catch((err) => {
  console.error("❌ Erreur pendant les captures :", err);
  process.exit(1);
});
