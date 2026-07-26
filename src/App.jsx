import { useState, useEffect, useRef, useCallback } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────
const JSONBIN_API = "https://api.jsonbin.io/v3/b";
const LOCAL_CFG   = "naissance-cfg-v1";
const C = { cream:"#faf6f1", warm:"#f0e8dc", blush:"#e8c5a8", terra:"#c4836a", sage:"#7a9e87", slate:"#4a5568", ink:"#2d2418" };
const PRIO_COLORS = ["#c4836a","#7a9e87","#4a5568","#9a7a5a","#6a7fa8","#a08060","#8a7a9a"];
const TAG_META = {
  logement:{ bg:"rgba(122,158,135,.15)", color:"#5a8a6a", label:"votre logement" },
  creche:  { bg:"rgba(106,127,168,.15)", color:"#5a6a98", label:"crèche" },
  urgent:  { bg:"rgba(196,131,106,.2)",  color:"#c4836a", label:"urgent" },
  custom:  { bg:"rgba(138,122,154,.15)", color:"#6a5a7a", label:"ajouté" },
};

const SECTION_SUGGESTIONS = {
  sommeil: [
    { name:"Baby monitor vidéo", note:"Surveillance à distance via appli. Modèle WiFi avec vision nocturne." },
    { name:"Tour de lit respirant (mesh)", note:"Sécurité : choisir un modèle en mesh aéré, éviter les rembourrés." },
    { name:"Sac de couchage nomade", note:"Pour les nuits chez les grands-parents." },
    { name:"Veilleuse nomade rechargeable", note:"Portable, pour les nuits et les voyages. Lumière chaude douce." },
  ],
  alim: [
    { name:"Stérilisateur vapeur électrique", note:"Stérilise biberons et tétines en quelques minutes." },
    { name:"Goupillon nettoyage biberons", note:"Brosse longue + petite pour tétines. Indispensable au quotidien." },
    { name:"Chauffe-biberon portable (voiture)", note:"Pour chauffer les biberons lors des déplacements." },
    { name:"Couverts bébé ergonomiques", note:"Pour la diversification alimentaire (dès 4-6 mois)." },
  ],
  hygiene: [
    { name:"Coton hydrophile biologique (×200)", note:"Pour le visage, le change et le bain. Le plus doux pour la peau." },
    { name:"Brosse à cheveux douce nouveau-né", note:"Soies naturelles extra-douces pour les premiers cheveux." },
    { name:"Huile de massage bébé", note:"Après le bain. Apaise bébé et renforce le lien parent-enfant." },
    { name:"Filet de bain sécurité", note:"Maintient bébé dans la baignoire pour un bain en sécurité." },
  ],
  mobilite: [
    { name:"Miroir de surveillance voiture", note:"Se fixe au siège arrière, visible dans le rétroviseur conducteur." },
    { name:"Organiseur poussette", note:"Fixé sur la poignée : clés, téléphone, bouteille à portée de main." },
    { name:"Anneau de dentition", note:"Dès 3-4 mois. Silicone alimentaire ou latex naturel." },
    { name:"Couverture nomade légère", note:"Pour la poussette ou le portage par temps frais." },
  ],
  creche: [
    { name:"Pochette linge sale imperméable", note:"Pour rapporter les vêtements souillés de la crèche." },
    { name:"Pochette documents médicaux", note:"Carnet de santé, ordonnances, vaccins — toujours à portée." },
  ],
  eveil: [
    { name:"Livres en tissu sensoriels", note:"Premiers livres lavables en machine. Développe le toucher." },
    { name:"Portique d'éveil musical", note:"Pour les 0-6 mois. Stimule la vision et la coordination motrice." },
    { name:"Boîte à musique peluche", note:"Mélodie apaisante déclenchée par bébé. Aide à l'endormissement." },
    { name:"Tapis puzzle en mousse EVA", note:"Dès 6 mois. Protège lors des premiers pas et des chutes." },
  ],
};

// ─── Données par défaut ───────────────────────────────────────────────────────
const DEFAULT_SECTIONS = [
  { id:"sommeil", priority:1, label:"Indispensable", color:PRIO_COLORS[0], title:"Sommeil & sécurité",
    tip:{ cls:"orange", icon:"⚠️", title:"Sans VMC", body:"Aérez la chambre 10 min chaque matin. Déshumidificateur en mode nuit silencieux." },
    defaultItems:[
      {id:"s1",name:"Lit bébé / couffin",note:"Norme EN 716. Le couffin suffit les 3-4 premiers mois.",tags:[]},
      {id:"s2",name:"Matelas ferme adapté",note:"Aux dimensions exactes du lit. Toujours neuf.",tags:[]},
      {id:"s3",name:"Gigoteuse TOG adapté (×2-3)",note:"TOG 1 été, TOG 2-2.5 automne. Pas de couverture libre.",tags:[]},
      {id:"s4",name:"Siège auto i-Size",note:"Indispensable pour quitter la maternité. Dos à la route.",tags:[]},
      {id:"s5",name:"Hygromètre / thermomètre",note:"Votre chambre monte à 75% la nuit. Idéal : 18-20°C et 40-60%.",tags:["logement"]},
      {id:"s6",name:"Déshumidificateur silencieux",note:"75% nocturnes sans VMC = risque bébé. Meaco 10L recommandé.",tags:["logement","urgent"]},
    ]},
  { id:"alim", priority:2, label:"Essentiel", color:PRIO_COLORS[1], title:"Alimentation", tip:null,
    defaultItems:[
      {id:"a1",name:"Tire-lait électrique double pompage",note:"Si allaitement prévu. Souvent remboursé sur prescription.",tags:[]},
      {id:"a2",name:"Biberons + tétines débit lent",note:"2-3 petits (150ml) + 3-4 grands (240ml).",tags:[]},
      {id:"a3",name:"Chauffe-biberon",note:"Chauffe doucement sans point chaud.",tags:[]},
      {id:"a4",name:"Coussin d'allaitement",note:"Utile aussi pour le positionnement assis plus tard.",tags:[]},
      {id:"a5",name:"Bavoirs & langes (×10-12)",note:"Prévoir en double — maison + crèche.",tags:["creche"]},
      {id:"a6",name:"Boîte isotherme biberons",note:"Pour transporter les biberons à la bonne température.",tags:["creche"]},
    ]},
  { id:"hygiene", priority:3, label:"Très important", color:PRIO_COLORS[2], title:"Hygiène & soins", tip:null,
    defaultItems:[
      {id:"h1",name:"Baignoire bébé + support",note:"Vérifiez si votre évier peut remplacer les premières semaines.",tags:[]},
      {id:"h2",name:"Table à langer + matelas",note:"Avec rebords et sangle. Ou commode convertible pour le T3.",tags:[]},
      {id:"h3",name:"Couches taille 1 & 2",note:"Ne pas surcharger en taille 1 — bébé grandit très vite.",tags:[]},
      {id:"h4",name:"Thermomètre rectal",note:"Le seul vraiment fiable pour les nouveau-nés.",tags:[]},
      {id:"h5",name:"Mouche-bébé",note:"Modèle à aspiration buccale (Frida) le plus efficace.",tags:[]},
      {id:"h6",name:"Kit soins (coupe-ongles, peigne, brosse)",note:"Les ongles de bébé poussent très vite.",tags:[]},
      {id:"h7",name:"Crème change & liniment oléocalcaire",note:"Doux, naturel et économique.",tags:[]},
    ]},
  { id:"mobilite", priority:4, label:"Important", color:PRIO_COLORS[3], title:"Mobilité & déplacements", tip:null,
    defaultItems:[
      {id:"m1",name:"Poussette + nacelle",note:"Cave au RDC = poids moins critique. Légère pour Poitiers à pied.",tags:["logement"]},
      {id:"m2",name:"Écharpe de portage élastique",note:"Indispensable pour le 3ème étage sans ascenseur.",tags:["logement"]},
      {id:"m3",name:"Housse de pluie poussette",note:"Automne pluvieux à Poitiers pour les trajets crèche.",tags:["logement"]},
      {id:"m4",name:"Cape de portage imperméable",note:"Protège bébé et vous sous la pluie en portage.",tags:["logement"]},
      {id:"m5",name:"Sac à langer",note:"Couches, change, liniment, bavoirs. Dès le premier jour.",tags:[]},
      {id:"m6",name:"Transat / relax",note:"Poser bébé en sécurité. Déplaçable dans tout le T3.",tags:[]},
      {id:"m7",name:"Écoute-bébé",note:"Audio suffit dans un T3.",tags:[]},
    ]},
  { id:"creche", priority:5, label:"Crèche", color:PRIO_COLORS[4], title:"Trousseau crèche",
    tip:{ cls:"green", icon:"📋", title:"Renseignez-vous auprès de votre crèche", body:"Chaque structure a sa propre liste. Tout doit être étiqueté au prénom." },
    defaultItems:[
      {id:"c1",name:"Doudou × 2 identiques",note:"Un à la crèche, un à la maison. Acheter deux identiques dès le départ.",tags:["creche"]},
      {id:"c2",name:"Gigoteuse de rechange crèche",note:"Aux dimensions demandées par la crèche.",tags:["creche"]},
      {id:"c3",name:"Tétines de rechange (×3-4)",note:"Si bébé utilise une tétine.",tags:["creche"]},
      {id:"c4",name:"Vêtements de rechange étiquetés",note:"2-3 changes complets à laisser en permanence.",tags:["creche"]},
      {id:"c5",name:"Étiquettes prénom thermocollantes",note:"Pour tout marquer : vêtements, gigoteuse, doudou, biberons.",tags:["creche"]},
    ]},
  { id:"eveil", priority:6, label:"Utile", color:PRIO_COLORS[5], title:"Layette & éveil",
    tip:{ cls:"green", icon:"💡", title:"Seconde main", body:"Vide-greniers et groupes Facebook Poitiers. Réservez le neuf pour la sécurité." },
    defaultItems:[
      {id:"l1",name:"Bodies manches longues & courtes",note:"Coton bio. Taille 1 mois ET 3 mois. 6-8 par taille.",tags:[]},
      {id:"l2",name:"Pyjamas / grenouillères (×5-6)",note:"Pressions devant ou entre les jambes. Éviter les boutons.",tags:[]},
      {id:"l3",name:"Tapis d'éveil",note:"Stimule vision et motricité. Prépare le tummy time.",tags:[]},
      {id:"l4",name:"Mobile musical",note:"Pour le lit ou la table à langer.",tags:[]},
      {id:"l5",name:"Veilleuse douce télécommandée",note:"Lumière chaude pour les tétées nocturnes.",tags:[]},
      {id:"l6",name:"Hochets & jouets d'éveil",note:"Éviter dans le lit avant 6 mois.",tags:[]},
    ]},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2,8); }

function saveCfg(c) {
  try { localStorage.setItem(LOCAL_CFG, JSON.stringify(c)); } catch {}
  try {
    const expires = new Date(Date.now() + 365*24*60*60*1000).toUTCString();
    const secure = window.location.protocol === "https:" ? ";Secure" : "";
    document.cookie = `${LOCAL_CFG}=${encodeURIComponent(JSON.stringify(c))};expires=${expires};path=/;SameSite=Lax${secure}`;
  } catch {}
}
function loadCfg() {
  try {
    const ls = JSON.parse(localStorage.getItem(LOCAL_CFG));
    if (ls) return ls;
  } catch {}
  try {
    const match = document.cookie.split(";").find(c => c.trim().startsWith(LOCAL_CFG + "="));
    if (match) return JSON.parse(decodeURIComponent(match.split("=").slice(1).join("=")));
  } catch {}
  return null;
}

