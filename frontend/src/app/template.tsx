import type { ReactNode } from "react";

/**
 * Next.js Template : S'exécute à chaque navigation entre routes
 * Déclenche une transition fluide (pageEnter) à 60fps avec zéro saccade.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-transition flex-1 flex flex-col w-full">{children}</div>;
}
