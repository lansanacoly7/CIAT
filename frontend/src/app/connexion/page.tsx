import { PageTitle } from "@/components/ui";

export const metadata = { title: "Connexion" };

export default function ConnexionPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <PageTitle title="Connexion" subtitle="Formulaire à implémenter : POST /api/auth/token/ via lib/api.ts." />
    </div>
  );
}
