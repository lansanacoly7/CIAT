import { api, type Page } from "./api";

/** Récupère toutes les pages d'une liste DRF paginée (ou la liste telle quelle si elle n'est pas paginée). */
export async function fetchAll<T>(path: string): Promise<T[]> {
  const sep = path.includes("?") ? "&" : "?";
  const first = await api<Page<T> | T[]>(path);
  if (Array.isArray(first)) return first;

  const items = [...first.results];
  let next = first.next;
  for (let page = 2; next; page++) {
    const res = await api<Page<T>>(`${path}${sep}page=${page}`);
    items.push(...res.results);
    next = res.next;
  }
  return items;
}
