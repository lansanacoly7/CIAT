import { test, expect } from "@playwright/test";

test.describe("Parcours Coordonnateur — Tableau de bord et requêtes IA (E2E)", () => {
  test("Le coordonnateur accède au tableau de bord et pose une question en langage naturel", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Connexion en tant que coordonnateur
    await page.goto("/connexion");
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: "visible" });
    await emailInput.fill("coordo@ciat.sn");
    await page.fill('input[type="password"]', "Ciat2026!");

    const [tokenResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/auth/token/")),
      page.click('button[type="submit"]'),
    ]);
    expect(tokenResponse.status()).toBe(200);

    // 2. Redirection attendue vers le tableau de bord
    await page.waitForURL("**/tableau-de-bord**", { timeout: 15000 });
    expect(page.url()).toContain("/tableau-de-bord");

    // 3. Vérifie l'affichage du titre du tableau de bord
    const dashboardTitle = page.locator("h1:visible").first();
    await expect(dashboardTitle).toBeVisible();

    // 4. Localise et ouvre le tiroir d'interrogation en langage naturel (480px)
    const openAiBtn = page.locator("#open-ai-drawer");
    await expect(openAiBtn).toBeVisible({ timeout: 15000 });
    await openAiBtn.click();

    const queryInput = page.locator("#ai-question-input");
    await expect(queryInput).toBeVisible({ timeout: 15000 });

    const submitBtn = page.locator("#ai-question-submit");
    await expect(submitBtn).toBeVisible();

    // 5. Pose une question sur les chiffres de prototypage
    await queryInput.fill("Combien de projets sont au stade prototype ?");

    // Envoi de la question et attente de la réponse (200 ou 503 sans clé IA)
    await Promise.all([
      page.waitForResponse((res) => res.url().includes("/analytics/question/")),
      submitBtn.click(),
    ]);

    // 6. Vérifie que le composant réagit : affiche soit la réponse calculée, soit le message de service indisponible
    const responseContainer = page.locator('text=/Réponse synthétique|service d\'analyse IA|indisponible|calcul sécurisé/i');
    await expect(responseContainer.first()).toBeVisible({ timeout: 20000 });

    await context.close();
  });

  test("Le coordonnateur accède au référentiel méthodologique depuis le tableau de bord", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Connexion préalable
    await page.goto("/connexion");
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: "visible" });
    await emailInput.fill("coordo@ciat.sn");
    await page.fill('input[type="password"]', "Ciat2026!");

    const [tokenResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/auth/token/")),
      page.click('button[type="submit"]'),
    ]);
    expect(tokenResponse.status()).toBe(200);
    await page.waitForURL("**/tableau-de-bord**", { timeout: 15000 });

    // Navigation vers la page Méthodologie
    await page.goto("/tableau-de-bord/methodologie");
    await expect(page).toHaveTitle(/Méthodologie/i);

    // Vérifie la présence des indicateurs documentés
    const tauxSelection = page.locator("text=Taux de sélection global");
    await expect(tauxSelection).toBeVisible({ timeout: 15000 });

    const formule = page.locator("text=(Projets sélectionnés / Dossiers déposés) × 100");
    await expect(formule).toBeVisible();

    await context.close();
  });

  test("Le coordonnateur filtre les dates au format français et télécharge un export consolidé", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Connexion préalable
    await page.goto("/connexion");
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: "visible" });
    await emailInput.fill("coordo@ciat.sn");
    await page.fill('input[type="password"]', "Ciat2026!");

    await Promise.all([
      page.waitForResponse((res) => res.url().includes("/auth/token/")),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForURL("**/tableau-de-bord**", { timeout: 15000 });

    // 1. Ouvre le filtre de période temporelle
    const periodBtn = page.locator("#period-filter-button");
    await expect(periodBtn).toBeVisible({ timeout: 10000 });
    await periodBtn.click();

    // 2. Saisie des dates au format français jj/mm/aaaa
    const debutInput = page.locator("#date-debut-input");
    const finInput = page.locator("#date-fin-input");
    await expect(debutInput).toBeVisible();
    await debutInput.fill("01/01/2025");
    await finInput.fill("31/12/2025");

    // 3. Applique la sélection
    const applyBtn = page.locator("#apply-period-button");
    await applyBtn.click();

    // 4. Vérifie que le libellé du bouton affiche le format français (01/01/2025 au 31/12/2025)
    await expect(periodBtn).toContainText("01/01/2025 au 31/12/2025");

    // 5. Ouvre le menu d'export
    const exportMenuBtn = page.locator("#export-menu-button");
    await exportMenuBtn.click();

    const exportXlsxBtn = page.locator("#export-xlsx-button");
    await expect(exportXlsxBtn).toBeVisible();

    // 6. Déclenche le téléchargement Excel et valide la réception du fichier .xlsx
    const downloadPromise = page.waitForEvent("download");
    await exportXlsxBtn.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/ciat_donnees_consolidees.*\.xlsx/);

    await context.close();
  });
});
