"""Générateur de flux iCalendar (.ics) conforme RFC 5545 pour les événements CIAT (Phase 4 Pathé).

Permet l'import direct et la synchronisation avec :
- Google Agenda
- Microsoft Outlook
- Apple Calendar
- Tout client d'agenda respectant la norme iCalendar RFC 5545
"""
from datetime import timedelta, timezone as dt_timezone
from django.utils import timezone


def _echapper_texte_ics(texte: str) -> str:
    """Échappe les caractères réservés RFC 5545 (\, ;, ,, sauts de ligne)."""
    if not texte:
        return ""
    # Remplace d'abord les antislashs pour éviter le double échappement
    t = str(texte).replace("\\", "\\\\")
    t = t.replace(";", "\\;").replace(",", "\\,")
    t = t.replace("\r\n", "\\n").replace("\n", "\\n").replace("\r", "\\n")
    return t


def _formater_date_utc(dt) -> str:
    """Convertit un datetime en chaîne UTC conforme au format iCalendar : YYYYMMDDTHHMMSSZ."""
    if not dt:
        return ""
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, dt_timezone.utc)
    else:
        dt = dt.astimezone(dt_timezone.utc)
    return dt.strftime("%Y%m%dT%H%M%SZ")


def generer_calendrier_ics(evenements) -> str:
    """Génère le contenu complet d'un calendrier iCalendar (.ics) pour une liste d'événements CIAT."""
    lignes = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//CIAT//Plateforme Numerique CIAT//FR",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:Événements CIAT — ISEP Diamniadio",
        "X-WR-CALDESC:Calendrier officiel des ateliers, conférences et jurys du CIAT",
        "X-WR-TIMEZONE:UTC",
    ]

    maintenant_utc = _formater_date_utc(timezone.now())

    for evt in evenements:
        debut_utc = _formater_date_utc(evt.debut)
        if evt.fin:
            fin_utc = _formater_date_utc(evt.fin)
        else:
            # Durée par défaut de 2h si fin non spécifiée
            fin_utc = _formater_date_utc(evt.debut + timedelta(hours=2))

        uid = f"evenement-{evt.id}@ciat.sn"
        summary = _echapper_texte_ics(evt.titre)
        description = _echapper_texte_ics(evt.description)
        lieu = _echapper_texte_ics(evt.lieu)

        lignes.append("BEGIN:VEVENT")
        lignes.append(f"UID:{uid}")
        lignes.append(f"DTSTAMP:{maintenant_utc}")
        lignes.append(f"DTSTART:{debut_utc}")
        lignes.append(f"DTEND:{fin_utc}")
        lignes.append(f"SUMMARY:{summary}")
        if description:
            lignes.append(f"DESCRIPTION:{description}")
        if lieu:
            lignes.append(f"LOCATION:{lieu}")
        if getattr(evt, "lien_inscription", None):
            lignes.append(f"URL:{evt.lien_inscription}")
        lignes.append("STATUS:CONFIRMED")
        lignes.append("END:VEVENT")

    lignes.append("END:VCALENDAR")

    # RFC 5545 impose le retour chariot CRLF (\r\n)
    return "\r\n".join(lignes) + "\r\n"
