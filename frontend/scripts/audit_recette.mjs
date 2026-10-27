import { chromium } from 'playwright';
import fs from 'fs';

const TOKENS = {
  "porteur@ciat.sn": {
    access: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzkzMDcwMjM1LCJpYXQiOjE3OTMwNjg0MzUsImp0aSI6IjA5ZGFhYzdmZWQyNjRmNDc4NzRkY2Y4YmNjZGM5MzRiIiwidXNlcl9pZCI6IjUifQ.NbuQIEzUxy9alNm6EU8sKc9jTXfXVZwpvCvgUYc06-Y",
    refresh: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MzY3MzIzNSwiaWF0IjoxNzkzMDY4NDM1LCJqdGkiOiJhOWU2MDA3NzMwZDA0MGQ2OGUwYTg2N2Q0NTU2NDhjMCIsInVzZXJfaWQiOiI1In0.tnx0_OJT5Tv4vsUwG3L8w6Ohq2QA1xlHJUEt25OoEgQ"
  },
  "comite@ciat.sn": {
    access: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzkzMDcwMjM1LCJpYXQiOjE3OTMwNjg0MzUsImp0aSI6IjA0YzM4ZWQyMjA1ODQzMWJiMTcwOTRjZmQ1ZThhODViIiwidXNlcl9pZCI6IjQifQ.1hB8xwLcHj0C_kmpdAtcoEOKqZMKHJuVqHy49xoqw2Y",
    refresh: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MzY3MzIzNSwiaWF0IjoxNzkzMDY4NDM1LCJqdGkiOiI5OWNmMDZiOTgzZGQ0YWQyOTA5YzQ5ZmVlOWY1OGE1YiIsInVzZXJfaWQiOiI0In0.Mm_fu0MVQflCIv195MRjFF5v8dEKkTD-c8uE7hfKMlE"
  },
  "coordo@ciat.sn": {
    access: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzkzMDcwMjM1LCJpYXQiOjE3OTMwNjg0MzUsImp0aSI6Ijc5ZDAzZjg0ZDZmNTQwMzVhNWZlNWI0ZmQwZjlkZTcyIiwidXNlcl9pZCI6IjIifQ.WBzeyssx-UkadgYrZhN3lbQYHun9iNMLmTjzuvyf6sk",
    refresh: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MzY3MzIzNSwiaWF0IjoxNzkzMDY4NDM1LCJqdGkiOiIzMDFiYTE3YzdiYTU0YzlkYTdlYjg3ODJkMDg0N2E3NiIsInVzZXJfaWQiOiIyIn0.IxlE2N2wXUjsq3sx46HDfFWf1Hh82RiWfY5TmUFUm3A"
  },
  "mentor@ciat.sn": {
    access: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzkzMDcwMjM1LCJpYXQiOjE3OTMwNjg0MzUsImp0aSI6IjcyODdjZTQyMWQ0MzQyOWI4YWY1NDdjMzM2OTczMzk3IiwidXNlcl9pZCI6IjMifQ.VjIPs4Oe-Ug_WDBNW-4GgA1FfqX88l2-U_5uT6JqUiE",
    refresh: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MzY3MzIzNSwiaWF0IjoxNzkzMDY4NDM1LCJqdGkiOiIwZWNhNDgyNjIyMjM0Y2MzYjRhNmUxMDhjMDJkNTRmZSIsInVzZXJfaWQiOiIzIn0.o8jFScI574wX2LcgwtFQsc2ivXUGw3q_TgFI2PWehOs"
  },
  "admin@ciat.sn": {
    access: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzkzMDcwMjM1LCJpYXQiOjE3OTMwNjg0MzUsImp0aSI6IjJkZTY3NGVkMTMzMjRlYThhOWIyMzJmNjdhNmE3ZTI2IiwidXNlcl9pZCI6IjEifQ.RsDOt7JX0j36AO6KYQTxKxidH6FKf3e7revltqWCczg",
    refresh: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MzY3MzIzNSwiaWF0IjoxNzkzMDY4NDM1LCJqdGkiOiJmNTVjNTlhNDI2ODI0Yjg4YWI4ODUyZmI2NjEzN2VhZCIsInVzZXJfaWQiOiIxIn0.jkUB51ynFD2QbVAQ1VGoNKEGAHcJHfe7N7gKAlkVIrM"
  }
};

