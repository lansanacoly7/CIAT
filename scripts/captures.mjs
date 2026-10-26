/**
 * scripts/captures.mjs
 * Générateur automatisé de maquettes pour le livrable T3 (Lansana / CIAT)
 * Captures 1440px (ordinateur) et 390px (mobile) pour les 9 parcours clés.
 */

import { chromium } from "../frontend/node_modules/playwright/index.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT_DIR, "docs", "maquettes");

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const API_URL = process.env.API_URL || "http://localhost:8000/api";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, isMobile: false },
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true },
];

/**
 * Récupère les jetons JWT pour un utilisateur de démo
 */
async function fetchTokens(email, password = "Ciat2026!") {
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

/**
 * Configure les jetons dans le localStorage d'un contexte Playwright
 */
async function setupAuth(context, tokens) {
  await context.addInitScript(({ access, refresh }) => {
    localStorage.setItem("ciat_access", access);
    localStorage.setItem("ciat_refresh", refresh);
  }, tokens);
}

/**
 * Nettoie les overlays de développement pour des captures de niveau production
 */
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

async function run() {
  console.log("🚀 Lancement du script de capture des maquettes CIAT...");
  console.log(`📡 URL Frontend: ${BASE_URL}`);
  console.log(`📡 URL Backend API: ${API_URL}`);
  console.log(`📁 Répertoire de sortie: ${OUT_DIR}\n`);

  let tokensCoordo = null;
  let tokensPorteur = null;
  let tokensComite = null;

  try {
    tokensCoordo = await fetchTokens("coordo@ciat.sn");
    tokensPorteur = await fetchTokens("porteur@ciat.sn");
    tokensComite = await fetchTokens("comite@ciat.sn");
    console.log("✅ Authentification API réussie pour les comptes démo.");
  } catch (err) {
    console.warn("⚠️ Impossible de récupérer les jetons API :", err.message);
  }

  const browser = await chromium.launch({ headless: true });

  const PARCOURS = [
    {
      id: "01_accueil",
      title: "Accueil principal",
      path: "/",
      auth: null,
      waitFor: "header",
    },
    {
      id: "02_portail_ciat",
      title: "Présentation du CIAT",
      path: "/portail/ciat",
      auth: null,
      waitFor: "main",
    },
    {
      id: "03_connexion",
      title: "Connexion",
      path: "/connexion",
      auth: null,
      waitFor: "form",
    },
    {
      id: "04_inscription",
      title: "Inscription",
      path: "/inscription",
      auth: null,
      waitFor: "form",
    },
    {
      id: "05_depot_dossier",
      title: "Dépôt de dossier (Porteur)",
      path: "/incubateur",
      auth: tokensPorteur,
      waitFor: "h1",
    },
    {
      id: "06_evaluation_comite",
      title: "Évaluation du comité",
      path: "/incubateur/evaluation",
      auth: tokensComite || tokensCoordo,
      waitFor: "main",
    },
    {
      id: "07_documents_ia",
      title: "Générateur de documents IA",
      path: "/documents",
      auth: tokensCoordo,
      waitFor: "main",
    },
    {
      id: "08_suivi_projets",
      title: "Suivi des projets incubés",
      path: "/incubateur/projets",
      auth: tokensCoordo,
      waitFor: "main",
    },
    {
      id: "09_suivi_projet_detail",
      title: "Détail de suivi d'un projet & bilans",
      path: "/incubateur/projets/1",
      auth: tokensCoordo,
      waitFor: "main",
    },
    {
      id: "10_galerie",
      title: "Galerie des innovations",
      path: "/galerie",
      auth: null,
      waitFor: "main",
    },
    {
      id: "11_tableau_de_bord",
      title: "Tableau de bord & Analytics",
      path: "/tableau-de-bord",
      auth: tokensCoordo,
      waitFor: "main",
    },
    {
      id: "12_assistant",
      title: "Assistant IA",
      path: "/assistant",
      auth: tokensCoordo,
      waitFor: "main",
    },
    {
      id: "13_mon_compte",
      title: "Espace Mon Compte",
      path: "/compte",
      auth: tokensPorteur,
      waitFor: "main",
    },
  ];

  for (const vp of VIEWPORTS) {
    console.log(`\n📸 Prise de captures format ${vp.name.toUpperCase()} (${vp.width}x${vp.height})...`);

    for (const p of PARCOURS) {
      const filename = `${p.id}_${vp.name}.png`;
      const filepath = path.join(OUT_DIR, filename);

      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
        deviceScaleFactor: 1.5,
      });

      if (p.auth) {
        await setupAuth(context, p.auth);
      }

      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}${p.path}`, { waitUntil: "networkidle", timeout: 15000 });
        if (p.waitFor) {
          await page.waitForSelector(p.waitFor, { timeout: 5000 }).catch(() => {});
        }
        await cleanDevOverlays(page);
        // Petit délai de stabilisation des animations/fonts
        await page.waitForTimeout(1000);

        await page.screenshot({ path: filepath, fullPage: false });
        console.log(`  ✓ [${vp.name}] ${p.title} -> ${filename}`);
      } catch (err) {
        console.error(`  ✗ [${vp.name}] Erreur sur ${p.title} (${p.path}):`, err.message);
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();
  console.log("\n🎉 Toutes les captures d'écran ont été générées avec succès dans docs/maquettes/ !");
}

run().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
