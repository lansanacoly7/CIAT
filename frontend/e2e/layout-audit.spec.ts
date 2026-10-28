import { test, expect, Page } from "@playwright/test";

// Fonction d'audit de layout exécutée dans le contexte du navigateur
async function runLayoutChecks(page: Page, viewportName: string, tabName: string) {
  const result = await page.evaluate(() => {
    const violations: string[] = [];

    // 1. Contrôle du débordement horizontal
    const scrollWidth = document.documentElement.scrollWidth;
    const innerWidth = window.innerWidth;
    // Tolérance de 1px pour les arrondis sous-pixels
    if (scrollWidth > innerWidth + 1) {
      violations.push(
        `Débordement horizontal détecté : scrollWidth=${scrollWidth}px > innerWidth=${innerWidth}px`
      );
    }

    // 2. Contrôle du chevauchement de <text> SVG dans les graphiques
    const svgs = Array.from(document.querySelectorAll("svg.recharts-surface, .recharts-wrapper svg"));
    svgs.forEach((svg, svgIdx) => {
      const texts = Array.from(svg.querySelectorAll("text")).filter((t) => {
        const textStr = (t.textContent || "").trim();
        if (!textStr) return false;
        const rect = t.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      for (let i = 0; i < texts.length; i++) {
        for (let j = i + 1; j < texts.length; j++) {
          const t1 = texts[i];
          const t2 = texts[j];
          const r1 = t1.getBoundingClientRect();
          const r2 = t2.getBoundingClientRect();

          const xOverlap = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
          const yOverlap = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));

          // Chevauchement significatif supérieur à 3px sur chaque axe
          if (xOverlap > 3 && yOverlap > 3) {
            violations.push(
              `Chevauchement SVG text dans graphique #${svgIdx} : "${t1.textContent?.trim()}" chevauche "${t2.textContent?.trim()}" (overlap: ${Math.round(xOverlap)}x${Math.round(yOverlap)}px)`
            );
          }
        }
      }
    });

    // 3. Contrôle des dates ISO brutes
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName.toLowerCase();
          if (["script", "style", "noscript", "input", "textarea"].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.closest("[hidden], .sr-only, [aria-hidden='true']")) {
            return NodeFilter.FILTER_REJECT;
          }
          const text = node.textContent?.trim();
          if (!text) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    let currentNode = walker.nextNode();
    while (currentNode) {
      const text = currentNode.textContent?.trim() || "";
      if (/\b\d{4}-\d{2}-\d{2}\b/.test(text)) {
        violations.push(
          `Date ISO brute détectée dans le DOM : "${text}"`
        );
      }
      currentNode = walker.nextNode();
    }

    // 4. Contrôle des textes tronqués (scrollWidth > clientWidth) sans line-clamp ni tooltip prévu
    const candidates = Array.from(document.querySelectorAll("p, span, h1, h2, h3, h4, td, th, a, button"));
    candidates.forEach((el) => {
      if (el.closest(".sr-only") || el.classList.contains("sr-only")) return;

      if (el.children.length === 0 && (el.textContent || "").trim().length > 0) {
        const clientWidth = el.clientWidth;
        const scrollWidth = el.scrollWidth;

        if (scrollWidth > clientWidth + 2 && clientWidth > 0) {
          const hasTitle = Boolean(el.getAttribute("title") || el.closest("[title]"));
          const hasLineClamp = Boolean(
            el.className &&
              typeof el.className === "string" &&
              (el.className.includes("line-clamp") || el.className.includes("truncate"))
          ) || Boolean(el.closest(".truncate, .line-clamp-1, .line-clamp-2"));
          const hasAriaLabel = Boolean(el.getAttribute("aria-label") || el.closest("[aria-label]"));

          if (!hasTitle && !hasLineClamp && !hasAriaLabel) {
            violations.push(
              `Texte tronqué sans tooltip ni line-clamp : "${el.textContent?.trim().slice(0, 40)}..." (scrollWidth=${scrollWidth} > clientWidth=${clientWidth})`
            );
          }
        }
      }
    });

    return violations;
  });

  if (result.length > 0) {
    console.error(`Violations constatées [${viewportName} - ${tabName}] :`, result);
  }
  expect(result, `Erreurs de layout détectées sur [${viewportName} - ${tabName}]`).toHaveLength(0);
}