function safeUrl(u) { return u && /^https?:\/\//i.test(u.trim()) ? u.trim() : null; }

// ─── Cache local (survit au rechargement) ────────────────────────────────────
// Principe : on écrit dans localStorage AVANT l'appel réseau, et on marque
// l'écriture « pending ». Le cache ne l'emporte sur JSONbin QUE s'il est encore
// pending, c'est-à-dire si la sauvegarde n'a jamais abouti.
//
// L'ancienne règle comparait Date.now() de CET appareil à updatedAt écrit par
// l'appareil de l'autre parent. Deux horloges différentes : si celle du
// co-parent avançait un peu, son cache gagnait systématiquement, il ne voyait
// plus aucune modification de l'autre — et son client repoussait ses données
// périmées dans le bin, ressuscitant les articles supprimés.
//
// Le cache est indexé PAR BIN : sans cela, ouvrir une deuxième liste faisait gagner
// le cache de la première et l'écrasait par-dessus la seconde.
const LOCAL_CACHE = "naissance-cache-v1";
const cacheKey = (binId) => `${LOCAL_CACHE}:${binId}`;
function saveLocalCache(binId, remote, pending) {
  if (!binId) return;
  try { localStorage.setItem(cacheKey(binId), JSON.stringify({ t: Date.now(), pending: !!pending, remote })); } catch {}
}
// Travail local jamais confirmé par JSONbin. Les caches de l'ancienne version
// n'ont pas de champ `pending` : on les considère comme déjà synchronisés,
// c'est le choix sûr (JSONbin fait autorité).
function pendingCache(cache) { return cache?.pending && cache?.remote ? cache.remote : null; }
function loadLocalCache(binId) {
  if (!binId) return null;
  try { return JSON.parse(localStorage.getItem(cacheKey(binId))); } catch { return null; }
}
function clearLocalCache(binId) {
  try { localStorage.removeItem(cacheKey(binId)); } catch {}
}
// Nettoyage des anciennes clés (suppressions en attente + cache non indexé par bin)
function clearLegacyDels() {
  try { localStorage.removeItem("naissance-del-v1"); } catch {}
  try { localStorage.removeItem("naissance-mdel-v1"); } catch {}
  try { localStorage.removeItem(LOCAL_CACHE); } catch {}
}

function buildInitialData() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    sections: DEFAULT_SECTIONS.map(s => ({
      id: s.id,
      customItems: [],
      items: s.defaultItems.map(i => ({ id:i.id, checked:false, chosen:null, reservedBy:null })),
    })),
    customSections: [],
  };
}

function mergeData(remote) {
  const sections = DEFAULT_SECTIONS.map(def => {
    const rem = remote.sections?.find(s => s.id === def.id) || { items:[], customItems:[] };
    const itemsMap = Object.fromEntries((rem.items||[]).map(i => [i.id, i]));
    return {
      ...def,
      items: def.defaultItems.map(di => ({
        ...di, custom:false,
        checked:    itemsMap[di.id]?.checked    || false,
        chosen:     null,
        reservedBy: itemsMap[di.id]?.reservedBy || null,
        hidden:     itemsMap[di.id]?.hidden     || false,
        models: (() => {
          const remItem = itemsMap[di.id];
          // Si models est explicitement un tableau (même vide), on le respecte — ne pas retomber sur chosen
          if (Array.isArray(remItem?.models)) return remItem.models;
          // Ancien format : models absent, on lit chosen
          const c = remItem?.chosen;
          if (!c) return [];
          const arr = Array.isArray(c)?c:[c];
          return arr.filter(e=>e.brand||e.url||e.price||e.notes).map((e,i)=>({ id:`mg_${di.id}_${i}`, name:e.brand||`Option ${i+1}`, url:e.url||"", price:e.price||"", notes:e.notes||"", reservedBy:null }));
        })(),
      })).concat((rem.customItems||[]).map(ci => ({ ...ci, custom:true }))),
    };
  });
  const customSections = (remote.customSections||[]).map(cs => ({
    ...cs, color: PRIO_COLORS[6],
    items: (cs.items||[]).map(i => ({ ...i, custom:true })),
  }));
  return [...sections, ...customSections];
}

function sectionsToRemote(sections) {
  const defaultIds = new Set(DEFAULT_SECTIONS.map(s => s.id));
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    sections: sections.filter(s => defaultIds.has(s.id)).map(s => ({
      id: s.id,
      items: s.items.filter(i => !i.custom).map(i => ({ id:i.id, checked:i.checked, chosen:i.chosen, reservedBy:i.reservedBy||null, models:i.models||[], hidden:i.hidden||false })),
      customItems: s.items.filter(i => i.custom).map(i => ({ id:i.id, name:i.name, note:i.note, tags:i.tags||[], checked:i.checked, chosen:i.chosen, reservedBy:i.reservedBy||null, models:i.models||[], hidden:i.hidden||false, custom:true })),
    })),
    customSections: sections.filter(s => !defaultIds.has(s.id)).map(s => ({
      id:s.id, title:s.title, label:s.label||"Personnalisé", priority:s.priority,
      items: s.items.map(i => ({ id:i.id, name:i.name, note:i.note||"", tags:i.tags||[], checked:i.checked, chosen:i.chosen, reservedBy:i.reservedBy||null, models:i.models||[], hidden:i.hidden||false, custom:true })),
    })),
  };
}

// ─── JSONbin API calls ────────────────────────────────────────────────────────
// Construit une erreur qui conserve le code HTTP et distingue les causes.
// Sans cela, « quota épuisé » (403) était rapporté comme « clé invalide » :
// l'utilisateur ressaisissait indéfiniment une clé pourtant correcte.
async function apiError(res) {
  const raw = await res.text();
  let parsed = {};
  try { parsed = JSON.parse(raw); } catch {}
  const msg = parsed.message || raw || `Erreur ${res.status}`;
  const err = new Error(msg);
  err.status = res.status;
  err.quotaExhausted = /requests?\s+exhausted/i.test(msg);
  err.notFound = res.status === 404 || /bin not found/i.test(msg);
  err.authError = !err.quotaExhausted && !err.notFound && (res.status === 401 || res.status === 403);
  err.tooLarge = /over 100kb|too large/i.test(msg);
  return err;
}

// Message en français, actionnable, pour l'utilisateur final.
function apiErrorText(e) {
  if (e?.quotaExhausted) return "Quota JSONbin épuisé — le compte a consommé ses 10 000 requêtes offertes. Rachetez des requêtes sur jsonbin.io ou créez un nouveau compte.";
  if (e?.tooLarge)       return "Liste trop volumineuse pour un compte gratuit JSONbin (limite 100 Ko).";
  if (e?.notFound)       return "Liste introuvable : vérifiez le BIN ID.";
  if (e?.authError)      return "Master Key refusée : soit elle a été regénérée, soit cette liste appartient à un autre compte jsonbin.";
  return e?.message || "Problème réseau.";
}

