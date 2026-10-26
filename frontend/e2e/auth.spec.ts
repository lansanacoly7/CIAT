import { test, expect } from "@playwright/test";

test.describe("Parcours d'authentification et contrôle d'accès (E2E)", () => {
  test("1. Connexion refusée avec mot de passe erroné", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/connexion");
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: "visible" });
    await emailInput.fill("coordo@ciat.sn");
    await page.fill('input[type="password"]', "MauvaisMotDePasse123!");

    // Attente de la réponse 400 ou 401 de l'API /auth/token/
    const [tokenResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/auth/token/")),
      page.click('button[type="submit"]'),
    ]);
    expect([400, 401]).toContain(tokenResponse.status());

    // Vérifie l'apparition du message d'erreur d'authentification
    const errorMessage = page.locator("text=Identifiants incorrects");
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // Vérifie qu'aucun token de session n'a été enregistré dans le localStorage
    const token = await page.evaluate(() => localStorage.getItem("ciat_access"));
    expect(token).toBeNull();

    // L'utilisateur reste bien sur la page de connexion
    expect(page.url()).toContain("/connexion");

    await context.close();
  });

  test("2. Connexion d'un porteur et accès à son espace", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/connexion");
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: "visible" });
    await emailInput.fill("porteur@ciat.sn");
    await page.fill('input[type="password"]', "Ciat2026!");

    const [tokenResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/auth/token/")),
      page.click('button[type="submit"]'),
    ]);
    expect(tokenResponse.status()).toBe(200);

    // Le porteur est redirigé vers son espace incubateur
    await page.waitForURL("**/incubateur**", { timeout: 15000 });
    expect(page.url()).toContain("/incubateur");

    // Vérifie que le token d'authentification est bien stocké
    const token = await page.evaluate(() => localStorage.getItem("ciat_access"));
    expect(token).toBeTruthy();

    await context.close();
  });

  test("3. Un porteur n'accède pas au tableau de bord décisionnel", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Connexion préalable en tant que porteur dans un contexte propre
    await page.goto("/connexion");
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: "visible" });
    await emailInput.fill("porteur@ciat.sn");
    await page.fill('input[type="password"]', "Ciat2026!");

    const [tokenResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/auth/token/")),
      page.click('button[type="submit"]'),
    ]);
    expect(tokenResponse.status()).toBe(200);
    await page.waitForURL("**/incubateur**", { timeout: 15000 });

    // Tentative de navigation directe vers le tableau de bord réservé aux administrateurs
    await page.goto("/tableau-de-bord");

    // Vérifie que l'écran d'accès restreint est affiché
    const accesRestreint = page.locator("text=Accès restreint");
    await expect(accesRestreint).toBeVisible({ timeout: 15000 });

    // Vérifie la présence du bouton de redirection vers son espace légitime
    const retourEspace = page.locator('text=Mon espace incubateur');
    await expect(retourEspace).toBeVisible();

    await context.close();
  });
});
