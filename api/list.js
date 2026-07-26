// Stockage de la liste de naissance sur Vercel Blob (store privé).
//
// Remplace JSONbin, dont le forfait gratuit alloue 10 000 requêtes une seule
// fois, et dont le partage obligeait à diffuser la Master Key du compte —
// c'est-à-dire un accès complet à TOUTES les listes du compte — dans un lien
// WhatsApp.
//
// Ici le secret (BLOB_READ_WRITE_TOKEN) ne quitte jamais le serveur. Les liens
// de partage ne portent qu'un jeton propre à CETTE liste, et seule son
// empreinte SHA-256 est stockée : lire le blob ne permet pas de fabriquer un
// jeton valide.
//
//   POST /api/list            → crée une liste, renvoie { id, ownerToken, familyToken }
//   GET  /api/list?id=…       → renvoie { data, updatedAt }
//   PUT  /api/list?id=…       → { data, token } ; écrit si le jeton est reconnu
//
// Droits : le jeton propriétaire écrit tout ; le jeton famille ne peut modifier
// que les réservations — un proche ne peut donc pas vider la liste, par erreur
// ou autrement.

import { put, get } from "@vercel/blob";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";

const PREFIX = "listes";
const pathFor = (id) => `${PREFIX}/${id}.json`;

const newId    = () => randomBytes(12).toString("hex");
const newToken = () => randomBytes(24).toString("base64url");
const hash     = (t) => createHash("sha256").update(String(t)).digest("hex");

// Comparaison à durée constante : ne révèle pas le préfixe correct par le temps de réponse.
function sameHash(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

async function readRecord(id) {
  // useCache:false — sans cela deux parents peuvent se marcher dessus en lisant
  // une version périmée pendant la propagation du cache (jusqu'à 60 s).
  const res = await get(pathFor(id), { access: "private", useCache: false });
  if (!res || res.statusCode !== 200 || !res.stream) return null;
  try { return JSON.parse(await new Response(res.stream).text()); }
  catch { return null; }
}

async function writeRecord(id, record) {
  await put(pathFor(id), JSON.stringify(record), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

// Écriture « famille » : au lieu de comparer les deux documents et de refuser
// s'ils diffèrent, on REPART du document stocké et on n'y reporte que les
// réservations, appariées par identifiant. Tout le reste de la charge utile
// reçue est ignoré.
//
// C'est plus sûr (un proche ne peut rien modifier d'autre par construction, pas
// par comparaison) et plus robuste : une comparaison globale aurait rejeté
// toutes les réservations dès que la liste par défaut de l'application évolue,
// puisque le document stocké aurait alors une structure différente.
function applyReservationsOnly(stored, incoming) {
  const byId = new Map();
  const collect = (secs) => (secs || []).forEach((s) =>
    [...(s.items || []), ...(s.customItems || [])].forEach((i) => i?.id && byId.set(i.id, i)));
  collect(incoming?.sections);
  collect(incoming?.customSections);

  const mapItem = (i) => {
    const inc = byId.get(i.id);
    if (!inc) return i;
    return {
      ...i,
      reservedBy: inc.reservedBy ?? null,
      models: (i.models || []).map((m) => {
        const im = (inc.models || []).find((x) => x.id === m.id);
        return im ? { ...m, reservedBy: im.reservedBy ?? null } : m;
      }),
    };
  };
  const mapSection = (s) => ({
    ...s,
    items: (s.items || []).map(mapItem),
    customItems: (s.customItems || []).map(mapItem),
  });

  return {
    ...stored,
    sections: (stored?.sections || []).map(mapSection),
    customSections: (stored?.customSections || []).map(mapSection),
  };
}

function send(res, status, body) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
}

// Ne PAS exiger BLOB_READ_WRITE_TOKEN : quand le store est connecté au projet,
// Vercel authentifie les fonctions automatiquement (OIDC) et ne crée aucune
// variable de ce nom. Exiger cette variable faisait répondre « stockage non
// activé » alors que le store était parfaitement connecté.
// On tente donc l'opération, et on ne conclut à l'absence de stockage que si le
// SDK signale lui-même un défaut d'identifiants.
function isMissingCredentials(e) {
  const m = `${e?.name || ""} ${e?.message || ""}`.toLowerCase();
  return m.includes("no token") || m.includes("token is required")
      || m.includes("blob_read_write_token") || m.includes("missing")
      || m.includes("not authenticated") || m.includes("unauthorized")
      || m.includes("forbidden") || m.includes("no store");
}

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const data = req.body?.data;
      if (!data || typeof data !== "object") return send(res, 400, { error: "bad_request" });

      const id = newId();
      const ownerToken = newToken();
      const familyToken = newToken();
      const updatedAt = new Date().toISOString();
      // Le jeton propriétaire n'est stocké que haché. Le jeton famille l'est en
      // clair : le blob est privé, et le propriétaire doit pouvoir régénérer son
      // lien famille depuis n'importe quel appareil.
      await writeRecord(id, {
        v: 1, createdAt: updatedAt, updatedAt,
        owner: hash(ownerToken), family: familyToken,
        data,
      });
      return send(res, 201, { id, ownerToken, familyToken, updatedAt });
    }

    const id = String(req.query?.id || "");
    if (!/^[a-f0-9]{24}$/.test(id)) return send(res, 400, { error: "bad_id" });

    if (req.method === "GET") {
      const rec = await readRecord(id);
      if (!rec) return send(res, 404, { error: "not_found" });
      const body = { data: rec.data, updatedAt: rec.updatedAt };
      // Le jeton famille n'est révélé qu'à qui prouve être propriétaire.
      const t = req.query?.token;
      if (t && sameHash(hash(String(t)), rec.owner)) body.familyToken = rec.family;
      return send(res, 200, body);
    }

    if (req.method === "PUT") {
      const { data, token } = req.body || {};
      if (!data || typeof data !== "object") return send(res, 400, { error: "bad_request" });

      const rec = await readRecord(id);
      if (!rec) return send(res, 404, { error: "not_found" });

      const isOwner  = sameHash(hash(token || ""), rec.owner);
      const isFamily = !isOwner && sameHash(String(token || ""), String(rec.family || ""));
      if (!isOwner && !isFamily) return send(res, 403, { error: "forbidden" });

      // Un proche ne peut jamais écrire autre chose que des réservations.
      const nextData = isFamily ? applyReservationsOnly(rec.data, data) : data;

      const updatedAt = new Date().toISOString();
      await writeRecord(id, { ...rec, updatedAt, data: nextData });
      return send(res, 200, { ok: true, updatedAt });
    }

    res.setHeader("Allow", "GET, POST, PUT");
    return send(res, 405, { error: "method_not_allowed" });
  } catch (e) {
    if (isMissingCredentials(e)) {
      return send(res, 503, { error: "storage_unconfigured",
        message: "Le stockage n'est pas accessible depuis ce déploiement.",
        detail: e?.message || String(e) });
    }
    return send(res, 500, { error: "server_error", message: e?.message || "Erreur serveur" });
  }
}
