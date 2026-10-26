import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MethodologieContent } from "./MethodologieContent";

export const metadata: Metadata = {
  title: "Méthodologie & Dictionnaire des Indicateurs — CIAT",
  description:
    "Définitions exactes, formules de calcul, sources de données vérifiées et limites méthodologiques des indicateurs décisionnels du CIAT.",
};

export default function MethodologiePage() {
  return (
    <ProtectedRoute
      allowedRoles={["membre_comite", "coordonnateur", "administrateur"]}
    >
      <MethodologieContent />
    </ProtectedRoute>
  );
}