// Connexion préalable au tableau de bord
async function loginAndGoToDashboard(page: Page) {
  await page.goto("/connexion", { waitUntil: "domcontentloaded" });
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 15000 });
  await emailInput.fill("coordo@ciat.sn");
  await page.fill('input[type="password"]', "Ciat2026!");

  const [tokenResponse] = await Promise.all([
    page.waitForResponse((res) => res.url().includes("/auth/token/"), { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  expect(tokenResponse.status()).toBe(200);

  await page.waitForURL("**/tableau-de-bord**", { timeout: 20000 });
  // Attendre explicitement le chargement de l'entonnoir et des graphiques Recharts
  await page.locator("#entonnoir-heading").waitFor({ state: "attached", timeout: 25000 });
  await page.waitForSelector(".recharts-wrapper", { state: "visible", timeout: 15000 });
  await page.waitForTimeout(2500);
}

test.describe("Restructuration Tableau de Bord - Audit Layout & Hauteur", () => {
  const artifactDir = "C:/Users/senep/.gemini/antigravity-ide/brain/b04770f4-6af7-4914-8437-24431b6095b1";

  test("Desktop 1440px : Vue d'ensemble <= 1100px et audit des 4 onglets", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await loginAndGoToDashboard(page);

    // --- 1. ONGLET VUE D'ENSEMBLE ---
    // Vérification stricte : hauteur de la Vue d'ensemble <= 1100 px à 1440 px
    const overviewHeight = await page.evaluate(() => {
      const root = document.getElementById("dashboard-root");
      return root ? root.scrollHeight : document.body.scrollHeight;
    });
    console.log(`[E2E] Hauteur mesurée Vue d'ensemble à 1440px : ${overviewHeight} px`);
    expect(
      overviewHeight,
      `La hauteur de la Vue d'ensemble (${overviewHeight}px) doit être <= 1 100 px à 1440 px`
    ).toBeLessThanOrEqual(1100);

    // Audit layout (pas de scrollbar horizontale, pas de collision SVG, pas de texte tronqué)
    await runLayoutChecks(page, "desktop-1440", "vue-d-ensemble");

    // Capture d'écran Vue d'ensemble
    await page.screenshot({
      path: `${artifactDir}/dashboard_vue_d_ensemble_1440.png`,
      fullPage: true,
    });

    // --- 2. ONGLET PROJETS ---
    const tabProjets = page.locator("#tab-projets");
    await tabProjets.click();
    await page.waitForTimeout(1000);
    await runLayoutChecks(page, "desktop-1440", "projets");
    await page.screenshot({
      path: `${artifactDir}/dashboard_projets_1440.png`,
      fullPage: true,
    });

    // --- 3. ONGLET FINANCEMENTS ---
    const tabFinancements = page.locator("#tab-financements");
    await tabFinancements.click();
    await page.waitForTimeout(1000);
    await runLayoutChecks(page, "desktop-1440", "financements");
    await page.screenshot({
      path: `${artifactDir}/dashboard_financements_1440.png`,
      fullPage: true,
    });

    // --- 4. ONGLET REGISTRE ---
    const tabRegistre = page.locator("#tab-registre");
    await tabRegistre.click();
    await page.waitForTimeout(1000);
    await runLayoutChecks(page, "desktop-1440", "registre");
    await page.screenshot({
      path: `${artifactDir}/dashboard_registre_1440.png`,
      fullPage: true,
    });

    await context.close();
  });

  test("Mobile 390px : Audit des 4 onglets et captures", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await loginAndGoToDashboard(page);

    // --- 1. VUE D'ENSEMBLE ---
    await runLayoutChecks(page, "mobile-390", "vue-d-ensemble");
    await page.screenshot({
      path: `${artifactDir}/dashboard_vue_d_ensemble_390.png`,
      fullPage: true,
    });

    // --- 2. PROJETS ---
    await page.locator("#tab-projets").click();
    await page.waitForTimeout(1000);
    await runLayoutChecks(page, "mobile-390", "projets");
    await page.screenshot({
      path: `${artifactDir}/dashboard_projets_390.png`,
      fullPage: true,
    });

    // --- 3. FINANCEMENTS ---
    await page.locator("#tab-financements").click();
    await page.waitForTimeout(1000);
    await runLayoutChecks(page, "mobile-390", "financements");
    await page.screenshot({
      path: `${artifactDir}/dashboard_financements_390.png`,
      fullPage: true,
    });

    // --- 4. REGISTRE ---
    await page.locator("#tab-registre").click();
    await page.waitForTimeout(1000);
    await runLayoutChecks(page, "mobile-390", "registre");
    await page.screenshot({
      path: `${artifactDir}/dashboard_registre_390.png`,
      fullPage: true,
    });

    await context.close();
  });

  test("Tablet 1024px : Pas de débordement horizontal", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1024, height: 768 },
    });
    const page = await context.newPage();
    await loginAndGoToDashboard(page);

    await runLayoutChecks(page, "tablet-1024", "vue-d-ensemble");
    await context.close();
  });
});
