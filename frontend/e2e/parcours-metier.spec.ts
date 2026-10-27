import { test, expect, Page } from "@playwright/test";

// Helper de connexion générique
async function loginAs(page: Page, email: string) {
  await page.goto("/connexion", { waitUntil: "domcontentloaded" });
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 15000 });
  await emailInput.fill(email);
  await page.fill('input[type="password"]', "Ciat2026!");

  const [tokenResponse] = await Promise.all([
    page.waitForResponse((res) => res.url().includes("/auth/token/"), { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  expect(tokenResponse.status()).toBe(200);

  // Attente de redirection post-connexion
  await page.waitForURL(/.*(tableau-de-bord|incubateur|documents).*/, { timeout: 20000 });
}

test.describe("Tests de bout en bout (E2E) — Parcours Métiers Manquants", () => {
  test("1. Dépôt de dossier complet par un porteur de projet", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Connexion en tant que porteur de projet
    await loginAs(page, "porteur@ciat.sn");
    await page.goto("/incubateur", { waitUntil: "domcontentloaded" });

    // 2. Vérifie la présence de l'écran d'incubation / dépôt
    const pageHeading = page.locator("h1:has-text('Dépôt de candidature')");
    await expect(pageHeading).toBeVisible({ timeout: 20000 });

    // Attente de la fin du chargement initial (spinner)
    await page.locator('[role="status"][aria-label="Chargement"]').waitFor({ state: "detached", timeout: 20000 }).catch(() => {});

    // 3. Remplissage ou mise à jour des informations du projet (Étape 1)
    const titreInput = page.locator("#titre");
    await titreInput.waitFor({ state: "visible", timeout: 20000 });

    // Attente que la liste des domaines soit chargée
    await page.locator("#domaine option:not([value=''])").first().waitFor({ state: "attached", timeout: 15000 });

    await titreInput.fill("Sonde IoT Solaire pour Maraîchers des Niayes");
    await page.locator("#domaine").selectOption({ index: 1 });

    const resumeInput = page.locator("#resume");
    await resumeInput.fill("Dispositif autonome d'irrigation intelligente et analyse d'humidité du sol.");

    const problemeInput = page.locator("#probleme");
    await problemeInput.fill("Raréfaction de l'eau et coût élevé de l'énergie pour les petits exploitants.");

    const solutionInput = page.locator("#solution");
    await solutionInput.fill("Capteurs solaires communicants couplés à une vanne intelligente basse consommation.");

    // 4. Validation et passage à l'étape des pièces justificatives
    const submitStep1 = page.locator('button[type="submit"]:has-text("Enregistrer et continuer")');
    await submitStep1.scrollIntoViewIfNeeded();
    await submitStep1.click();

    // 5. Vérification de l'accès à l'étape des pièces justificatives obligatoires
    const etapePieces = page.locator("h2:has-text('Déposez vos pièces justificatives')");
    await expect(etapePieces).toBeVisible({ timeout: 15000 });

    const piecesGauge = page.locator("text=Complétude du dossier").first();
    await expect(piecesGauge).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test("2. Évaluation et notation d'un dossier par un membre du comité", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Connexion en tant que membre du comité
    await loginAs(page, "comite@ciat.sn");

    // 2. Navigation vers la page d'évaluation des candidatures
    await page.goto("/incubateur/evaluation", { waitUntil: "domcontentloaded" });

    const pageTitle = page.locator("h1:has-text('Évaluation des dossiers')");
    await expect(pageTitle).toBeVisible({ timeout: 15000 });

    // 3. Sélection d'un dossier candidat en attente d'évaluation dans la liste
    const dossierEnAttenteBtn = page.locator("ul li button:has-text('En attente')").first();
    const targetDossierBtn = (await dossierEnAttenteBtn.isVisible({ timeout: 4000 }).catch(() => false))
      ? dossierEnAttenteBtn
      : page.locator("ul li button").first();

    await expect(targetDossierBtn).toBeVisible({ timeout: 15000 });
    await targetDossierBtn.click();

    // 4. Vérification de l'ouverture de la grille de notation
    const grilleTitle = page.locator("text=Grille de notation du projet");
    await expect(grilleTitle).toBeVisible({ timeout: 10000 });

    // 5. Saisie de l'avis motivé du jury
    const avisTextarea = page.locator("#avis-comite");
    await avisTextarea.scrollIntoViewIfNeeded();
    await expect(avisTextarea).toBeVisible();
    await avisTextarea.fill("Projet remarquable, solution technique réaliste et fort impact socio-économique.");

    // 6. Enregistrement de l'évaluation
    const submitBtn = page.locator('button[type="submit"]:has-text("Enregistrer mon évaluation")');
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();

    // 7. Vérification du message de confirmation de succès
    const confirmation = page.locator("text=Votre évaluation a bien été enregistrée").or(page.locator("text=Évaluations du comité"));
    await expect(confirmation).toBeVisible({ timeout: 15000 });

    await context.close();
  });

  test("3. Génération d'un document administratif certifié par un coordonnateur", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Mock de l'endpoint de génération IA (isolement des clés d'API payantes externes)
    await page.route("**/api/documents/generer/", async (route) => {
      const mockResult = {
        id: 777,
        titre: "Convention d'incubation — CIAT ISEP 2026",
        statut: "brouillon",
        version: 1,
        sections: [
          {
            code: "preambule",
            titre: "Préambule et Contexte",
            contenu: "Entre le Centre d'Innovation, d'Application et de Transfert (CIAT) et le porteur de projet lauréat.",
          },
          {
            code: "engagements",
            titre: "Engagements de l'Incubateur",
            contenu: "Le CIAT met à disposition ses plateformes technologiques, bancs d'essais et mentors.",
          },
        ],
      };
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(mockResult),
      });
    });

    // 2. Connexion en tant que coordonnateur
    await loginAs(page, "coordo@ciat.sn");

    // 3. Navigation vers le générateur de documents administratifs
    await page.goto("/documents", { waitUntil: "domcontentloaded" });

    const heading = page.locator("h1:has-text('Générateur de documents')");
    await expect(heading).toBeVisible({ timeout: 15000 });

    // 4. Clic sur l'onglet Nouveau document
    const tabNouveau = page.locator('button:has-text("Nouveau document"), button:has-text("Nouveau")').first();
    await tabNouveau.click();

    // 5. Renseignement du sujet directeur
    const sujetInput = page.locator("#doc-sujet");
    await expect(sujetInput).toBeVisible({ timeout: 10000 });
    await sujetInput.fill("Convention d'accompagnement et de prototypage rapide 2026");

    // 6. Déclenchement de la génération assistée
    const genererBtn = page.locator('button[type="submit"]:has-text("Générer le document avec l\'IA")');
    await genererBtn.click();

    // 7. Vérification de l'affichage du document généré
    const successBanner = page.locator("text=Génération réussie");
    await expect(successBanner).toBeVisible({ timeout: 15000 });

    const docNumero = page.locator("text=Document #777");
    await expect(docNumero).toBeVisible();

    await context.close();
  });
});
