"use client";

import { useLayoutEffect } from "react";

/**
 * Masque le Header et Footer publics du site quand on se trouve dans
 * l'espace d'administration / tableau de bord, et les restaure à la sortie.
 */
export function HidePublicNav() {
  useLayoutEffect(() => {
    const header = document.querySelector("body > header") as HTMLElement | null;
    const footer = document.querySelector("body > footer") as HTMLElement | null;

    if (header) header.style.setProperty("display", "none", "important");
    if (footer) footer.style.setProperty("display", "none", "important");

    return () => {
      if (header) header.style.removeProperty("display");
      if (footer) footer.style.removeProperty("display");
    };
  }, []);

  return null;
}
