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

  test("T1 — Le coordonnateur télécharge les 3 formats d'export (PDF, Excel, PNG) avec un filtre actif", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Connexion coordonnateur
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

    // 2. Activation d'un filtre actif (ex: cohorte 2024 via URL ou sélecteur)
    await page.goto("/tableau-de-bord?cohorte=2024");
    await page.waitForLoadState("networkidle");

    // 3. Export PDF
    const exportMenuBtn = page.locator("#export-menu-button");
    await expect(exportMenuBtn).toBeVisible({ timeout: 10000 });
    await exportMenuBtn.click();

    const exportPdfBtn = page.locator("#export-pdf-button");
    await expect(exportPdfBtn).toBeVisible();
    const [pdfDownload] = await Promise.all([
      page.waitForEvent("download"),
      exportPdfBtn.click(),
    ]);
    expect(pdfDownload.suggestedFilename()).toMatch(/ciat_rapport_officiel.*\.pdf/);

    // 4. Export Excel (.xlsx)
    await exportMenuBtn.click();
    const exportXlsxBtn = page.locator("#export-xlsx-button");
    await expect(exportXlsxBtn).toBeVisible();
    const [xlsxDownload] = await Promise.all([
      page.waitForEvent("download"),
      exportXlsxBtn.click(),
    ]);
    expect(xlsxDownload.suggestedFilename()).toMatch(/ciat_donnees_consolidees.*\.xlsx/);

    // 5. Export Image PNG (.png)
    await exportMenuBtn.click();
    const exportPngBtn = page.locator("#export-png-button");
    await expect(exportPngBtn).toBeVisible();
    const [pngDownload] = await Promise.all([
      page.waitForEvent("download"),
      exportPngBtn.click(),
    ]);
    expect(pngDownload.suggestedFilename()).toMatch(/ciat_tableau_de_bord.*\.png/);

    await context.close();
  });

  test("T2 — Navigation entre les 4 onglets (?vue=) et persistance de l'état au rechargement", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Connexion coordonnateur
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

    // 2. Onglet par défaut : Vue d'ensemble
    const tabVue = page.locator("#tab-vue-d-ensemble");
    await expect(tabVue).toBeVisible({ timeout: 10000 });
    await expect(tabVue).toHaveAttribute("aria-selected", "true");

    // 3. Navigation vers l'onglet Projets
    const tabProjets = page.locator("#tab-projets");
    await tabProjets.click();
    await expect(page).toHaveURL(/vue=projets/);
    await expect(tabProjets).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("text=Projets par domaine prioritaire")).toBeVisible();

    // Persistance au rechargement
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/vue=projets/);
    await expect(page.locator("#tab-projets")).toHaveAttribute("aria-selected", "true");

    // 4. Navigation vers l'onglet Financements
    const tabFinancements = page.locator("#tab-financements");
    await tabFinancements.click();
    await expect(page).toHaveURL(/vue=financements/);
    await expect(tabFinancements).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("text=Partenariats & Financements Mobilisés")).toBeVisible();

    // Persistance au rechargement
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/vue=financements/);
    await expect(page.locator("#tab-financements")).toHaveAttribute("aria-selected", "true");

    // 5. Navigation vers l'onglet Registre
    const tabRegistre = page.locator("#tab-registre");
    await tabRegistre.click();
    await expect(page).toHaveURL(/vue=registre/);
    await expect(tabRegistre).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("text=Registre analytique des engagements & conventions")).toBeVisible();

    // Persistance au rechargement
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/vue=registre/);
    await expect(page.locator("#tab-registre")).toHaveAttribute("aria-selected", "true");

    // 6. Retour à la Vue d'ensemble
    await page.locator("#tab-vue-d-ensemble").click();
    await expect(page).not.toHaveURL(/vue=(projets|financements|registre)/);

    await context.close();
  });

  test("T2 — Modale du registre : ouverture, focus piégé, fermeture par Échap et restitution du focus", async ({
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

    // Accès à l'onglet Registre
    await page.goto("/tableau-de-bord?vue=registre");
    await page.waitForLoadState("networkidle");

    // Localisation du bouton ouvrant l'historique
    const openBtn = page.locator('button:has-text("Engagements totaux"), button[title*="historique"]').first();
    await expect(openBtn).toBeVisible({ timeout: 10000 });
    await openBtn.focus();
    await openBtn.click();

    // 1. La modale s'ouvre avec les attributs d'accessibilité requis
    const modal = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#history-modal-title")).toBeVisible();

    // 2. Vérification que le focus est orienté dans la modale (bouton de fermeture ou élément focusable)
    const closeBtn = page.locator("#close-history-modal-btn");
    await expect(closeBtn).toBeVisible();

    // 3. Test de piégeage du focus avec Tab
    await page.keyboard.press("Tab");
    const focusedInModal = await modal.evaluate((m) => m.contains(document.activeElement));
    expect(focusedInModal).toBe(true);

    // 4. Fermeture par la touche Échap
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();

    // 5. Restitution du focus au déclencheur initial
    const isFocusReturned = await openBtn.evaluate((el) => el === document.activeElement);
    expect(isFocusReturned).toBe(true);

    await context.close();
  });

  test("T2 — Un filtre sans résultat affiche un message clair sans aucun graphique vide", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Connexion coordonnateur
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

    // Application d'une plage temporelle passée sans aucun projet (période vide)
    await page.goto("/tableau-de-bord?debut=2010-01-01&fin=2010-01-02");
    await page.waitForLoadState("networkidle");

    // 1. Message clair indiquant l'absence de données
    const emptyStateHeading = page.locator("text=Aucune donnée trouvée");
    await expect(emptyStateHeading).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Aucun projet ou indicateur ne correspond aux filtres")).toBeVisible();

    // 2. Aucun graphique vide ne doit être affiché (recharts absent en mode EmptyState)
    const rechartsGraphs = page.locator(".recharts-wrapper");
    expect(await rechartsGraphs.count()).toBe(0);

    // 3. Le bouton de réinitialisation restaure l'affichage normal
    const resetBtn = page.locator('button:has-text("Réinitialiser les filtres")').first();
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await page.waitForLoadState("networkidle");

    // Les indicateurs reviennent
    await expect(emptyStateHeading).toBeHidden();
    await expect(page.locator("text=Indicateurs Clés de Performance")).toBeVisible();

    await context.close();
  });

  test("T2 — Accès strictement refusé au tableau de bord pour un compte porteur (403)", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Connexion en tant que porteur de projet
    await page.goto("/connexion");
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: "visible" });
    await emailInput.fill("porteur@ciat.sn");
    await page.fill('input[type="password"]', "Ciat2026!");
    await Promise.all([
      page.waitForResponse((res) => res.url().includes("/auth/token/")),
      page.click('button[type="submit"]'),
    ]);

    // 2. Tentative d'accès à la route protégée du tableau de bord
    await page.goto("/tableau-de-bord");
    await page.waitForLoadState("networkidle");

    // 3. Écran d'accès restreint affiché avec mention du rôle porteur
    const restrictedTitle = page.locator("text=Accès restreint");
    await expect(restrictedTitle).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Cette page est réservée aux profils autorisés")).toBeVisible();
    await expect(page.locator("strong.text-brun").filter({ hasText: "porteur" })).toBeVisible();

    // 4. Vérification au niveau API : requête directe avec jeton porteur rejetée en 403
    const token = await page.evaluate(() => localStorage.getItem("ciat_access"));
    const apiRes = await page.request.get("http://localhost:8000/api/analytics/indicateurs/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(apiRes.status()).toBe(403);

    await context.close();
  });
});

