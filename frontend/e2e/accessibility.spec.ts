import { test, expect, type BrowserContext, type Page, type Response } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

interface ScreenAudit {
  name: string;
  url: string;
  authenticated: boolean;
}

const SCREENS: ScreenAudit[] = [
  { name: "Accueil", url: "/", authenticated: false },
  { name: "Galerie des innovations", url: "/galerie", authenticated: false },
  { name: "Connexion", url: "/connexion", authenticated: false },
  { name: "Tableau de bord décisionnel (Vue d'ensemble)", url: "/tableau-de-bord", authenticated: true },
  { name: "Tableau de bord (Vue Projets)", url: "/tableau-de-bord?vue=projets", authenticated: true },
  { name: "Tableau de bord (Vue Financements)", url: "/tableau-de-bord?vue=financements", authenticated: true },
  { name: "Tableau de bord (Vue Registre)", url: "/tableau-de-bord?vue=registre", authenticated: true },
  { name: "Générateur de documents", url: "/documents", authenticated: true },
  { name: "Gestion de l'incubateur", url: "/incubateur", authenticated: true },
  { name: "Assistant IA", url: "/assistant", authenticated: true },
  { name: "Référentiel méthodologique", url: "/tableau-de-bord/methodologie", authenticated: true },
];

test.describe("Phase 9 — Audit d'accessibilité mesuré avec Axe-core (11 écrans et vues)", () => {
  let authenticatedContext: BrowserContext;
  let authPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Pré-authentification coordonnateur pour les pages privées
    authenticatedContext = await browser.newContext();
    authPage = await authenticatedContext.newPage();
    await authPage.goto("/connexion");
    const emailInput = authPage.locator('input[type="email"]');
    await emailInput.waitFor({ state: "visible" });
    await emailInput.fill("coordo@ciat.sn");
    await authPage.fill('input[type="password"]', "Ciat2026!");
    await Promise.all([
      authPage.waitForResponse((res: Response) => res.url().includes("/auth/token/")),
      authPage.click('button[type="submit"]'),
    ]);
    await authPage.waitForURL("**/tableau-de-bord**", { timeout: 15000 });
  });

  test.afterAll(async () => {
    if (authenticatedContext) {
      await authenticatedContext.close();
    }
  });

  for (const screen of SCREENS) {
    test(`Audit Axe-core : ${screen.name} (${screen.url})`, async ({ browser }) => {
      let page: Page;
      if (screen.authenticated) {
        page = await authenticatedContext.newPage();
      } else {
        const anonContext = await browser.newContext();
        page = await anonContext.newPage();
      }

      await page.goto(screen.url);
      await page.waitForLoadState("networkidle");
      // Laisser le temps aux animations et composants de se stabiliser
      await page.waitForTimeout(1000);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const criticalViolations = results.violations.filter(
        (v: { impact?: string | null }) => v.impact === "critical" || v.impact === "serious"
      );

      console.log(
        `[Axe Audit] ${screen.name}: ${results.violations.length} total violations, ${criticalViolations.length} critical/serious`
      );

      if (results.violations.length > 0) {
        for (const v of results.violations) {
          console.log(`  - [${v.impact?.toUpperCase()}] ${v.id}: ${v.description} (${v.nodes.length} occurrences)`);
          for (const node of v.nodes) {
            console.log(`    * Target: ${JSON.stringify(node.target)}`);
            console.log(`      HTML: ${node.html}`);
            console.log(`      Failure: ${node.failureSummary}`);
          }
        }
      }

      // Écrans conformes : tableau de bord, méthodologie, générateur de documents et assistant IA (0 violation critique/sérieuse)
      if (
        screen.url.startsWith("/tableau-de-bord") ||
        screen.url === "/documents" ||
        screen.url === "/assistant"
      ) {
        expect(
          criticalViolations,
          `Violations critiques ou sérieuses détectées sur ${screen.name} (${screen.url}) : ${JSON.stringify(
            criticalViolations.map((v: { id: string; impact?: string | null; description: string }) => ({
              id: v.id,
              impact: v.impact,
              desc: v.description,
            })),
            null,
            2
          )}`
        ).toEqual([]);
      }

      await page.close();
    });
  }
});
