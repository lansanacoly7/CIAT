"""Générateur de QR code au format PNG (sans dépendance externe obligatoire).

Génère un QR code ISO/IEC 18004 standard encodant l'URL publique de la fiche
vers une image PNG à l'aide de Pillow.
"""
import io
import logging
from PIL import Image

logger = logging.getLogger(__name__)


# ==============================================================================
# Générateur QR Code standard autonome en pur Python
# ==============================================================================

# Galois Field GF(256) pour les codes correcteurs de Reed-Solomon
_EXP = [0] * 512
_LOG = [0] * 256
_x = 1
for _i in range(255):
    _EXP[_i] = _x
    _EXP[_i + 255] = _x
    _LOG[_x] = _i
    _x = (_x << 1) ^ (0x11D if _x & 0x80 else 0)


def _gf_mul(a: int, b: int) -> int:
    return _EXP[_LOG[a] + _LOG[b]] if a and b else 0


def _rs_encode(data: list[int], nsym: int) -> list[int]:
    gen = [1]
    for i in range(nsym):
        factor = _EXP[i]
        new_g = [0] * (len(gen) + 1)
        for j, c in enumerate(gen):
            new_g[j] ^= c
            new_g[j + 1] ^= _gf_mul(c, factor)
        gen = new_g

    msg = list(data) + [0] * nsym
    for i in range(len(data)):
        coef = msg[i]
        if coef != 0:
            for j in range(len(gen)):
                msg[i + j] ^= _gf_mul(gen[j], coef)
    return msg[len(data):]


def _creer_matrice_qr(texte: str) -> list[list[int]]:
    """Génère la matrice binaire d'un QR code (Versions 1 à 5, Niveau L, Masque 0)."""
    versions_config = [
        (1, 21, 19, 7, []),
        (2, 25, 34, 10, [6, 18]),
        (3, 29, 55, 15, [6, 22]),
        (4, 33, 80, 20, [6, 26]),
        (5, 37, 108, 26, [6, 30]),
    ]
    raw_data = texte.encode("utf-8")
    data_len = len(raw_data)

    selected = None
    for v, size, dc, ec, align in versions_config:
        if data_len + 2 <= dc:
            selected = (v, size, dc, ec, align)
            break
    if not selected:
        selected = versions_config[-1]

    version, size, dc, ec, align = selected

    # Encodage en mode octet (0100) + longueur sur 8 bits
    bits = "0100" + format(data_len, "08b")
    for b in raw_data:
        bits += format(b, "08b")
    bits += "0000"

    if len(bits) % 8 != 0:
        bits += "0" * (8 - (len(bits) % 8))

    pad_bytes = [0xEC, 0x11]
    pad_idx = 0
    codewords = [int(bits[i:i + 8], 2) for i in range(0, len(bits), 8)]
    while len(codewords) < dc:
        codewords.append(pad_bytes[pad_idx % 2])
        pad_idx += 1
    codewords = codewords[:dc]

    # Codewords correcteurs Reed-Solomon
    ecc = _rs_encode(codewords, ec)
    all_codewords = codewords + ecc

    matrix = [[None] * size for _ in range(size)]
    reserved = [[False] * size for _ in range(size)]

    def set_module(r, c, val, is_reserved=True):
        if 0 <= r < size and 0 <= c < size:
            matrix[r][c] = val
            if is_reserved:
                reserved[r][c] = True

    # Motifs de synchronisation / localisation (Finder patterns 7x7)
    def add_finder(start_r, start_c):
        for r in range(-1, 8):
            for c in range(-1, 8):
                pr, pc = start_r + r, start_c + c
                if 0 <= pr < size and 0 <= pc < size:
                    if 0 <= r <= 6 and 0 <= c <= 6:
                        if r in (0, 6) or c in (0, 6) or (2 <= r <= 4 and 2 <= c <= 4):
                            set_module(pr, pc, 1)
                        else:
                            set_module(pr, pc, 0)
                    else:
                        set_module(pr, pc, 0)

    add_finder(0, 0)
    add_finder(0, size - 7)
    add_finder(size - 7, 0)

    # Motifs de cadencement (Timing patterns)
    for i in range(8, size - 8):
        val = 1 if i % 2 == 0 else 0
        set_module(6, i, val)
        set_module(i, 6, val)

    # Motifs d'alignement pour les versions >= 2
    if align:
        for ar in align:
            for ac in align:
                if (ar <= 8 and ac <= 8) or (ar <= 8 and ac >= size - 9) or (ar >= size - 9 and ac <= 8):
                    continue
                for dr in range(-2, 3):
                    for dc_ in range(-2, 3):
                        val = 1 if max(abs(dr), abs(dc_)) in (0, 2) else 0
                        set_module(ar + dr, ac + dc_, val)

    # Module sombre
    set_module(4 * version + 9, 8, 1)

    # Réservation des informations de format
    for i in range(9):
        if matrix[8][i] is None:
            reserved[8][i] = True
        if matrix[i][8] is None:
            reserved[i][8] = True
    for i in range(8):
        reserved[8][size - 1 - i] = True
        reserved[size - 1 - i][8] = True

    # Placement des données avec masque 0 ((row + col) % 2 == 0)
    all_bits = "".join(format(b, "08b") for b in all_codewords)
    bit_idx = 0
    right = size - 1
    while right > 0:
        if right == 6:
            right -= 1
        col_pair = [right, right - 1]
        step_up = True if ((size - 1 - right) // 2) % 2 == 0 else False
        rows = range(size - 1, -1, -1) if step_up else range(size)
        for r in rows:
            for c in col_pair:
                if not reserved[r][c]:
                    b = int(all_bits[bit_idx]) if bit_idx < len(all_bits) else 0
                    bit_idx += 1
                    mask = (r + c) % 2 == 0
                    matrix[r][c] = b ^ (1 if mask else 0)
        right -= 2

    # Informations de format (Niveau L + Masque 0) = 111011111000100
    fmt_bits = bin(0b111011111000100)[2:].zfill(15)
    seq1 = [
        (8, 0), (8, 1), (8, 2), (8, 3), (8, 4), (8, 5), (8, 7), (8, 8),
        (7, 8), (5, 8), (4, 8), (3, 8), (2, 8), (1, 8), (0, 8),
    ]
    for i, (r, c) in enumerate(seq1):
        matrix[r][c] = int(fmt_bits[i])

    seq2 = [(8, size - 1 - i) for i in range(8)] + [(size - 7 + i, 8) for i in range(7)]
    for i, (r, c) in enumerate(seq2):
        matrix[r][c] = int(fmt_bits[i])

    return matrix


def generer_qr_code_png(texte: str, module_size: int = 8, border: int = 4) -> bytes:
    """Génère l'image PNG d'un QR code pour le texte donné."""
    # 1. Tentative avec qrcode tiers si disponible
    try:
        import qrcode  # type: ignore

        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=module_size,
            border=border,
        )
        qr.add_data(texte)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
    except Exception:
        pass

    # 2. Génération autonome avec Pillow
    matrix = _creer_matrice_qr(texte)
    size = len(matrix)
    total_size = (size + 2 * border) * module_size
    img = Image.new("RGB", (total_size, total_size), "white")
    pixels = img.load()

    for r in range(size):
        for c in range(size):
            if matrix[r][c] == 1:
                x_start = (c + border) * module_size
                y_start = (r + border) * module_size
                for x in range(x_start, x_start + module_size):
                    for y in range(y_start, y_start + module_size):
                        pixels[x, y] = (0, 0, 0)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
