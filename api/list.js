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

// Neutralise toutes les réservations d'une charge utile, pour pouvoir vérifier
// qu'une écriture « famille » n'a touché QUE des réservations.
function withoutReservations(data) {
  const cleanItem = (i) => ({
    ...i,
    reservedBy: null,
    models: (i.models || []).map((m) => ({ ...m, reservedBy: null })),
  });
  const cleanSection = (s) => ({
    ...s,
    items: (s.items || []).map(cleanItem),
    customItems: (s.customItems || []).map(cleanItem),
  });
  return JSON.stringify({
    sections: (data?.sections || []).map(cleanSection),
    customSections: (data?.customSections || []).map(cleanSection),
  });
}

function send(res, status, body) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
}

export default async function handler(req, res) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return send(res, 503, { error: "storage_unconfigured",
      message: "Le stockage n'est pas encore activé sur ce projet Vercel." });
  }

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

      if (isFamily && withoutReservations(data) !== withoutReservations(rec.data)) {
        return send(res, 403, { error: "reservations_only",
          message: "Le lien famille ne permet de modifier que les réservations." });
      }

      const updatedAt = new Date().toISOString();
      await writeRecord(id, { ...rec, updatedAt, data });
      return send(res, 200, { ok: true, updatedAt });
    }

    res.setHeader("Allow", "GET, POST, PUT");
    return send(res, 405, { error: "method_not_allowed" });
  } catch (e) {
    return send(res, 500, { error: "server_error", message: e?.message || "Erreur serveur" });
  }
}
