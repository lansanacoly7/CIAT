/**
 * Utilitaires de formatage officiels pour le Tableau de bord CIAT
 * Conformes aux règles strictes :
 * - Intl.NumberFormat("fr-FR")
 * - Nombres avec virgule décimale : "84,5 %"
 * - Montants compacts : "472 M FCFA" (jamais "472.0 M FCFA")
 * - Montants complets : "472 000 000 FCFA" (pour les tooltips)
 * - Dates : "jj/mm/aaaa", aucune date ISO brute visible.
 */

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

/**
 * Formate un nombre au format français (ex: 12500 -> "12 500")
 */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (isNaN(num)) return "—";
  return numberFormatter.format(num);
}

/**
 * Formate un pourcentage (ex: 84.5 -> "84,5 %")
 */
export function formatPercent(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (isNaN(num)) return "—";
  return `${numberFormatter.format(num)} %`;
}

/**
 * Formate un montant complet en FCFA (ex: 472000000 -> "472 000 000 FCFA")
 */
export function formatCurrencyFull(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "0 FCFA";
  const num = typeof value === "string" ? Number(value) : value;
  if (isNaN(num)) return "0 FCFA";
  return `${integerFormatter.format(Math.round(num))} FCFA`;
}

/**
 * Formate un montant compact en FCFA (ex: 472000000 -> "472 M FCFA", 15000000 -> "15 M FCFA", 800000 -> "800 k FCFA")
 * Élimine systématiquement les zéros décimaux superflus (ex: "472 M", jamais "472.0 M").
 */
export function formatCurrencyCompact(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "0 FCFA";
  const num = typeof value === "string" ? Number(value) : value;
  if (isNaN(num)) return "0 FCFA";

  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) {
    const formatted = (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "").replace(".", ",");
    return `${formatted} Md FCFA`;
  }
  if (abs >= 1_000_000) {
    const formatted = (num / 1_000_000).toFixed(1).replace(/\.0$/, "").replace(".", ",");
    return `${formatted} M FCFA`;
  }
  if (abs >= 1_000) {
    const formatted = (num / 1_000).toFixed(1).replace(/\.0$/, "").replace(".", ",");
    return `${formatted} k FCFA`;
  }

  return `${integerFormatter.format(Math.round(num))} FCFA`;
}

/**
 * Formate une date ISO ou standard en jj/mm/aaaa
 */
export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateStr);
  }
}

/**
 * Formate une date avec heure en jj/mm/aaaa à hh:mm
 */
export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} à ${hours}:${minutes}`;
  } catch {
    return String(dateStr);
  }
}
