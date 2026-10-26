import { test, expect } from "@playwright/test";

test.describe("Parcours public visiteur — Galerie des innovations (E2E)", () => {
  test("Un visiteur anonyme consulte la galerie et ouvre une fiche détaillée", async ({ page }) => {
    // 1. Navigation vers la galerie publique
    await page.goto("/galerie", { waitUntil: "domcontentloaded" });

    // 2. Vérifie la présence du titre principal de la galerie
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();

    // 3. Attend l'apparition des cartes d'innovations publiées dans la grille
    const cards = page.locator('article h2 a[href^="/galerie/"]');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // 4. Clique sur la première fiche d'innovation
    const premierLien = cards.first();
    const href = await premierLien.getAttribute("href");
    expect(href).toBeTruthy();

    await premierLien.click();

    // 5. Vérifie que la page de détail de l'innovation est chargée
    await page.waitForURL(`**${href}**`, { waitUntil: "domcontentloaded", timeout: 15000 });
    expect(page.url()).toContain("/galerie/");

    // 6. Vérifie les éléments clés de la fiche
    const detailTitle = page.locator("h1:visible").first();
    await expect(detailTitle).toBeVisible();
  });
});