async function runAudit() {
  const browser = await chromium.launch();
  const allResults = [];

  const viewports = [
    { name: 'Ordinateur (Desktop 1280x800)', width: 1280, height: 800 },
    { name: 'Téléphone (Mobile 390x844)', width: 390, height: 844 }
  ];

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`AUDIT SUR : ${vp.name}`);
    console.log(`========================================\n`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent: vp.width === 390 ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15' : undefined
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    async function setRole(email) {
      if (!email) {
        await page.goto('http://localhost:3000/');
        await page.evaluate(() => {
          localStorage.removeItem('ciat_access');
          localStorage.removeItem('ciat_refresh');
        });
        await page.waitForTimeout(300);
        return;
      }
      const pair = TOKENS[email];
      await page.goto('http://localhost:3000/');
      await page.evaluate(({ access, refresh }) => {
        localStorage.setItem('ciat_access', access);
        localStorage.setItem('ciat_refresh', refresh);
      }, pair);
      await page.waitForTimeout(300);
    }

    async function inspectScreen(stepNum, stepTitle, role, email, path) {
      consoleErrors.length = 0;
      await setRole(email);
      await page.goto(`http://localhost:3000${path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);

      const data = await page.evaluate(() => {
        const docWidth = document.documentElement.offsetWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        const hasOverflow = scrollWidth > docWidth + 3 || bodyScrollWidth > docWidth + 3;

        const imgs = Array.from(document.querySelectorAll('img'));
        const brokenImages = imgs.filter(img => img.naturalWidth === 0).map(img => img.src);

        const bodyText = document.body.innerText;
        const hasOldTraore = /\bTraor[eé]\b/i.test(bodyText);
        const hasTraware = /\bTrawar[eé]\b/i.test(bodyText);
        const hasEncodingIssues = /Ã©|Ã¨|Ã|â€|Â/g.test(bodyText);

        const englishTerms = [];
        ['Sign in', 'Log in', 'Submit', 'Loading...', 'Dashboard', 'Password', 'Email address'].forEach(term => {
          if (new RegExp(`\\b${term}\\b`, 'i').test(bodyText)) {
            englishTerms.push(term);
          }
        });

        const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
        const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText.trim()).filter(Boolean);

        return {
          hasOverflow,
          docWidth,
          scrollWidth,
          bodyScrollWidth,
          imagesTotal: imgs.length,
          brokenImages,
          hasOldTraore,
          hasTraware,
          hasEncodingIssues,
          englishTerms,
          buttonsCount: buttons.length,
          headingsSample: headings.slice(0, 5),
          bodyTextLength: bodyText.length
        };
      });

      const entry = {
        stepNum,
        stepTitle,
        role,
        viewport: vp.name,
        path,
        consoleErrors: [...consoleErrors],
        ...data
      };
      allResults.push(entry);

      console.log(`[${vp.name}] ${stepNum}. ${stepTitle} (${path})`);
      console.log(`  - Rôle : ${role}`);
      console.log(`  - Overflow horizontal : ${data.hasOverflow ? `OUI (largeur: ${data.docWidth}px, scroll: ${data.scrollWidth}px)` : 'NON (parfait)'}`);
      console.log(`  - Images : ${data.imagesTotal - data.brokenImages.length}/${data.imagesTotal} valides (${data.brokenImages.length} cassées)`);
      console.log(`  - Orthographe Traoré : ${data.hasOldTraore ? 'ANCIENNE DÉTECTÉE' : 'Conforme (Trawaré)'}`);
      console.log(`  - Encodage : ${data.hasEncodingIssues ? 'PROBLÈME DÉTECTÉ' : 'OK (aucun artefact)'}`);
      console.log(`  - Termes anglais : ${data.englishTerms.length > 0 ? data.englishTerms.join(', ') : 'Aucun (100% français)'}`);
      console.log(`  - Erreurs console : ${consoleErrors.length}`);
      console.log(`  - Titres affichés : ${data.headingsSample.slice(0, 2).join(' | ')}`);
    }

    // --- ÉTAPE 1 : Vitrine & Galerie (Public / Non connecté) ---
    await inspectScreen(1, "Accueil Vitrine ISEP / Hero", "Public", null, "/");
    await inspectScreen(1, "Portail Partenaires & Projets", "Public", null, "/portail");
    await inspectScreen(1, "Galerie Publique des Innovations", "Public", null, "/galerie");
    await inspectScreen(1, "Fiche Innovation Publique (SunuAgri AI)", "Public", null, "/galerie/sunuagri-ai-detection-des-maladies-maraicheres-des-niayes");

    // --- ÉTAPE 2 : Espace Porteur ---
    await inspectScreen(2, "Espace Porteur (Accueil Candidature)", "Porteur", "porteur@ciat.sn", "/incubateur");
    await inspectScreen(2, "Espace Porteur (Mes Projets)", "Porteur", "porteur@ciat.sn", "/incubateur/projets");

    // --- ÉTAPE 3 : Comité de Sélection ---
    await inspectScreen(3, "Comité de Sélection - Grille d'évaluation", "Membre Comité", "comite@ciat.sn", "/incubateur/evaluation");

    // --- ÉTAPE 4 : Coordination de l'Incubateur ---
    await inspectScreen(4, "Coordination - Instruction & Décision", "Coordonnateur", "coordo@ciat.sn", "/incubateur/projets");

    // --- ÉTAPE 5 : Suivi Opérationnel & Alertes ---
    await inspectScreen(5, "Mentor - Suivi des Jalons", "Mentor", "mentor@ciat.sn", "/incubateur/projets");
    await inspectScreen(5, "Mentor - Alertes de l'Incubateur", "Mentor", "mentor@ciat.sn", "/incubateur/alertes");

    // --- ÉTAPE 6 : Documents IA ---
    await inspectScreen(6, "Moteur Documentaire Officiel IA", "Coordonnateur", "coordo@ciat.sn", "/documents");

    // --- ÉTAPE 7 : Assistant IA ---
    await inspectScreen(7, "Assistant IA Conversationnel (RAG)", "Coordonnateur", "coordo@ciat.sn", "/assistant");

    // --- ÉTAPE 8 : Tableau de Bord Décisionnel & Méthodologie ---
    await inspectScreen(8, "Tableau de Bord Stratégique", "Administrateur", "admin@ciat.sn", "/tableau-de-bord");
    await inspectScreen(8, "Référentiel Méthodologique", "Administrateur", "admin@ciat.sn", "/tableau-de-bord/methodologie");

    await context.close();
  }

  await browser.close();
  fs.writeFileSync('audit_recette_complet.json', JSON.stringify(allResults, null, 2));
  console.log('\n========================================');
  console.log('AUDIT COMPLET AUTHENTIFIÉ TERMINÉ AVEC SUCCÈS.');
  console.log('========================================\n');
}

runAudit().catch(err => {
  console.error('Erreur audit:', err);
  process.exit(1);
});