async function apiCreate(apiKey, data) {
  const res = await fetch(JSONBIN_API, {
    method:"POST",
    headers:{ "Content-Type":"application/json", "X-Master-Key":apiKey, "X-Bin-Name":"liste-naissance-2025", "X-Bin-Private":"false" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await apiError(res);
  const j = await res.json();
  return j.metadata.id;
}

async function apiRead(binId, apiKey) {
  const headers = { "X-Bin-Meta":"false" };
  if (apiKey) headers["X-Master-Key"] = apiKey;
  const res = await fetch(`${JSONBIN_API}/${binId}/latest`, { headers });
  if (!res.ok) throw await apiError(res);
  return res.json();
}

async function apiUpdate(binId, apiKey, data) {
  const body = JSON.stringify(data);
  // keepalive est plafonné à 64 Ko par la spec Fetch : au-delà, la requête
  // échouerait systématiquement. On ne l'active que pour les petites charges.
  const canKeepalive = new Blob([body]).size < 60000;
  const res = await fetch(`${JSONBIN_API}/${binId}`, {
    method:"PUT",
    headers:{ "Content-Type":"application/json", "X-Master-Key":apiKey },
    body,
    keepalive: canKeepalive,
  });
  if (!res.ok) throw await apiError(res);
  return res.json();
}

// ─── UI primitives ────────────────────────────────────────────────────────────
const btn = (extra={}) => ({ borderRadius:11, padding:"11px 16px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", border:"none", ...extra });

function Overlay({ onClose, children }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") closeRef.current?.(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, []);
  return (
    <div onClick={onClose} role="dialog" aria-modal="true" style={{ position:"fixed",inset:0,background:"rgba(20,12,4,.7)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.cream,borderRadius:22,padding:"30px 28px 24px",maxWidth:480,width:"100%",boxShadow:"0 32px 80px rgba(0,0,0,.25)",maxHeight:"90vh",overflowY:"auto" }}>
        {children}
      </div>
    </div>
  );
}
function FL({ children }) { return <label style={{ fontSize:10,fontWeight:700,letterSpacing:1.5,color:"#9a8a7a",textTransform:"uppercase",display:"block",marginBottom:5 }}>{children}</label>; }
function FInput({ value, onChange, placeholder, type="text", style={} }) {
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ width:"100%",border:"1.5px solid #e8ddd0",borderRadius:10,padding:"10px 12px",fontSize:14,fontFamily:"'DM Sans',sans-serif",background:"white",outline:"none",color:C.ink,marginBottom:13,...style }}/>;
}
function FTextarea({ value, onChange, placeholder, rows=3 }) {
  return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ width:"100%",border:"1.5px solid #e8ddd0",borderRadius:10,padding:"10px 12px",fontSize:14,fontFamily:"'DM Sans',sans-serif",background:"white",outline:"none",color:C.ink,resize:"vertical",marginBottom:13 }}/>;
}
function Tag({ type }) {
  const m = TAG_META[type]; if(!m) return null;
  return <span style={{ fontSize:10,padding:"2px 8px",borderRadius:10,background:m.bg,color:m.color,fontWeight:700,letterSpacing:.5,textTransform:"uppercase",marginLeft:5,verticalAlign:"middle",display:"inline-block" }}>{m.label}</span>;
}
function TipBox({ tip }) {
  const o = tip.cls==="orange";
  return <div style={{ borderRadius:"0 10px 10px 0",padding:"12px 14px",borderLeft:`3px solid ${o?"#c4836a":"#7a9e87"}`,background:o?"rgba(196,131,106,.08)":"rgba(122,158,135,.08)",fontSize:13,color:C.slate,lineHeight:1.6,marginBottom:12 }}><strong style={{ fontSize:10,letterSpacing:2,textTransform:"uppercase",display:"block",marginBottom:4,color:o?"#c4836a":"#7a9e87" }}>{tip.icon} {tip.title}</strong>{tip.body}</div>;
}
function Toast({ msg, type="ok" }) {
  if(!msg) return null;
  const colors = { ok:C.ink, err:"#c4836a", sync:"#7a9e87" };
  return <div style={{ position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:colors[type]||C.ink,color:C.cream,padding:"10px 22px",borderRadius:20,fontSize:13,fontWeight:500,zIndex:9999,boxShadow:"0 8px 32px rgba(0,0,0,.2)",pointerEvents:"none",maxWidth:"calc(100vw - 32px)",textAlign:"center",lineHeight:1.4 }}>{msg}</div>;
}

// ─── Setup Screen ─────────────────────────────────────────────────────────────
function SetupScreen({ onDone }) {
  const [tab, setTab] = useState("owner");
  const [apiKey, setApiKey] = useState("");
  const [binId, setBinId] = useState("");
  const [reconnectKey, setReconnectKey] = useState("");
  const [reconnectBinId, setReconnectBinId] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showReconnectKey, setShowReconnectKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleOwner() {
    if (!apiKey.trim()) return setErr("Veuillez entrer votre Master Key.");
    setLoading(true); setErr("");
    try {
      const data = buildInitialData();
      const id = await apiCreate(apiKey.trim(), data);
      const cfg = { apiKey: apiKey.trim(), binId: id, mode:"owner" };
      saveCfg(cfg); onDone(cfg);
    } catch(e) { setErr(apiErrorText(e)); }
    setLoading(false);
  }

  async function handleReconnect() {
    if (!reconnectBinId.trim()) return setErr("Veuillez entrer votre BIN ID.");
    if (!reconnectKey.trim()) return setErr("Veuillez entrer votre Master Key.");
    setLoading(true); setErr("");
    try {
      await apiRead(reconnectBinId.trim(), reconnectKey.trim());
      const cfg = { apiKey: reconnectKey.trim(), binId: reconnectBinId.trim(), mode:"owner" };
      saveCfg(cfg); onDone(cfg);
    } catch(e) {
      // Ce message disait toujours « BIN ID ou clé incorrects », même quand la
      // clé était bonne et que le quota JSONbin était simplement épuisé.
      setErr(apiErrorText(e));
    }
    setLoading(false);
  }

  async function handleReader() {
    if (!binId.trim()) return setErr("Veuillez entrer le BIN ID partagé.");
    setLoading(true); setErr("");
    try {
      await apiRead(binId.trim());
      const cfg = { binId: binId.trim(), mode:"reader" };
      saveCfg(cfg); onDone(cfg);
    } catch(e) { setErr(apiErrorText(e)); }
    setLoading(false);
  }

  const tabStyle = (active) => ({ flex:1, padding:"9px 0", borderRadius:10, border:"none", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", background:active?C.ink:"transparent", color:active?C.cream:"#9a8a7a", transition:"all .2s" });

  return (
    <div style={{ minHeight:"100vh", background:C.cream, display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ maxWidth:460, width:"100%", background:"white", borderRadius:24, padding:"36px 32px", boxShadow:"0 24px 80px rgba(0,0,0,.1)" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:11, letterSpacing:3, textTransform:"uppercase", color:C.terra, marginBottom:8, fontWeight:700 }}>Liste de naissance · Septembre 2025</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:C.ink, fontWeight:400, lineHeight:1.3 }}>Bienvenue,<br/><em style={{ color:C.terra, fontStyle:"italic" }}>comment accéder ?</em></div>
        </div>

        <div style={{ display:"flex", gap:6, background:C.warm, borderRadius:14, padding:6, marginBottom:24 }}>
          <button style={tabStyle(tab==="owner")} onClick={()=>{setTab("owner");setErr("")}}>👶 Créer ma liste</button>
          <button style={tabStyle(tab==="reconnect")} onClick={()=>{setTab("reconnect");setErr("")}}>🔑 Je reviens</button>
          <button style={tabStyle(tab==="reader")} onClick={()=>{setTab("reader");setErr("")}}>🎁 J'ai reçu un lien</button>
        </div>

        {tab === "owner" && (
          <div>
            <div style={{ background:"rgba(122,158,135,.08)", border:"1.5px solid rgba(122,158,135,.2)", borderRadius:12, padding:"12px 14px", marginBottom:18, fontSize:13, color:C.slate, lineHeight:1.6 }}>
              <strong style={{ color:C.sage, display:"block", marginBottom:4 }}>📋 Comment obtenir votre clé ?</strong>
              1. Allez sur <a href="https://jsonbin.io" target="_blank" rel="noopener noreferrer" style={{ color:C.terra, fontWeight:600 }}>jsonbin.io</a> → créez un compte gratuit<br/>
              2. Dashboard → <strong>API Keys</strong> → copiez votre <strong>Master Key</strong>
            </div>
            <FL>Master Key JSONbin</FL>
            <div style={{ position:"relative" }}>
              <FInput value={apiKey} onChange={setApiKey} placeholder="$2b$10$..." type={showKey?"text":"password"}/>
              <button onClick={()=>setShowKey(v=>!v)} style={{ position:"absolute", right:10, top:10, background:"none", border:"none", cursor:"pointer", color:"#9a8a7a", fontSize:16 }}>{showKey?"🙈":"👁️"}</button>
            </div>
            <div style={{ fontSize:12, color:"#9a8a7a", marginTop:-8, marginBottom:16, lineHeight:1.5 }}>
              Votre clé ne sera jamais partagée. Elle reste sur cet appareil uniquement.
            </div>
            {err && <div style={{ color:C.terra, fontSize:13, marginBottom:12 }}>⚠ {err}</div>}
            <button onClick={handleOwner} disabled={loading} style={{ ...btn({ background:C.ink, color:C.cream }), width:"100%", padding:"13px 0", fontSize:14 }}>
              {loading ? "Création de la liste…" : "Créer ma liste partagée →"}
            </button>
          </div>
        )}

        {tab === "reconnect" && (
          <div>
            <div style={{ background:"rgba(196,131,106,.07)", border:"1.5px solid rgba(196,131,106,.2)", borderRadius:12, padding:"12px 14px", marginBottom:18, fontSize:13, color:C.slate, lineHeight:1.6 }}>
              Retrouvez votre liste existante. Votre <strong>BIN ID</strong> se trouve dans les paramètres ⚙️ de votre liste.
            </div>
            <FL>BIN ID de votre liste</FL>
            <FInput value={reconnectBinId} onChange={setReconnectBinId} placeholder="Ex : 6849fa3ce41b4d34f8a1..."/>
            <FL>Master Key JSONbin</FL>
            <div style={{ position:"relative" }}>
              <FInput value={reconnectKey} onChange={setReconnectKey} placeholder="$2b$10$..." type={showReconnectKey?"text":"password"}/>
              <button onClick={()=>setShowReconnectKey(v=>!v)} style={{ position:"absolute", right:10, top:10, background:"none", border:"none", cursor:"pointer", color:"#9a8a7a", fontSize:16 }}>{showReconnectKey?"🙈":"👁️"}</button>
            </div>
            {err && <div style={{ color:C.terra, fontSize:13, marginBottom:12 }}>⚠ {err}</div>}
            <button onClick={handleReconnect} disabled={loading} style={{ ...btn({ background:C.ink, color:C.cream }), width:"100%", padding:"13px 0", fontSize:14 }}>
              {loading ? "Connexion…" : "Me reconnecter →"}
            </button>
          </div>
        )}

        {tab === "reader" && (
          <div>
            <div style={{ background:"rgba(196,131,106,.07)", border:"1.5px solid rgba(196,131,106,.2)", borderRadius:12, padding:"12px 14px", marginBottom:18, fontSize:13, color:C.slate, lineHeight:1.6 }}>
              Le parent vous a communiqué un <strong>BIN ID</strong> (une suite de chiffres et lettres). Entrez-le ci-dessous pour voir la liste.
            </div>
            <FL>BIN ID partagé</FL>
            <FInput value={binId} onChange={setBinId} placeholder="Ex : 6849fa3ce41b4d34f8a1..."/>
            {err && <div style={{ color:C.terra, fontSize:13, marginBottom:12 }}>⚠ {err}</div>}
            <button onClick={handleReader} disabled={loading} style={{ ...btn({ background:C.ink, color:C.cream }), width:"100%", padding:"13px 0", fontSize:14 }}>
              {loading ? "Connexion…" : "Accéder à la liste →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────
const SELECTABLE_TAGS = ["logement","creche","urgent"];
function TagSelector({ selected, onChange }) {
  function toggle(t) { onChange(selected.includes(t)?selected.filter(x=>x!==t):[...selected,t]); }
  return (
    <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:13 }}>
      {SELECTABLE_TAGS.map(t=>{ const m=TAG_META[t]; const on=selected.includes(t); return (
        <button key={t} onClick={()=>toggle(t)} type="button" style={{ fontSize:11,padding:"4px 12px",borderRadius:10,border:`1.5px solid ${on?m.color:"#e8ddd0"}`,background:on?m.bg:"white",color:on?m.color:"#9a8a7a",fontWeight:700,letterSpacing:.5,textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .15s" }}>{m.label}</button>
      );})}
    </div>
  );
}

function AddItemModal({ sectionId, sectionTitle, onAdd, onClose }) {
  const [name,setName]=useState(""); const [note,setNote]=useState(""); const [url,setUrl]=useState(""); const [tags,setTags]=useState([]);
  const suggestions = SECTION_SUGGESTIONS[sectionId] || [];
  return (
    <Overlay onClose={onClose}>
      <div style={{ fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#8a7a9a",marginBottom:6,fontWeight:700 }}>Ajouter un article</div>
      <div style={{ fontFamily:"'Playfair Display',serif",fontSize:19,color:C.ink,fontWeight:600,marginBottom:16 }}>{sectionTitle}</div>
      {suggestions.length > 0 && (
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:"#9a8a7a",fontWeight:700,marginBottom:8 }}>✨ Indispensables à ajouter</div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
            {suggestions.map((s,i) => {
              const active = name === s.name;
              return (
                <button key={i} onClick={()=>{ setName(s.name); setNote(s.note); }} type="button"
                  style={{ fontSize:12,padding:"5px 13px",borderRadius:20,border:`1.5px solid ${active?"#c4836a":"#e8ddd0"}`,background:active?"rgba(196,131,106,.1)":"white",color:active?"#c4836a":"#6a5a7a",fontWeight:active?700:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .15s" }}>
                  {active?"✓ ":""}{s.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <FL>Nom *</FL><FInput value={name} onChange={setName} placeholder="Ex : Anneau de dentition"/>
      <FL>Note / description</FL><FTextarea value={note} onChange={setNote} placeholder="Quantité, pourquoi, marque..." rows={2}/>
      <FL>Lien produit (optionnel)</FL><FInput value={url} onChange={setUrl} placeholder="https://..."/>
      <FL>Tags (optionnel)</FL><TagSelector selected={tags} onChange={setTags}/>
      <div style={{ display:"flex",gap:10,marginTop:6 }}>
        <button onClick={()=>{ if(name.trim()) onAdd(name.trim(),note.trim(),url.trim(),tags); }} style={{ ...btn({background:C.ink,color:C.cream,opacity:name.trim()?1:.45}), flex:1 }}>Ajouter</button>
        <button onClick={onClose} style={btn({background:"white",color:"#7a6a5a",border:"1.5px solid #e8ddd0"})}>Annuler</button>
      </div>
    </Overlay>
  );
}

function EditItemModal({ item, onSave, onClose }) {
  const [name,setName]=useState(item.name); const [note,setNote]=useState(item.note||""); const [tags,setTags]=useState((item.tags||[]).filter(t=>SELECTABLE_TAGS.includes(t)));
  return (
    <Overlay onClose={onClose}>
      <div style={{ fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#8a7a9a",marginBottom:6,fontWeight:700 }}>Modifier</div>
      <FL>Nom</FL><FInput value={name} onChange={setName} placeholder="Nom de l'article"/>
      <FL>Note</FL><FTextarea value={note} onChange={setNote} placeholder="Description..." rows={2}/>
      <FL>Tags</FL><TagSelector selected={tags} onChange={setTags}/>
      <div style={{ display:"flex",gap:10,marginTop:6 }}>
        <button onClick={()=>onSave(name.trim(),note.trim(),tags)} style={{ ...btn({background:C.ink,color:C.cream}), flex:1 }}>Enregistrer</button>
        <button onClick={onClose} style={btn({background:"white",color:"#7a6a5a",border:"1.5px solid #e8ddd0"})}>Annuler</button>
      </div>
    </Overlay>
  );
}

function AddSectionModal({ onAdd, onClose }) {
  const [title,setTitle]=useState("");
  return (
    <Overlay onClose={onClose}>
      <div style={{ fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#8a7a9a",marginBottom:6,fontWeight:700 }}>Nouvelle catégorie</div>
      <div style={{ fontFamily:"'Playfair Display',serif",fontSize:19,color:C.ink,fontWeight:600,marginBottom:20 }}>Créer une section</div>
      <FL>Nom *</FL><FInput value={title} onChange={setTitle} placeholder="Ex : Jouets, Matériel médical..."/>
      <div style={{ display:"flex",gap:10,marginTop:6 }}>
        <button onClick={()=>{ if(title.trim()) onAdd(title.trim()); }} style={{ ...btn({background:C.ink,color:C.cream,opacity:title.trim()?1:.45}), flex:1 }}>Créer</button>
        <button onClick={onClose} style={btn({background:"white",color:"#7a6a5a",border:"1.5px solid #e8ddd0"})}>Annuler</button>
      </div>
    </Overlay>
  );
}

// ─── ReserveModal ─────────────────────────────────────────────────────────────
function ReserveModal({ item, color, onSave, onClose }) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  return (
    <Overlay onClose={onClose}>
      <div style={{ fontSize:10,letterSpacing:3,textTransform:"uppercase",color,marginBottom:6,fontWeight:700 }}>Je l'achète 🎁</div>
      <div style={{ fontFamily:"'Playfair Display',serif",fontSize:19,color:C.ink,fontWeight:600,marginBottom:6,lineHeight:1.3 }}>{item.name}</div>
      {(() => { const urls = (Array.isArray(item.chosen)?item.chosen:[item.chosen]).filter(Boolean).map(e=>safeUrl(e.url)).filter(Boolean); return urls.length ? urls.map((u,i)=><a key={i} href={u} target="_blank" rel="noopener noreferrer" style={{ display:"inline-block",fontSize:13,fontWeight:600,color,textDecoration:"none",marginBottom:8,marginRight:12 }}>🔗 Option {urls.length>1?i+1:""} voir l'article →</a>) : null; })()}
      <div style={{ fontSize:13,color:"#7a6a5a",lineHeight:1.6,marginBottom:18,background:"rgba(122,158,135,.07)",borderRadius:10,padding:"10px 14px" }}>
        En confirmant, <strong>tout le monde verra que cet article est pris</strong>. Plus personne ne l'achètera en double.
      </div>
      <FL>Votre prénom *</FL>
      <FInput value={name} onChange={setName} placeholder="Ex : Tante Marie, Papi Jacques..."/>
      <FL>Message pour les parents (optionnel)</FL>
      <FTextarea value={note} onChange={setNote} placeholder="On vous l'offre avec joie !" rows={2}/>
      <div style={{ display:"flex",gap:10,marginTop:6 }}>
        <button
          onClick={()=>{ if(name.trim()) onSave({ name:name.trim(), note:note.trim(), date:new Date().toISOString() }); }}
          style={{ ...btn({background:"#7a9e87",color:"white",opacity:name.trim()?1:.45}), flex:1, padding:"12px 0" }}
        >
          🎁 J'achète cet article
        </button>
        <button onClick={onClose} style={btn({background:"white",color:"#7a6a5a",border:"1.5px solid #e8ddd0"})}>Annuler</button>
      </div>
    </Overlay>
  );
}

// ─── ModelsModal ──────────────────────────────────────────────────────────────
function ModelsModal({ item, color, onSave, onClose }) {
  const [models, setModels] = useState(() => (item.models||[]).map(m=>({...m})));

  function addModel() {
    setModels(prev => [...prev, { id:`m_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, name:"", url:"", price:"", reservedBy:null }]);
  }
  function removeModel(idx) {
    setModels(prev => prev.filter((_,i)=>i!==idx));
  }
  function upModel(idx, k, v) {
    setModels(prev => prev.map((m,i)=>i===idx?{...m,[k]:v}:m));
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ fontSize:10,letterSpacing:3,textTransform:"uppercase",color,marginBottom:6,fontWeight:700 }}>Modèles / Options</div>
      <div style={{ fontFamily:"'Playfair Display',serif",fontSize:19,color:C.ink,fontWeight:600,marginBottom:14,lineHeight:1.3 }}>{item.name}</div>
      <div style={{ fontSize:12,color:"#7a6a5a",lineHeight:1.5,marginBottom:16 }}>
        Listez les modèles spécifiques. Chaque modèle peut être réservé séparément par une personne différente.
      </div>

      <button onClick={addModel} style={{ ...btn({background:C.warm,color:C.ink,border:`1.5px dashed ${color}88`}),width:"100%",marginBottom:16,fontSize:13 }}>
        + Ajouter un modèle
      </button>

      {models.length === 0 && (
        <div style={{ textAlign:"center",color:"#b0a090",fontSize:13,padding:"16px 0" }}>Aucun modèle — cliquez sur "Ajouter" ci-dessus</div>
      )}

      {models.map((m, idx) => (
        <div key={m.id||idx} style={{ marginBottom:14,paddingBottom:14,borderBottom:idx<models.length-1?"1.5px solid #f0e8dc":"none" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
            <div style={{ fontSize:11,letterSpacing:2,textTransform:"uppercase",color,fontWeight:700 }}>Modèle {idx+1}{m.reservedBy?<span style={{ color:"#7a9e87",marginLeft:8 }}>· 🎁 Réservé</span>:null}</div>
            <button onClick={()=>removeModel(idx)} style={{ fontSize:11,color:C.terra,background:"none",border:"1px solid rgba(196,131,106,.3)",borderRadius:6,cursor:"pointer",padding:"3px 10px" }}>Supprimer</button>
          </div>
          <FL>Nom / modèle *</FL><FInput value={m.name} onChange={v=>upModel(idx,"name",v)} placeholder="Ex : Babyzen YOYO 6+, Bout'chou x5…"/>
          <FL>Lien produit</FL><FInput value={m.url||""} onChange={v=>upModel(idx,"url",v)} placeholder="https://..."/>
          <FL>Prix</FL><FInput value={m.price||""} onChange={v=>upModel(idx,"price",v)} placeholder="Ex : 350 €"/>
          <FL>Notes</FL><FTextarea value={m.notes||""} onChange={v=>upModel(idx,"notes",v)} placeholder="Taille, couleur, avis…" rows={2}/>
        </div>
      ))}

      <div style={{ display:"flex",gap:10,marginTop:4 }}>
        <button onClick={()=>onSave(models.filter(m=>m.name.trim()))} style={{ ...btn({background:C.ink,color:C.cream}),flex:1 }}>Enregistrer</button>
        <button onClick={onClose} style={btn({background:"white",color:"#7a6a5a",border:"1.5px solid #e8ddd0"})}>Annuler</button>
      </div>
    </Overlay>
  );
}

// ─── ItemCard ─────────────────────────────────────────────────────────────────
function ItemCard({ item, color, isOwner, isContributor, onToggle, onOpenModels, onDelete, onEdit, onReserve, onClearReserve, onReserveModel, onClearModelReserve, onDeleteModel }) {
  const models = item.models||[];
  const hasModels = models.length > 0;
  const res = item.reservedBy;
  const canReserve = isContributor && !res && !item.checked;
  const borderColor = res ? "rgba(122,158,135,.35)" : hasModels ? color+"55" : "transparent";
  const bgColor = item.checked ? "#f0e8dc" : res ? "rgba(122,158,135,.04)" : "white";

  return (
    <div style={{ background:bgColor,borderRadius:14,border:`1.5px solid ${borderColor}`,boxShadow:res?"0 2px 12px rgba(122,158,135,.12)":hasModels?`0 2px 14px ${color}18`:"none",overflow:"hidden",opacity:item.checked?.6:1,transition:"all .2s ease" }}>
      <div style={{ display:"flex",alignItems:"flex-start",gap:12,padding:"13px 13px 11px" }}>
        <div
          onClick={isOwner?onToggle:undefined}
          role={isOwner?"checkbox":undefined}
          aria-checked={isOwner?!!item.checked:undefined}
          aria-label={isOwner?`Marquer « ${item.name} » comme reçu`:undefined}
          tabIndex={isOwner?0:undefined}
          onKeyDown={isOwner?(e=>{ if(e.key===" "||e.key==="Enter"){ e.preventDefault(); onToggle(); } }):undefined}
          style={{ width:22,height:22,borderRadius:7,flexShrink:0,marginTop:1,border:`2px solid ${item.checked?"#7a9e87":"#e8c5a8"}`,background:item.checked?"#7a9e87":"white",display:"flex",alignItems:"center",justifyContent:"center",cursor:isOwner?"pointer":"default",transition:"all .2s" }}
        >
          {item.checked&&<svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:15,fontWeight:600,color:item.checked?"#9a8a7a":C.ink,textDecoration:item.checked?"line-through":"none",marginBottom:2,lineHeight:1.3 }}>
            {item.name}{(item.tags||[]).map(t=><Tag key={t} type={t}/>)}{item.custom&&<Tag type="custom"/>}
          </div>
          {item.note&&<div style={{ fontSize:12,color:"#9a8a7a",fontWeight:300,lineHeight:1.5 }}>{item.note}</div>}
          {!hasModels&&(()=>{ const urls=(Array.isArray(item.chosen)?item.chosen:[item.chosen]).filter(Boolean).map(e=>safeUrl(e.url)).filter(Boolean); return urls.length?urls.map((u,i)=><a key={i} href={u} target="_blank" rel="noopener noreferrer" style={{ fontSize:11,color,fontWeight:600,textDecoration:"none",display:"inline-block",marginTop:3,marginRight:8 }}>🔗 {urls.length>1?`Option ${i+1} · `:""}Voir le produit →</a>):null; })()}
        </div>
        <div style={{ display:"flex",gap:5,flexShrink:0,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end" }}>
          {isOwner && item.custom && <button onClick={onEdit} title="Modifier l'article" aria-label={`Modifier « ${item.name} »`} style={{ width:28,height:28,borderRadius:7,border:"1.5px solid #e8ddd0",background:"transparent",color:"#9a8a7a",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center" }}>✏️</button>}
          {isOwner && <button onClick={onOpenModels} title={hasModels?"Modifier les modèles":"Ajouter des modèles"} aria-label={`${hasModels?"Modifier":"Ajouter"} les modèles de « ${item.name} »`} style={{ width:28,height:28,borderRadius:7,border:`1.5px solid ${hasModels?color:"#e8ddd0"}`,background:hasModels?`${color}15`:"transparent",color:hasModels?color:"#b0a090",cursor:"pointer",fontSize:hasModels?13:20,display:"flex",alignItems:"center",justifyContent:"center" }}>{hasModels?"✏️":"＋"}</button>}
          {isOwner && <button onClick={onDelete} title="Supprimer l'article" aria-label={`Supprimer « ${item.name} »`} style={{ width:28,height:28,borderRadius:7,border:"1.5px solid rgba(196,131,106,.25)",background:"rgba(196,131,106,.06)",color:C.terra,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center" }}>🗑️</button>}
          {isOwner && !item.checked && (
            <button onClick={onToggle} style={{ ...btn({background:"#7a9e87",color:"white"}), padding:"5px 14px", fontSize:12, borderRadius:8 }}>
              ✓ J'ai reçu
            </button>
          )}
          {isOwner && item.checked && (
            <button onClick={onToggle} style={{ ...btn({background:"rgba(196,131,106,.1)",color:C.terra,border:"1.5px solid rgba(196,131,106,.3)"}), padding:"5px 12px", fontSize:12, borderRadius:8 }}>
              ↩ Annuler
            </button>
          )}
          {canReserve && !hasModels && (
            <button onClick={onReserve} style={{ ...btn({background:"#7a9e87",color:"white"}), padding:"5px 14px", fontSize:12, borderRadius:8 }}>
              🎁 J'achète
            </button>
          )}
          {item.checked && !isOwner && (
            <span style={{ fontSize:11,fontWeight:700,color:"#5a8a6a",background:"rgba(122,158,135,.15)",borderRadius:8,padding:"4px 10px",whiteSpace:"nowrap" }}>
              ✓ Reçu
            </span>
          )}
          {res && !isOwner && !canReserve && !item.checked && (
            <span style={{ fontSize:11,fontWeight:700,color:"#5a8a6a",background:"rgba(122,158,135,.12)",borderRadius:8,padding:"4px 10px",whiteSpace:"nowrap" }}>
              🎁 Réservé
            </span>
          )}
        </div>
      </div>

      {/* Reservation banner */}
      {res && !item.checked && (
        <div style={{ margin:"0 13px 11px",borderRadius:10,padding:"9px 14px",borderLeft:"3px solid #7a9e87",background:"rgba(122,158,135,.09)" }}>
          <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
            <span style={{ fontSize:16 }}>🎁</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13,fontWeight:700,color:"#4a7a5a" }}>Réservé par {res.name}</div>
              {res.note && <div style={{ fontSize:12,color:"#6a7a6a",marginTop:2,lineHeight:1.4 }}>{res.note}</div>}
            </div>
            {isOwner && (
              <button onClick={onClearReserve} style={{ fontSize:11,color:"#9a8a7a",background:"none",border:"1px solid #d8cdc0",borderRadius:6,cursor:"pointer",padding:"3px 9px",flexShrink:0 }}>
                Libérer
              </button>
            )}
          </div>
          {isContributor && (
            <button onClick={onClearReserve} style={{ marginTop:10,width:"100%",padding:"8px 0",borderRadius:8,border:"1.5px solid rgba(196,131,106,.4)",background:"rgba(196,131,106,.08)",color:C.terra,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif" }}>
              ↩ Annuler mon achat
            </button>
          )}
        </div>
      )}

      {/* Models — individual reservable products */}
      {(hasModels || isOwner) && (
        <div style={{ margin:"0 13px 11px",display:"flex",flexDirection:"column",gap:5 }}>
          {models.map((m) => {
            const mRes = m.reservedBy;
            const canReserveModel = isContributor && !mRes && !item.checked;
            return (
              <div key={m.id} style={{ borderRadius:10,padding:"10px 12px",background:mRes?"rgba(122,158,135,.07)":"rgba(0,0,0,.025)",border:mRes?"1.5px solid rgba(122,158,135,.3)":"1.5px solid #f0e8dc",display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:13,fontWeight:600,color:mRes?"#4a7a5a":C.ink,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                    {m.name}
                    {m.price&&<span style={{ fontSize:12,fontWeight:700,color }}>{m.price}</span>}
                  </div>
                  {m.notes&&<div style={{ fontSize:11,color:"#7a6a5a",marginTop:2,lineHeight:1.4 }}>{m.notes}</div>}
                  {mRes&&<div style={{ fontSize:11,color:"#5a8a6a",marginTop:2 }}>🎁 Réservé par {mRes.name}</div>}
                  {(()=>{ const u=safeUrl(m.url); return u&&<a href={u} target="_blank" rel="noopener noreferrer" style={{ fontSize:11,color,fontWeight:600,textDecoration:"none",display:"inline-block",marginTop:3 }}>🔗 Voir →</a>; })()}
                </div>
                {canReserveModel && (
                  <button onClick={()=>onReserveModel(m.id)} style={{ ...btn({background:"#7a9e87",color:"white"}),padding:"5px 12px",fontSize:11,borderRadius:7,flexShrink:0 }}>🎁 J'achète</button>
                )}
                {isOwner && !mRes && (
                  <button onClick={()=>onDeleteModel(m.id)} title="Supprimer ce modèle" aria-label={`Supprimer le modèle « ${m.name} »`} style={{ width:26,height:26,borderRadius:6,border:"1px solid rgba(196,131,106,.3)",background:"rgba(196,131,106,.06)",color:C.terra,cursor:"pointer",fontSize:12,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>🗑️</button>
                )}
                {mRes && isOwner && (
                  <button onClick={()=>onClearModelReserve(m.id)} style={{ fontSize:11,color:"#9a8a7a",background:"none",border:"1px solid #d8cdc0",borderRadius:6,cursor:"pointer",padding:"3px 9px",flexShrink:0 }}>Libérer</button>
                )}
                {mRes && isContributor && (
                  <button onClick={()=>onClearModelReserve(m.id)} style={{ fontSize:11,color:C.terra,background:"none",border:"1px solid rgba(196,131,106,.3)",borderRadius:6,cursor:"pointer",padding:"3px 9px",flexShrink:0 }}>↩ Annuler</button>
                )}
                {mRes && !isOwner && !isContributor && (
                  <span style={{ fontSize:11,fontWeight:700,color:"#5a8a6a",background:"rgba(122,158,135,.15)",borderRadius:8,padding:"4px 10px",whiteSpace:"nowrap",flexShrink:0 }}>🎁 Pris</span>
                )}
              </div>
            );
          })}
          {isOwner && (
            <button onClick={onOpenModels} style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:"transparent",border:`1.5px dashed ${color}66`,borderRadius:9,color,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif" }}>
              ＋ {hasModels ? "Ajouter un autre article" : "Ajouter des articles spécifiques"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
function SettingsModal({ cfg, onClose, onReset, onUpdateKey }) {
  const [familyKey, setFamilyKey] = useState(cfg.apiKey || "");
  const [showFamilyKey, setShowFamilyKey] = useState(false);
  const [copiedReader, setCopiedReader] = useState(false);
  const [copiedFamily, setCopiedFamily] = useState(false);
  const [copiedCoparent, setCopiedCoparent] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyLoading, setNewKeyLoading] = useState(false);
  const [newKeyErr, setNewKeyErr] = useState("");

  async function handleNewKey() {
    if (!newKey.trim()) return;
    setNewKeyLoading(true); setNewKeyErr("");
    try {
      await apiRead(cfg.binId, newKey.trim());
      onUpdateKey(newKey.trim());
      setNewKey("");
    } catch (e) {
      setNewKeyErr(apiErrorText(e));
    }
    setNewKeyLoading(false);
  }

  const base = window.location.origin + window.location.pathname;
  const readerUrl    = `${base}?binId=${cfg.binId}`;
  const familyUrl    = familyKey.trim() ? `${base}?binId=${cfg.binId}&ck=${encodeURIComponent(familyKey.trim())}` : "";
  const coparentUrl  = cfg.apiKey ? `${base}?binId=${cfg.binId}&ck=${encodeURIComponent(cfg.apiKey)}&mode=owner` : "";

  function copyText(text, setCopied) {
    navigator.clipboard?.writeText(text).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false), 2500); }).catch(()=>{
      const el = document.createElement("textarea");
      el.value = text; document.body.appendChild(el); el.select(); document.execCommand("copy");
      document.body.removeChild(el); setCopied(true); setTimeout(()=>setCopied(false), 2500);
    });
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ fontFamily:"'Playfair Display',serif",fontSize:20,color:C.ink,fontWeight:600,marginBottom:20 }}>Partager la liste</div>

      {/* BIN ID */}
      <div style={{ background:C.warm,borderRadius:12,padding:"14px 16px",marginBottom:12 }}>
        <div style={{ fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#9a8a7a",marginBottom:4,fontWeight:700 }}>Votre BIN ID</div>
        <div style={{ fontSize:14,fontWeight:700,color:C.ink,fontFamily:"monospace",wordBreak:"break-all",marginBottom:8 }}>{cfg.binId}</div>
        <div style={{ fontSize:12,color:"#7a6a5a",lineHeight:1.5,marginBottom:10 }}>
          Lien <strong>lecture seule</strong> — vos proches voient la liste et les articles déjà réservés, mais ne peuvent pas réserver eux-mêmes.
        </div>
        <button onClick={()=>copyText(readerUrl, setCopiedReader)} style={{ ...btn({background:C.slate,color:"white"}), width:"100%", padding:"9px 0", fontSize:13 }}>
          {copiedReader ? "✓ Copié !" : "📋 Copier le lien lecture seule"}
        </button>
      </div>

      {/* Co-parent link — owner only */}
      {cfg.mode === "owner" && coparentUrl && (
        <div style={{ background:"rgba(196,131,106,.06)",border:"1.5px solid rgba(196,131,106,.2)",borderRadius:12,padding:"14px 16px",marginBottom:12 }}>
          <div style={{ fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.terra,marginBottom:4,fontWeight:700 }}>👶 Lien co-parent (accès complet)</div>
          <div style={{ fontSize:12,color:"#7a6a5a",lineHeight:1.6,marginBottom:12 }}>
            Partagez ce lien à votre compagne/compagnon. Il/elle aura le même accès que vous — cocher, modifier, gérer la liste. <strong>Ne partagez qu'avec votre co-parent.</strong>
          </div>
          <button onClick={()=>copyText(coparentUrl, setCopiedCoparent)} style={{ ...btn({background:C.terra,color:"white"}), width:"100%", padding:"9px 0", fontSize:13 }}>
            {copiedCoparent ? "✓ Lien copié ! Envoyez-le sur WhatsApp 🎉" : "🔗 Copier le lien co-parent"}
          </button>
        </div>
      )}

      {/* Contributor link — owner only */}
      {cfg.mode === "owner" && (
        <div style={{ background:"rgba(122,158,135,.06)",border:"1.5px solid rgba(122,158,135,.2)",borderRadius:12,padding:"14px 16px",marginBottom:12 }}>
          <div style={{ fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#5a8a6a",marginBottom:4,fontWeight:700 }}>🎁 Lien famille (peut réserver)</div>
          <div style={{ fontSize:12,color:"#5a7a5a",lineHeight:1.6,marginBottom:12 }}>
            Pour que vos proches puissent cliquer <strong>"J'achète"</strong>, entrez votre Master Key ci-dessous. Le lien généré leur donnera accès en écriture. <strong>Ne partagez ce lien qu'avec des personnes de confiance.</strong>
          </div>
          <FL>Votre Master Key JSONbin</FL>
          <div style={{ position:"relative" }}>
            <FInput value={familyKey} onChange={setFamilyKey} placeholder="$2b$10$..." type={showFamilyKey?"text":"password"}/>
            <button onClick={()=>setShowFamilyKey(v=>!v)} style={{ position:"absolute",right:10,top:10,background:"none",border:"none",cursor:"pointer",color:"#9a8a7a",fontSize:15 }}>{showFamilyKey?"🙈":"👁️"}</button>
          </div>
          {familyUrl && (
            <button onClick={()=>copyText(familyUrl, setCopiedFamily)} style={{ ...btn({background:"#7a9e87",color:"white"}), width:"100%", padding:"9px 0", fontSize:13 }}>
              {copiedFamily ? "✓ Lien copié ! Envoyez-le sur WhatsApp 🎉" : "🔗 Copier le lien famille (WhatsApp)"}
            </button>
          )}
        </div>
      )}

      {/* Role */}
      <div style={{ background:C.warm,borderRadius:12,padding:"12px 16px",marginBottom:12 }}>
        <div style={{ fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#9a8a7a",marginBottom:4,fontWeight:700 }}>Votre rôle</div>
        <div style={{ fontSize:14,color:C.ink }}>
          {cfg.mode==="owner"?"👶 Propriétaire (gestion complète)":cfg.mode==="contributor"?"🎁 Famille (peut réserver)":"👀 Lecteur (lecture seule)"}
        </div>
      </div>

      {/* Update key — owner only */}
      {cfg.mode === "owner" && onUpdateKey && (
        <div style={{ background:"rgba(196,131,106,.06)",border:"1.5px solid rgba(196,131,106,.2)",borderRadius:12,padding:"14px 16px",marginBottom:16 }}>
          <div style={{ fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.terra,marginBottom:4,fontWeight:700 }}>🔑 Mettre à jour la Master Key</div>
          <div style={{ fontSize:12,color:"#7a6a5a",lineHeight:1.5,marginBottom:10 }}>
            Si votre clé JSONbin a changé (ou a été regénérée), entrez la nouvelle ici. Vos données ne seront pas perdues.
          </div>
          <div style={{ position:"relative" }}>
            <FInput value={newKey} onChange={setNewKey} placeholder="$2b$10$..." type={showNewKey?"text":"password"}/>
            <button onClick={()=>setShowNewKey(v=>!v)} style={{ position:"absolute",right:10,top:10,background:"none",border:"none",cursor:"pointer",color:"#9a8a7a",fontSize:15 }}>{showNewKey?"🙈":"👁️"}</button>
          </div>
          {newKeyErr && <div style={{ color:C.terra,fontSize:12,marginBottom:8 }}>⚠ {newKeyErr}</div>}
          {newKey.trim() && (
            <button onClick={handleNewKey} disabled={newKeyLoading} style={{ ...btn({background:C.terra,color:"white"}),width:"100%",padding:"9px 0",fontSize:13 }}>
              {newKeyLoading?"Validation en cours…":"✓ Valider la nouvelle clé"}
            </button>
          )}
        </div>
      )}

      <div style={{ display:"flex",gap:10 }}>
        <button onClick={onClose} style={{ ...btn({background:C.ink,color:C.cream}), flex:1 }}>Fermer</button>
        {cfg.mode==="owner" && <button onClick={onReset} style={btn({background:"rgba(196,131,106,.12)",color:C.terra,border:"1.5px solid rgba(196,131,106,.3)"})}>Changer de compte</button>}
      </div>
    </Overlay>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [cfg, setCfg] = useState(() => {
    // Connexion automatique via URL params (lien WhatsApp famille)
    const p = new URLSearchParams(window.location.search);
    const bid = p.get("binId"), ck = p.get("ck"), m = p.get("mode");
    const stored = loadCfg();
    if (bid && ck && m === "owner") { const c = { binId:bid, apiKey:ck, mode:"owner" }; saveCfg(c); return c; }
    if (bid && ck) {
      // Ne pas rétrograder un propriétaire qui ouvrirait son propre lien famille
      if (stored?.binId === bid && stored.mode === "owner") return stored;
      const c = { binId:bid, apiKey:ck, mode:"contributor" }; saveCfg(c); return c;
    }
    if (bid) {
      // Idem pour le lien lecture seule : on garde l'accès déjà obtenu sur cette liste
      if (stored?.binId === bid && stored.apiKey) return stored;
      // On persiste : l'URL est nettoyée juste après, il faut survivre au rechargement
      const c = { binId:bid, mode:"reader" }; saveCfg(c); return c;
    }
    return stored;
  });
  const [sections, setSections] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const modalRef                = useRef(null);
  modalRef.current              = modal;
  const [toast, setToast]       = useState({ msg:"", type:"ok" });
  const [syncState, setSyncState] = useState("idle");
  const [showSettings, setShowSettings] = useState(false);
  const [keyInvalid, setKeyInvalid] = useState(false);
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const saveTimer = useRef(null);
  const isSavingRef = useRef(false);
  const toastTimer  = useRef(null);
  // Modifications locales pas encore confirmées par JSONbin : tant que c'est vrai,
  // le polling ne doit JAMAIS écraser l'état local.
  const dirtyRef    = useRef(false);
  // Sauvegarde demandée par la dernière action locale : null | "debounced" | "now"
  const pendingRef  = useRef(null);
  const isOwner       = cfg?.mode === "owner";
  const isContributor = cfg?.mode === "contributor";
  const canWrite      = isOwner || isContributor;

  const showToast = useCallback((msg, type="ok", dur=2200) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(()=>setToast({msg:"",type:"ok"}), dur);
  }, []);
  useEffect(() => () => { clearTimeout(toastTimer.current); clearTimeout(saveTimer.current); }, []);

  // Retire binId / ck / mode de l'URL : la Master Key ne doit pas rester dans
  // l'historique du navigateur, les captures d'écran ou le referrer.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (!p.has("binId") && !p.has("ck") && !p.has("mode")) return;
    p.delete("binId"); p.delete("ck"); p.delete("mode");
    const q = p.toString();
    window.history.replaceState({}, "", window.location.pathname + (q?`?${q}`:"") + window.location.hash);
  }, []);

  // ── Load initial data ──
  // Dépend aussi de apiKey : après « mettre à jour la Master Key », il faut
  // relire avec la nouvelle clé (sinon toutes les requêtes restaient en 401).
  useEffect(() => {
    if (!cfg?.binId) { setLoading(false); return; }
    const { binId, apiKey, mode } = cfg;
    let cancelled = false;
    // Un rechargement complet remplace l'état en cours : on annule la sauvegarde
    // en attente et on repart d'une synchro propre (sinon un échec précédent
    // laissait dirtyRef à true et gelait définitivement le polling). Le travail
    // non sauvegardé n'est pas perdu : il est dans le cache, qui gagne ci-dessous.
    clearTimeout(saveTimer.current);
    pendingRef.current = null;
    dirtyRef.current = false;
    setLoading(true);
    clearLegacyDels();
    const cache = loadLocalCache(binId);
    apiRead(binId, apiKey)
      .then(data => {
        if (cancelled) return;
        // JSONbin fait autorité, SAUF si une sauvegarde locale n'a jamais abouti :
        // dans ce cas on reprend ce travail et on le repousse pour resynchroniser.
        const unsaved = pendingCache(cache);
        let source = data;
        if (unsaved) {
          source = unsaved;
          if (mode === "owner" || mode === "contributor") {
            apiUpdate(binId, apiKey, source)
              .then(() => saveLocalCache(binId, source, false))
              .catch(() => {});
          }
        }
        setSections(mergeData(source));
        setSyncState("saved");
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        // Hors-ligne (ou API en erreur) : utiliser le cache si disponible
        const source = cache?.remote || buildInitialData();
        setSections(mergeData(source));
        if (e?.quotaExhausted) { setQuotaExhausted(true); showToast("⚠ Quota JSONbin épuisé", "err", 6000); }
        else if (e?.authError) { setKeyInvalid(true); showToast("⚠ " + apiErrorText(e), "err", 6000); }
        else showToast("⚠ Chargement hors-ligne", "err");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [cfg?.binId, cfg?.apiKey, showToast]);

  // ── Rafraîchissement périodique (tous les modes) ──
  // Le forfait gratuit JSONbin donne 10 000 requêtes UNE SEULE FOIS, jamais
  // renouvelées. L'ancien intervalle de 15 s consommait ~5 700 requêtes par jour
  // et par onglet ouvert — proches compris, puisque leurs lectures sont
  // décomptées du compte des parents. Le stock partait en 2 jours, puis JSONbin
  // répondait 403 « Requests exhausted » à tout, y compris aux sauvegardes.
  // Désormais : 60 s, rien quand l'onglet est en arrière-plan, arrêt après
  // 3 échecs consécutifs, et lecture immédiate au retour sur l'onglet.
  useEffect(() => {
    if (!cfg?.binId) return;
    const { binId, apiKey } = cfg;
    // On ne rafraîchit jamais par-dessus du travail local non sauvegardé, ni
    // pendant qu'une fenêtre « Modèles » est ouverte (son formulaire est un
    // instantané : le rafraîchir en arrière-plan ferait réécrire des données périmées).
    const busy = () => isSavingRef.current || dirtyRef.current || pendingRef.current !== null;
    let failures = 0;
    let stopped = false;

    const refresh = () => {
      if (stopped || document.hidden || busy() || modalRef.current?.type === "models") return;
      apiRead(binId, apiKey).then(data => {
        failures = 0;
        if (busy() || modalRef.current?.type === "models") return;
        // Le distant fait autorité : seul du travail local non confirmé le supplante.
        const source = pendingCache(loadLocalCache(binId)) || data;
        setSections(mergeData(source));
      }).catch(e => {
        // Inutile de brûler le quota restant en boucle sur une erreur permanente
        if (e?.quotaExhausted || e?.authError || ++failures >= 3) stopped = true;
        if (e?.quotaExhausted) setQuotaExhausted(true);
      });
    };

    const t = setInterval(refresh, 60000);
    const onVisible = () => { if (!document.hidden) refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVisible); };
  }, [cfg?.binId, cfg?.apiKey]);

  // ── Save helpers ──
  const doSave = useCallback(async (nextSections) => {
    if (cfg?.mode !== "owner" && cfg?.mode !== "contributor") { dirtyRef.current = false; return false; }
    const remote = sectionsToRemote(nextSections);
    // Écriture synchrone dans localStorage AVANT l'appel réseau, marquée « pending » :
    // même si la page est rechargée pendant la sauvegarde, le travail survit.
    saveLocalCache(cfg.binId, remote, true);
    isSavingRef.current = true;
    setSyncState("saving");
    try {
      await apiUpdate(cfg.binId, cfg.apiKey, remote);
      // Confirmé par JSONbin : le cache cesse de faire autorité sur le distant.
      saveLocalCache(cfg.binId, remote, false);
      dirtyRef.current = false;
      setSyncState("saved");
      showToast("✓ Synchronisé", "sync");
      return true;
    } catch(e) {
      // On garde dirtyRef à true : le polling ne doit pas remplacer un travail
      // local qui n'a pas encore atteint JSONbin.
      setSyncState("error");
      if (e.quotaExhausted) {
        setQuotaExhausted(true);
        showToast("⚠ Quota JSONbin épuisé — sauvegarde impossible", "err", 8000);
      } else if (e.authError) {
        setKeyInvalid(true);
        showToast("⚠ Master Key refusée — ouvrez ⚙️ pour la mettre à jour", "err", 8000);
      } else {
        showToast("⚠ " + apiErrorText(e), "err", 6000);
      }
      return false;
    } finally {
      isSavingRef.current = false;
    }
  }, [cfg, showToast]);

  // Toutes les modifications passent par `update` avec une mise à jour
  // fonctionnelle : deux actions rapprochées dans le même cycle de rendu ne
  // peuvent plus s'annuler l'une l'autre (l'ancien code repartait de la variable
  // `sections` figée par la fermeture).
  const update = useCallback((fn, immediate=false) => {
    if (canWrite) {
      dirtyRef.current = true;
      if (pendingRef.current !== "now") pendingRef.current = immediate ? "now" : "debounced";
      setSyncState("saving");
    }
    setSections(prev => fn(prev));
  }, [canWrite]);

  // Déclenche la sauvegarde une fois le nouvel état effectivement appliqué.
  useEffect(() => {
    const mode = pendingRef.current;
    if (!mode || !canWrite) return;
    pendingRef.current = null;
    clearTimeout(saveTimer.current);
    // Cache écrit immédiatement et marqué « pending » : un rechargement pendant
    // le délai anti-rebond ne perd plus la modification.
    saveLocalCache(cfg.binId, sectionsToRemote(sections), true);
    if (mode === "now") doSave(sections);
    else saveTimer.current = setTimeout(() => doSave(sections), 900);
  }, [sections, canWrite, cfg?.binId, doSave]);

  function updateItem(secId, itemId, patch, immediate=false) {
    update(secs => secs.map(s => s.id!==secId?s:{ ...s, items:s.items.map(i=>i.id!==itemId?i:{ ...i,...patch }) }), immediate);
  }
  function updateItemNow(secId, itemId, patch) {
    updateItem(secId, itemId, patch, true);
  }
  function updateModel(secId, itemId, modelId, patch) {
    update(secs => secs.map(s => s.id!==secId?s:{ ...s, items:s.items.map(i=>i.id!==itemId?i:{ ...i, models:(i.models||[]).map(m=>m.id!==modelId?m:{...m,...patch}) }) }), true);
  }
  function addItem(secId, name, note, url, tags=[]) {
    const chosen = url ? { brand:"", url, price:"", notes:"" } : null;
    const ni = { id:`c_${uid()}`,name,note,tags,checked:false,chosen,reservedBy:null,models:[],hidden:false,custom:true };
    update(secs => secs.map(s => s.id!==secId?s:{ ...s,items:[...s.items,ni] }));
    setModal(null); showToast("✓ Article ajouté");
  }
  function deleteItem(secId, itemId) {
    // Masquage plutôt que suppression définitive, pour les articles par défaut
    // ET personnalisés : le tiroir « articles supprimés » promet une restauration.
    update(secs => secs.map(s => s.id!==secId?s:{ ...s,items:s.items.map(i=>i.id!==itemId?i:{...i,hidden:true}) }), true);
    showToast("Article supprimé — restaurable plus bas");
  }
  function purgeItem(secId, itemId) {
    update(secs => secs.map(s => s.id!==secId?s:{ ...s,items:s.items.filter(i=>i.id!==itemId) }), true);
    showToast("Article supprimé définitivement");
  }
  function deleteModel(secId, itemId, modelId) {
    update(secs => secs.map(s => s.id!==secId?s:{ ...s, items:s.items.map(i=>{
      if (i.id!==itemId) return i;
      const newModels = (i.models||[]).filter(m=>m.id!==modelId);
      return { ...i, models: newModels, chosen: newModels.length > 0 ? i.chosen : null };
    }) }), true);
    showToast("Modèle supprimé");
  }
  function addSection(title) {
    update(secs => [...secs, { id:`sec_${uid()}`,priority:secs.length+1,label:"Personnalisé",color:PRIO_COLORS[6],title,tip:null,items:[],defaultItems:[] }]);
    setModal(null); showToast("✓ Section créée");
  }
  function deleteSection(secId) {
    const sec = sections.find(s => s.id === secId);
    const visible = sec ? sec.items.filter(i => !i.hidden).length : 0;
    if (visible > 0 && !window.confirm(`Supprimer "${sec.title}" et ses ${visible} article(s) ?`)) return;
    update(secs => secs.filter(s => s.id !== secId), true);
    showToast("Section supprimée");
  }
  function restoreItem(secId, itemId) {
    update(secs => secs.map(s => s.id!==secId?s:{ ...s,items:s.items.map(i=>i.id!==itemId?i:{...i,hidden:false}) }), true);
    showToast("✓ Article restauré");
  }

  function handleUpdateKey(newApiKey) {
    const newCfg = { ...cfg, apiKey: newApiKey };
    saveCfg(newCfg);
    setCfg(newCfg);
    setKeyInvalid(false);
    setShowSettings(false);
    showToast("✓ Clé mise à jour — reconnexion en cours…", "sync", 3000);
  }

  if (!cfg) return <SetupScreen onDone={c => { saveCfg(c); setCfg(c); }}/>;

  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.cream, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400&display=swap'); @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:C.ink, fontWeight:400, marginBottom:20 }}>
          Bienvenue,<br/><em style={{ color:C.terra, fontStyle:"italic" }}>petit bout du monde</em>
        </div>
        <div style={{ display:"inline-block", width:28, height:28, border:`3px solid ${C.blush}`, borderTopColor:C.terra, borderRadius:"50%", animation:"spin .9s linear infinite" }}/>
        <div style={{ fontSize:12, color:"#b0a090", marginTop:14, letterSpacing:1 }}>Chargement de la liste…</div>
      </div>
    </div>
  );

  const allItems = sections.flatMap(s=>s.items).filter(i=>!i.hidden);
  // Un article dont un MODÈLE est réservé compte comme réservé : quand un article
  // a des modèles, c'est même le seul moyen de le réserver (le bouton « J'achète »
  // de l'article est masqué). Sans cela les compteurs restaient bloqués à zéro.
  const isReserved = i => !!i.reservedBy || (i.models||[]).some(m=>m.reservedBy);
  const total=allItems.length, checked=allItems.filter(i=>i.checked).length;
  const reserved=allItems.filter(isReserved).length;
  const done=allItems.filter(i=>i.checked||isReserved(i)).length;
  const pct = total?Math.round(done/total*100):0;

  const mSec  = modal ? sections.find(s=>s.id===modal.secId) : null;
  const mItem = modal?.itemId && mSec ? mSec.items.find(i=>i.id===modal.itemId) : null;

  const syncColors = { idle:"rgba(250,246,241,.4)", saving:"#e8c5a8", saved:"#7a9e87", error:"#c4836a" };
  const syncLabels = { idle:"", saving:"⟳ Sauvegarde…", saved:"✓ Synchronisé", error:"⚠ Erreur" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}body{background:#faf6f1}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#e8c5a8;border-radius:3px}
        input:focus,textarea:focus{border-color:#c4836a!important;outline:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
      `}</style>

      <div style={{ fontFamily:"'DM Sans',sans-serif",background:C.cream,minHeight:"100vh",paddingBottom:72 }}>

        {/* ── Header ── */}
        <div style={{ background:C.ink,color:C.cream,padding:"40px 24px 34px",textAlign:"center",position:"relative",overflow:"hidden" }}>
          <div style={{ position:"absolute",top:-40,left:-40,width:200,height:200,borderRadius:"50%",background:"rgba(196,131,106,.13)" }}/>
          <div style={{ position:"absolute",bottom:-60,right:-30,width:250,height:250,borderRadius:"50%",background:"rgba(122,158,135,.1)" }}/>

          <button onClick={()=>setShowSettings(true)} style={{ position:"absolute",top:16,right:16,zIndex:2,width:36,height:36,borderRadius:10,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.12)",color:"rgba(250,246,241,.6)",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center" }}>⚙️</button>

          <div style={{ position:"relative",zIndex:1 }}>
            <div style={{ fontSize:11,letterSpacing:4,textTransform:"uppercase",color:C.blush,marginBottom:10,fontWeight:600 }}>Liste de naissance · Septembre 2025 · Poitiers</div>
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:"clamp(22px,5vw,40px)",fontWeight:400,lineHeight:1.25,marginBottom:8 }}>
              Bienvenue,<br/><em style={{ color:C.blush,fontStyle:"italic" }}>petit bout du monde</em>
            </div>
            <div style={{ fontSize:13,color:"rgba(250,246,241,.45)",fontWeight:300 }}>T3 · 3ème étage · Cave au RDC · Crèche prévue</div>

            {/* Progress */}
            <div style={{ maxWidth:320,margin:"20px auto 0" }}>
              <div style={{ background:"rgba(255,255,255,.08)",height:3,borderRadius:2,overflow:"hidden" }}>
                <div style={{ height:"100%",background:C.blush,borderRadius:2,width:`${pct}%`,transition:"width .5s ease" }}/>
              </div>
              <div style={{ fontSize:12,color:"rgba(250,246,241,.4)",marginTop:8 }}>
                {reserved>0&&<span style={{ color:C.blush }}>🎁 {reserved} réservé{reserved>1?"s":""}{checked>0?" · ":""}</span>}
                {checked>0&&`${checked} reçu${checked>1?"s":""}`}
                {(reserved===0&&checked===0)&&"Aucun article réservé pour l'instant"}
              </div>
            </div>

            {/* Badges */}
            <div style={{ display:"flex",justifyContent:"center",gap:8,marginTop:12,flexWrap:"wrap" }}>
              {(isOwner||isContributor) && (
                <div style={{ display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:20,padding:"5px 14px",fontSize:12,color:syncColors[syncState] }}>
                  {syncState==="saving"&&<span style={{ animation:"spin 1s linear infinite",display:"inline-block" }}>⟳</span>}
                  {syncLabels[syncState]||""}
                </div>
              )}
              <div style={{ display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:20,padding:"5px 14px",fontSize:12,color:isOwner?C.blush:isContributor?"#a8d0b8":"rgba(250,246,241,.45)" }}>
                {isOwner?"👶 Propriétaire":isContributor?"🎁 Famille — je peux réserver":"👀 Lecture seule"}
              </div>
            </div>
          </div>
        </div>

        {/* Quota JSONbin épuisé — prioritaire : tant qu'il l'est, la clé n'y est pour rien */}
        {quotaExhausted && (
          <div style={{ background:"rgba(196,131,106,.15)",borderBottom:"1.5px solid rgba(196,131,106,.4)",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap" }}>
            <div style={{ fontSize:13,color:C.terra,lineHeight:1.6 }}>
              <strong>Quota JSONbin épuisé — ce n'est pas votre clé.</strong> Le compte a consommé ses 10 000 requêtes offertes (allouées une seule fois, non renouvelées).
              {isOwner
                ? <> Vos modifications restent sur cet appareil mais ne peuvent plus être partagées. Rachetez des requêtes sur <a href="https://jsonbin.io/pricing" target="_blank" rel="noopener noreferrer" style={{ color:C.terra,fontWeight:700 }}>jsonbin.io/pricing</a>, ou créez un nouveau compte et renseignez sa Master Key dans ⚙️.</>
                : <> Prévenez les parents : la liste ne peut plus être mise à jour pour le moment.</>}
            </div>
          </div>
        )}

        {/* Key invalid banner */}
        {keyInvalid && !quotaExhausted && (
          <div style={{ background:"rgba(196,131,106,.15)",borderBottom:"1.5px solid rgba(196,131,106,.4)",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap" }}>
            <div style={{ fontSize:13,color:C.terra,lineHeight:1.5 }}>
              {isOwner ? (
                <><strong>Clé JSONbin invalide.</strong> Allez sur <strong>jsonbin.io</strong> → API Keys, copiez votre Master Key actuelle, puis cliquez sur le bouton.</>
              ) : (
                <><strong>Impossible de sauvegarder votre réservation.</strong> Le lien que vous utilisez n'est plus valide. Demandez un nouveau lien famille aux parents.</>
              )}
            </div>
            {isOwner && (
              <button onClick={()=>setShowSettings(true)} style={{ ...btn({background:C.terra,color:"white"}),whiteSpace:"nowrap",fontSize:12,padding:"8px 16px",flexShrink:0 }}>
                Mettre à jour la clé ⚙️
              </button>
            )}
          </div>
        )}

        <div style={{ maxWidth:700,margin:"0 auto",padding:"0 18px" }}>

          {/* Contributor welcome banner */}
          {isContributor && (
            <div style={{ background:"linear-gradient(135deg,rgba(122,158,135,.1),rgba(122,158,135,.05))",border:"1.5px solid rgba(122,158,135,.25)",borderRadius:14,padding:"16px 18px",marginTop:22,display:"flex",gap:12,alignItems:"flex-start" }}>
              <span style={{ fontSize:22 }}>🎁</span>
              <div>
                <div style={{ fontSize:14,fontWeight:700,color:"#5a8a6a",marginBottom:4 }}>Bienvenue ! Vous pouvez réserver des articles</div>
                <div style={{ fontSize:13,color:"#6a7a6a",lineHeight:1.6 }}>
                  Cliquez sur <strong>"J'achète"</strong> à côté d'un article pour le réserver. Votre prénom apparaîtra et personne d'autre ne l'achètera. Pensez à cliquer sur le lien de l'article pour voir le produit exact souhaité.
                </div>
              </div>
            </div>
          )}

          {/* Share banner (owner only) */}
          {isOwner && (
            <div style={{ background:"linear-gradient(135deg,rgba(122,158,135,.1),rgba(196,131,106,.07))",border:"1.5px solid rgba(122,158,135,.2)",borderRadius:14,padding:"14px 18px",marginTop:22,display:"flex",gap:12,alignItems:"flex-start" }}>
              <span style={{ fontSize:20 }}>🔗</span>
              <div>
                <div style={{ fontSize:14,fontWeight:700,color:"#5a8a6a",marginBottom:3 }}>Partagez votre liste</div>
                <div style={{ fontSize:13,color:"#7a6a5a",lineHeight:1.5 }}>
                  Cliquez sur <strong>⚙️</strong> (en haut à droite) pour générer votre lien WhatsApp famille. Vos proches pourront réserver les articles directement.
                </div>
              </div>
            </div>
          )}

          {/* Alert crèche */}
          <div style={{ background:"rgba(196,131,106,.08)",border:"1.5px solid rgba(196,131,106,.25)",borderRadius:14,padding:"15px 18px",marginTop:16,display:"flex",gap:12,alignItems:"flex-start" }}>
            <span style={{ fontSize:22,flexShrink:0 }}>⚠️</span>
            <div><div style={{ fontSize:14,fontWeight:700,color:C.terra,marginBottom:3 }}>À faire maintenant : inscription en crèche</div>
            <div style={{ fontSize:13,color:"#7a6a5a",lineHeight:1.6 }}>Les places sont très rares à Poitiers. Inscrivez-vous dès aujourd'hui en mairie et en crèches privées.</div></div>
          </div>

          {/* Legend */}
          <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginTop:14,background:"white",borderRadius:12,padding:"13px 16px",alignItems:"center" }}>
            <span style={{ fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#9a8a7a",fontWeight:700,marginRight:4 }}>Légende</span>
            {Object.entries(TAG_META).map(([k,v])=>(
              <span key={k} style={{ fontSize:10,padding:"2px 9px",borderRadius:10,background:v.bg,color:v.color,fontWeight:700,letterSpacing:.5,textTransform:"uppercase" }}>{v.label}</span>
            ))}
            {isContributor && <span style={{ marginLeft:"auto",fontSize:11,color:"#5a8a6a",fontWeight:600 }}>🎁 = je peux réserver</span>}
            {isOwner && <span style={{ marginLeft:"auto",fontSize:11,color:"#9a8a7a" }}>＋ = noter le produit voulu</span>}
          </div>

          {/* ── Sections ── */}
          {sections.map((sec, secIdx) => (
            <div key={sec.id} style={{ marginTop:34,animation:"fadeUp .5s ease both" }}>
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:14,paddingBottom:12,borderBottom:`1px solid ${C.warm}` }}>
                {/* numéro dérivé de la position : supprimer une section ne crée plus de doublons */}
                <div style={{ width:32,height:32,borderRadius:"50%",background:sec.color,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:600,flexShrink:0 }}>{secIdx+1}</div>
                <div style={{ fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:600,color:C.ink }}>{sec.title}</div>
                <div style={{ marginLeft:"auto",fontSize:10,letterSpacing:2,textTransform:"uppercase",fontWeight:700,padding:"3px 12px",borderRadius:20,background:`${sec.color}18`,color:sec.color,whiteSpace:"nowrap" }}>{sec.label}</div>
                {isOwner && sec.label==="Personnalisé" && (
                  <button onClick={()=>deleteSection(sec.id)} title="Supprimer cette section" style={{ background:"none",border:"none",cursor:"pointer",fontSize:16,padding:"2px 4px",color:"#c0392b",opacity:0.75,flexShrink:0 }}>🗑️</button>
                )}
              </div>

              {sec.tip && sec.tip.cls==="orange" && <TipBox tip={sec.tip}/>}

              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {sec.items.filter(it=>!it.hidden).map(it=>(
                  <ItemCard
                    key={it.id} item={it} color={sec.color}
                    isOwner={isOwner} isContributor={isContributor}
                    onToggle={()=>updateItem(sec.id,it.id,{checked:!it.checked})}
                    onDelete={()=>deleteItem(sec.id,it.id)}
                    onEdit={()=>setModal({type:"edit",secId:sec.id,itemId:it.id})}
                    onReserve={()=>setModal({type:"reserve",secId:sec.id,itemId:it.id})}
                    onClearReserve={()=>updateItemNow(sec.id,it.id,{reservedBy:null})}
                    onOpenModels={()=>setModal({type:"models",secId:sec.id,itemId:it.id})}
                    onReserveModel={(modelId)=>setModal({type:"reserveModel",secId:sec.id,itemId:it.id,modelId})}
                    onClearModelReserve={(modelId)=>updateModel(sec.id,it.id,modelId,{reservedBy:null})}
                    onDeleteModel={(modelId)=>deleteModel(sec.id,it.id,modelId)}
                  />
                ))}
              </div>

              {isOwner && sec.items.filter(it=>it.hidden).length > 0 && (
                <details style={{ marginTop:8 }}>
                  <summary style={{ fontSize:12,color:"#9a8a7a",cursor:"pointer",padding:"6px 2px",userSelect:"none",listStyle:"none",display:"flex",alignItems:"center",gap:6 }}>
                    <span style={{ fontSize:13 }}>↩</span>
                    {sec.items.filter(it=>it.hidden).length} article(s) supprimé(s) — cliquer pour restaurer
                  </summary>
                  <div style={{ marginTop:8,display:"flex",flexDirection:"column",gap:5 }}>
                    {sec.items.filter(it=>it.hidden).map(it=>(
                      <div key={it.id} style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 13px",background:"white",borderRadius:10,border:"1.5px dashed #e8ddd0",opacity:.75,flexWrap:"wrap" }}>
                        <div style={{ flex:1,minWidth:120,fontSize:13,color:"#9a8a7a",textDecoration:"line-through" }}>{it.name}</div>
                        <button onClick={()=>restoreItem(sec.id,it.id)} style={{ ...btn({background:"rgba(122,158,135,.1)",color:"#5a8a6a",border:"1.5px solid rgba(122,158,135,.3)"}),padding:"5px 14px",fontSize:12 }}>
                          ↩ Restaurer
                        </button>
                        {it.custom && (
                          <button onClick={()=>{ if(window.confirm(`Supprimer définitivement "${it.name}" ? Cette action est irréversible.`)) purgeItem(sec.id,it.id); }}
                            title="Supprimer définitivement" aria-label={`Supprimer définitivement « ${it.name} »`}
                            style={{ ...btn({background:"rgba(196,131,106,.08)",color:C.terra,border:"1.5px solid rgba(196,131,106,.3)"}),padding:"5px 12px",fontSize:12 }}>
                            🗑️ Définitivement
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
              {isOwner && (
                <button onClick={()=>setModal({type:"addItem",secId:sec.id})}
                  style={{ display:"flex",alignItems:"center",gap:8,marginTop:10,padding:"9px 14px",background:"transparent",border:`1.5px dashed ${sec.color}55`,borderRadius:10,color:sec.color,fontSize:13,fontWeight:600,cursor:"pointer",width:"100%",fontFamily:"'DM Sans',sans-serif" }}>
                  <span style={{ fontSize:18 }}>＋</span> Ajouter un article dans cette section
                </button>
              )}

              {sec.tip && sec.tip.cls==="green" && <div style={{marginTop:12}}><TipBox tip={sec.tip}/></div>}
            </div>
          ))}

          {isOwner && (
            <button onClick={()=>setModal({type:"addSection"})}
              style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginTop:26,padding:"14px 20px",background:"white",border:"2px dashed #d0c0b0",borderRadius:14,color:"#9a8a7a",fontSize:14,fontWeight:600,cursor:"pointer",width:"100%",fontFamily:"'DM Sans',sans-serif" }}>
              <span style={{ fontSize:22 }}>＋</span> Créer une nouvelle catégorie
            </button>
          )}

          {/* Summary */}
          <div style={{ background:C.ink,color:C.cream,borderRadius:18,padding:"28px 24px",marginTop:36,textAlign:"center" }}>
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:400,marginBottom:6 }}>Votre liste de naissance</div>
            <div style={{ fontSize:13,color:"rgba(250,246,241,.4)",fontWeight:300 }}>Bébé arrive en septembre — préparez sereinement !</div>
            <div style={{ display:"flex",justifyContent:"center",gap:"clamp(14px,4vw,32px)",marginTop:24,flexWrap:"wrap" }}>
              {[{n:total,l:"articles"},{n:reserved,l:"réservés"},{n:checked,l:"reçus"},{n:total-done,l:"disponibles"}].map(({n,l})=>(
                <div key={l} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:"'Playfair Display',serif",fontSize:30,color:C.blush,lineHeight:1 }}>{n}</div>
                  <div style={{ fontSize:10,color:"rgba(250,246,241,.35)",marginTop:4,letterSpacing:1,textTransform:"uppercase" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {modal?.type==="addItem"&&mSec&&<AddItemModal sectionId={modal.secId} sectionTitle={mSec.title} onAdd={(n,no,u,tg)=>addItem(modal.secId,n,no,u,tg)} onClose={()=>setModal(null)}/>}
      {modal?.type==="edit"&&mItem&&<EditItemModal item={mItem} onSave={(n,no,tg)=>{updateItem(modal.secId,modal.itemId,{name:n,note:no,tags:tg});setModal(null);showToast("✓ Modifié");}} onClose={()=>setModal(null)}/>}
      {modal?.type==="addSection"&&<AddSectionModal onAdd={addSection} onClose={()=>setModal(null)}/>}
      {modal?.type==="reserve"&&mItem&&<ReserveModal item={mItem} color={mSec.color} onSave={r=>{updateItemNow(modal.secId,modal.itemId,{reservedBy:r});setModal(null);showToast("🎁 Acheté ! Merci !");}} onClose={()=>setModal(null)}/>}
      {modal?.type==="models"&&mItem&&<ModelsModal key={mItem.id} item={mItem} color={mSec.color} onSave={models=>{updateItemNow(modal.secId,modal.itemId,{models});setModal(null);showToast("✓ Modèles enregistrés");}} onClose={()=>setModal(null)}/>}
      {modal?.type==="reserveModel"&&mItem&&(()=>{ const m=(mItem.models||[]).find(x=>x.id===modal.modelId); return m?<ReserveModal item={{...mItem,name:m.name,chosen:m.url?[{brand:"",url:m.url,price:"",notes:""}]:null}} color={mSec.color} onSave={r=>{updateModel(modal.secId,modal.itemId,modal.modelId,{reservedBy:r});setModal(null);showToast("🎁 Acheté ! Merci !");}} onClose={()=>setModal(null)}/>:null; })()}
      {showSettings&&<SettingsModal cfg={cfg} onClose={()=>setShowSettings(false)} onReset={()=>{
        // Le cache de CETTE liste doit partir avec la config : sinon il « gagnait »
        // ensuite sur la liste suivante et était même repoussé dans son bin.
        clearTimeout(saveTimer.current); pendingRef.current=null; dirtyRef.current=false;
        clearLocalCache(cfg.binId);
        localStorage.removeItem(LOCAL_CFG);
        document.cookie=`${LOCAL_CFG}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
        setSections([]); setCfg(null); setShowSettings(false);
      }} onUpdateKey={handleUpdateKey}/>}

      <Toast msg={toast.msg} type={toast.type}/>
    </>
  );
}
