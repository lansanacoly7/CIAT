/**
 * Service API pour le module P5 : Générateur et gestionnaire de documents administratifs du CIAT.
 * Conforme aux spécifications des Phases 1 et 2 (T1, T2, T3) dans taches/CONTRATS_API.md.
 * Zéro fausse donnée : toutes les opérations sont branchées sur /api/documents/.
 */

import { api, API_URL, ApiError } from "./api";

export interface TypeDocument {
  id: number;
  code: string;
  nom: string;
}

export interface SectionModele {
  code: string;
  titre: string;
  consigne?: string;
}

export interface ModeleDocument {
  id: number;
  type: number;
  nom: string;
  apercu?: string;
  sections: SectionModele[];
}

export interface SectionDocument {
  code: string;
  titre?: string;
  contenu: string;
}

export type DocumentStatut = "brouillon" | "valide" | "publie";

export const STATUT_DOC_LABELS: Record<
  DocumentStatut,
  { label: string; tone: "neutre" | "info" | "succes" | "alerte" }
> = {
  brouillon: { label: "Brouillon", tone: "neutre" },
  valide: { label: "Validé", tone: "info" },
  publie: { label: "Publié", tone: "succes" },
};

export interface DocumentGenere {
  id: number;
  titre: string;
  sections: SectionDocument[];
  statut: DocumentStatut;
  version: number;
}

export interface DocumentListItem {
  id: number;
  titre: string;
  modele: number;
  projet: number | null;
  auteur: number;
  statut: DocumentStatut;
  version_courante: number;
  cree_le: string;
  modifie_le: string;
}

export interface DocumentDetail extends DocumentListItem {
  sections: SectionDocument[];
}

export interface VersionDocumentItem {
  numero: number;
  sections: SectionDocument[];
  auteur: number;
  cree_le: string;
}

export interface GenererDocumentPayload {
  modele: number;
  sujet: string;
  infos?: Record<string, string>;
  projet?: number | null;
}

export interface ProjetOption {
  id: number;
  titre: string;
  statut?: string;
}

// Helpers
function unwrapList<T>(res: T[] | { results: T[] }): T[] {
  return Array.isArray(res) ? res : res?.results || [];
}

/** Récupère la liste des types de documents disponibles */
export async function getTypesDocument(): Promise<TypeDocument[]> {
  const res = await api<TypeDocument[] | { results: TypeDocument[] }>("/documents/types/");
  return unwrapList(res);
}

/** Récupère les modèles de documents, éventuellement filtrés par type */
export async function getModelesDocument(typeId?: number | string): Promise<ModeleDocument[]> {
  const query = typeId ? `?type=${encodeURIComponent(typeId)}` : "";
  const res = await api<ModeleDocument[] | { results: ModeleDocument[] }>(`/documents/modeles/${query}`);
  return unwrapList(res);
}

/** Récupère les projets incubés disponibles pour l'utilisateur */
export async function getProjetsDisponibles(): Promise<ProjetOption[]> {
  try {
    const res = await api<ProjetOption[] | { results: ProjetOption[] }>("/projets/");
    return unwrapList(res);
  } catch {
    return [];
  }
}

/** Appelle le moteur de génération IA (POST /api/documents/generer/) */
export async function genererDocument(payload: GenererDocumentPayload): Promise<DocumentGenere> {
  return api<DocumentGenere>("/documents/generer/", {
    method: "POST",
    body: payload,
  });
}

/** Récupère la liste des documents de l'utilisateur (ou tous pour l'équipe) */
export async function getDocuments(): Promise<DocumentListItem[]> {
  const res = await api<DocumentListItem[] | { results: DocumentListItem[] }>("/documents/");
  return unwrapList(res);
}

/** Récupère le détail d'un document avec les sections de la version courante */
export async function getDocumentDetail(id: number): Promise<DocumentDetail> {
  return api<DocumentDetail>(`/documents/${id}/`);
}

/** Modifie les sections d'un document (crée une nouvelle version, statut brouillon requis) */
export async function modifierDocument(
  id: number,
  sections: { code: string; contenu: string }[]
): Promise<DocumentDetail> {
  return api<DocumentDetail>(`/documents/${id}/`, {
    method: "PATCH",
    body: { sections },
  });
}

/** Récupère l'historique complet des versions d'un document */
export async function getVersionsDocument(id: number): Promise<VersionDocumentItem[]> {
  const res = await api<VersionDocumentItem[] | { results: VersionDocumentItem[] }>(
    `/documents/${id}/versions/`
  );
  return unwrapList(res);
}

/** Récupère les sections d'une version spécifique */
export async function getVersionDetail(id: number, numero: number): Promise<VersionDocumentItem> {
  return api<VersionDocumentItem>(`/documents/${id}/versions/${numero}/`);
}

/** Valide un document au statut brouillon (coordonnateur ou administrateur) */
export async function validerDocument(id: number): Promise<DocumentDetail> {
  return api<DocumentDetail>(`/documents/${id}/valider/`, {
    method: "POST",
  });
}

/** Publie un document au statut validé (administrateur uniquement) */
export async function publierDocument(id: number): Promise<DocumentDetail> {
  return api<DocumentDetail>(`/documents/${id}/publier/`, {
    method: "POST",
  });
}

/** Repasse un document au statut brouillon pour le rééditer (coordonnateur ou administrateur) */
export async function repasserBrouillon(id: number): Promise<DocumentDetail> {
  return api<DocumentDetail>(`/documents/${id}/brouillon/`, {
    method: "POST",
  });
}

/** Télécharge l'export Word (.docx) ou PDF (.pdf) avec token d'authentification */
export async function telechargerExportDocument(
  id: number,
  format: "docx" | "pdf",
  nomFichier?: string
): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("ciat_access") : null;
  const url = `${API_URL}/documents/${id}/export/?format=${format}`;

  const res = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new ApiError(res.status, errorData);
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = nomFichier || `document_${id}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}
