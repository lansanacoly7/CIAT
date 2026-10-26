import { MODULES } from "@/lib/modules";
import { Badge, PageTitle } from "@/components/ui";

/** Page provisoire d'un module. Remplacer par la vraie page dès que le module démarre. */
export default function ModulePlaceholder({ slug }: { slug: string }) {
  const currentModule = MODULES.find((m) => m.slug === slug);
  if (!currentModule) return null;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageTitle title={currentModule.titre} subtitle={currentModule.description} />
      <Badge tone="alerte">À implémenter</Badge>
    </div>
  );
}
