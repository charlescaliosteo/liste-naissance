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
    document.cookie = `${LOCAL_CFG}=${encodeURIComponent(JSON.stringify(c))};expires=${expires};path=/;SameSite=Lax`;
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
        chosen:     itemsMap[di.id]?.chosen     || null,
        reservedBy: itemsMap[di.id]?.reservedBy || null,
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
      items: s.items.filter(i => !i.custom).map(i => ({ id:i.id, checked:i.checked, chosen:i.chosen, reservedBy:i.reservedBy||null })),
      customItems: s.items.filter(i => i.custom).map(i => ({ id:i.id, name:i.name, note:i.note, tags:i.tags||[], checked:i.checked, chosen:i.chosen, reservedBy:i.reservedBy||null, custom:true })),
    })),
    customSections: sections.filter(s => !defaultIds.has(s.id)).map(s => ({
      id:s.id, title:s.title, label:s.label||"Personnalisé", priority:s.priority,
      items: s.items.map(i => ({ id:i.id, name:i.name, note:i.note||"", tags:i.tags||[], checked:i.checked, chosen:i.chosen, reservedBy:i.reservedBy||null, custom:true })),
    })),
  };
}

// ─── JSONbin API calls ────────────────────────────────────────────────────────
async function apiCreate(apiKey, data) {
  const res = await fetch(JSONBIN_API, {
    method:"POST",
    headers:{ "Content-Type":"application/json", "X-Master-Key":apiKey, "X-Bin-Name":"liste-naissance-2025", "X-Bin-Private":"false" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(t); }
  const j = await res.json();
  return j.metadata.id;
}

async function apiRead(binId, apiKey) {
  const headers = { "X-Bin-Meta":"false" };
  if (apiKey) headers["X-Master-Key"] = apiKey;
  const res = await fetch(`${JSONBIN_API}/${binId}/latest`, { headers });
  if (!res.ok) throw new Error(`Lecture impossible (${res.status})`);
  return res.json();
}

async function apiUpdate(binId, apiKey, data) {
  const res = await fetch(`${JSONBIN_API}/${binId}`, {
    method:"PUT",
    headers:{ "Content-Type":"application/json", "X-Master-Key":apiKey },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(t); }
  return res.json();
}

// ─── UI primitives ────────────────────────────────────────────────────────────
const btn = (extra={}) => ({ borderRadius:11, padding:"11px 16px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", border:"none", ...extra });

function Overlay({ onClose, children }) {
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(20,12,4,.7)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)" }}>
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
  return <div style={{ position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:colors[type]||C.ink,color:C.cream,padding:"10px 22px",borderRadius:30,fontSize:13,fontWeight:500,zIndex:9999,boxShadow:"0 8px 32px rgba(0,0,0,.2)",pointerEvents:"none",whiteSpace:"nowrap" }}>{msg}</div>;
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
    } catch(e) { setErr("Erreur : " + (e.message||"Clé invalide ou problème réseau.")); }
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
    } catch(e) { setErr("BIN ID ou clé incorrects. Vérifiez vos informations."); }
    setLoading(false);
  }

  async function handleReader() {
    if (!binId.trim()) return setErr("Veuillez entrer le BIN ID partagé.");
    setLoading(true); setErr("");
    try {
      await apiRead(binId.trim());
      const cfg = { binId: binId.trim(), mode:"reader" };
      saveCfg(cfg); onDone(cfg);
    } catch(e) { setErr("BIN ID introuvable. Vérifiez l'identifiant."); }
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
              1. Allez sur <a href="https://jsonbin.io" target="_blank" rel="noopener" style={{ color:C.terra, fontWeight:600 }}>jsonbin.io</a> → créez un compte gratuit<br/>
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
function ChosenModal({ item, color, onSave, onClose }) {
  const [f, setF] = useState(item.chosen || { brand:"", url:"", price:"", notes:"" });
  const up = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <Overlay onClose={onClose}>
      <div style={{ fontSize:10,letterSpacing:3,textTransform:"uppercase",color,marginBottom:6,fontWeight:700 }}>Article choisi</div>
      <div style={{ fontFamily:"'Playfair Display',serif",fontSize:19,color:C.ink,fontWeight:600,marginBottom:20,lineHeight:1.3 }}>{item.name}</div>
      <FL>Marque / Modèle</FL><FInput value={f.brand} onChange={v=>up("brand",v)} placeholder="Ex : Babyzen YOYO 6+"/>
      <FL>Lien d'achat</FL><FInput value={f.url} onChange={v=>up("url",v)} placeholder="https://..."/>
      <FL>Prix indicatif</FL><FInput value={f.price} onChange={v=>up("price",v)} placeholder="Ex : 350 €"/>
      <FL>Notes</FL><FTextarea value={f.notes} onChange={v=>up("notes",v)} placeholder="Pourquoi ce choix, avis, où acheter..."/>
      <div style={{ display:"flex",gap:10,marginTop:6 }}>
        <button onClick={()=>onSave(f.brand||f.url||f.price||f.notes?f:null)} style={{ ...btn({background:C.ink,color:C.cream}), flex:1 }}>Enregistrer</button>
        {item.chosen && <button onClick={()=>onSave(null)} style={btn({background:"rgba(196,131,106,.12)",color:C.terra,border:"1.5px solid rgba(196,131,106,.3)"})}>Effacer</button>}
        <button onClick={onClose} style={btn({background:"white",color:"#7a6a5a",border:"1.5px solid #e8ddd0"})}>Annuler</button>
      </div>
    </Overlay>
  );
}

function AddItemModal({ sectionTitle, onAdd, onClose }) {
  const [name,setName]=useState(""); const [note,setNote]=useState(""); const [url,setUrl]=useState("");
  return (
    <Overlay onClose={onClose}>
      <div style={{ fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#8a7a9a",marginBottom:6,fontWeight:700 }}>Ajouter un article</div>
      <div style={{ fontFamily:"'Playfair Display',serif",fontSize:19,color:C.ink,fontWeight:600,marginBottom:20 }}>{sectionTitle}</div>
      <FL>Nom *</FL><FInput value={name} onChange={setName} placeholder="Ex : Anneau de dentition"/>
      <FL>Note / description</FL><FTextarea value={note} onChange={setNote} placeholder="Quantité, pourquoi, marque..." rows={2}/>
      <FL>Lien produit (optionnel)</FL><FInput value={url} onChange={setUrl} placeholder="https://..."/>
      <div style={{ display:"flex",gap:10,marginTop:6 }}>
        <button onClick={()=>{ if(name.trim()) onAdd(name.trim(),note.trim(),url.trim()); }} style={{ ...btn({background:C.ink,color:C.cream,opacity:name.trim()?1:.45}), flex:1 }}>Ajouter</button>
        <button onClick={onClose} style={btn({background:"white",color:"#7a6a5a",border:"1.5px solid #e8ddd0"})}>Annuler</button>
      </div>
    </Overlay>
  );
}

function EditItemModal({ item, onSave, onClose }) {
  const [name,setName]=useState(item.name); const [note,setNote]=useState(item.note||"");
  return (
    <Overlay onClose={onClose}>
      <div style={{ fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#8a7a9a",marginBottom:6,fontWeight:700 }}>Modifier</div>
      <FL>Nom</FL><FInput value={name} onChange={setName} placeholder="Nom de l'article"/>
      <FL>Note</FL><FTextarea value={note} onChange={setNote} placeholder="Description..." rows={2}/>
      <div style={{ display:"flex",gap:10,marginTop:6 }}>
        <button onClick={()=>onSave(name.trim(),note.trim())} style={{ ...btn({background:C.ink,color:C.cream}), flex:1 }}>Enregistrer</button>
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
      {item.chosen?.url && safeUrl(item.chosen.url) && (
        <a href={safeUrl(item.chosen.url)} target="_blank" rel="noopener noreferrer" style={{ display:"inline-block",fontSize:13,fontWeight:600,color,textDecoration:"none",marginBottom:16 }}>🔗 Voir l'article suggéré →</a>
      )}
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

// ─── ItemCard ─────────────────────────────────────────────────────────────────
function ItemCard({ item, color, isOwner, isContributor, onToggle, onOpenChosen, onDelete, onEdit, onReserve, onClearReserve }) {
  const has = item.chosen && (item.chosen.brand||item.chosen.url||item.chosen.price||item.chosen.notes);
  const res = item.reservedBy;
  const canReserve = isContributor && !res && !item.checked;
  const borderColor = res ? "rgba(122,158,135,.35)" : has ? color+"55" : "transparent";
  const bgColor = item.checked ? "#f0e8dc" : res ? "rgba(122,158,135,.04)" : "white";

  return (
    <div style={{ background:bgColor,borderRadius:14,border:`1.5px solid ${borderColor}`,boxShadow:res?"0 2px 12px rgba(122,158,135,.12)":has?`0 2px 14px ${color}18`:"none",overflow:"hidden",opacity:item.checked?.6:1,transition:"all .2s ease" }}>
      <div style={{ display:"flex",alignItems:"flex-start",gap:12,padding:"13px 13px 11px" }}>
        <div
          onClick={isOwner?onToggle:undefined}
          style={{ width:22,height:22,borderRadius:7,flexShrink:0,marginTop:1,border:`2px solid ${item.checked?"#7a9e87":"#e8c5a8"}`,background:item.checked?"#7a9e87":"white",display:"flex",alignItems:"center",justifyContent:"center",cursor:isOwner?"pointer":"default",transition:"all .2s" }}
        >
          {item.checked&&<svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:15,fontWeight:600,color:item.checked?"#9a8a7a":C.ink,textDecoration:item.checked?"line-through":"none",marginBottom:2,lineHeight:1.3 }}>
            {item.name}{(item.tags||[]).map(t=><Tag key={t} type={t}/>)}{item.custom&&<Tag type="custom"/>}
          </div>
          {item.note&&<div style={{ fontSize:12,color:"#9a8a7a",fontWeight:300,lineHeight:1.5 }}>{item.note}</div>}
        </div>
        <div style={{ display:"flex",gap:5,flexShrink:0,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end" }}>
          {isOwner && item.custom && <button onClick={onEdit} style={{ width:28,height:28,borderRadius:7,border:"1.5px solid #e8ddd0",background:"transparent",color:"#9a8a7a",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center" }}>✏️</button>}
          {isOwner && <button onClick={onOpenChosen} style={{ width:28,height:28,borderRadius:7,border:`1.5px solid ${has?color:"#e8ddd0"}`,background:has?`${color}15`:"transparent",color:has?color:"#b0a090",cursor:"pointer",fontSize:has?13:20,display:"flex",alignItems:"center",justifyContent:"center" }}>{has?"✏️":"＋"}</button>}
          {isOwner && item.custom && <button onClick={onDelete} style={{ width:28,height:28,borderRadius:7,border:"1.5px solid rgba(196,131,106,.25)",background:"rgba(196,131,106,.06)",color:C.terra,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center" }}>🗑️</button>}
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
          {canReserve && (
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
              🎁 J'achète
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

      {/* Chosen / product link */}
      {has && (
        <div style={{ margin:"0 13px 11px",borderRadius:10,padding:"10px 12px",borderLeft:`3px solid ${color}`,background:`${color}09` }}>
          {item.chosen.brand&&<div style={{ fontSize:13,fontWeight:600,color:C.ink,marginBottom:2 }}>{item.chosen.brand}{item.chosen.price&&<span style={{ marginLeft:8,fontSize:12,fontWeight:700,color }}>{item.chosen.price}</span>}</div>}
          {item.chosen.notes&&<div style={{ fontSize:12,color:"#7a6a5a",lineHeight:1.4,marginBottom:item.chosen.url?5:0 }}>{item.chosen.notes}</div>}
          {safeUrl(item.chosen.url)&&<a href={safeUrl(item.chosen.url)} target="_blank" rel="noopener noreferrer" style={{ fontSize:12,fontWeight:600,color,textDecoration:"none" }}>🔗 Voir l'article →</a>}
        </div>
      )}
    </div>
  );
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
function SettingsModal({ cfg, onClose, onReset }) {
  const [familyKey, setFamilyKey] = useState("");
  const [showFamilyKey, setShowFamilyKey] = useState(false);
  const [copiedReader, setCopiedReader] = useState(false);
  const [copiedFamily, setCopiedFamily] = useState(false);
  const [copiedCoparent, setCopiedCoparent] = useState(false);

  const base = window.location.origin + window.location.pathname;
  const readerUrl    = `${base}?binId=${cfg.binId}`;
  const familyUrl    = familyKey.trim() ? `${base}?binId=${cfg.binId}&ck=${familyKey.trim()}` : "";
  const coparentUrl  = cfg.apiKey ? `${base}?binId=${cfg.binId}&ck=${cfg.apiKey}&mode=owner` : "";

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
      <div style={{ background:C.warm,borderRadius:12,padding:"12px 16px",marginBottom:16 }}>
        <div style={{ fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#9a8a7a",marginBottom:4,fontWeight:700 }}>Votre rôle</div>
        <div style={{ fontSize:14,color:C.ink }}>
          {cfg.mode==="owner"?"👶 Propriétaire (gestion complète)":cfg.mode==="contributor"?"🎁 Famille (peut réserver)":"👀 Lecteur (lecture seule)"}
        </div>
      </div>

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
    if (bid && ck && m === "owner") { const c = { binId:bid, apiKey:ck, mode:"owner" }; saveCfg(c); return c; }
    if (bid && ck)  return { binId:bid, apiKey:ck, mode:"contributor" };
    if (bid)        return { binId:bid, mode:"reader" };
    return loadCfg();
  });
  const [sections, setSections] = useState([]);
  const [modal, setModal]       = useState(null);
  const [toast, setToast]       = useState({ msg:"", type:"ok" });
  const [syncState, setSyncState] = useState("idle");
  const [showSettings, setShowSettings] = useState(false);
  const saveTimer = useRef(null);
  const isOwner       = cfg?.mode === "owner";
  const isContributor = cfg?.mode === "contributor";

  function showToast(msg, type="ok", dur=2200) {
    setToast({ msg, type });
    setTimeout(()=>setToast({msg:"",type:"ok"}), dur);
  }

  // ── Load initial data ──
  useEffect(() => {
    if (!cfg) return;
    apiRead(cfg.binId, cfg.apiKey)
      .then(data => { setSections(mergeData(data)); setSyncState("saved"); })
      .catch(() => {
        setSections(mergeData(buildInitialData()));
        showToast("⚠ Chargement hors-ligne", "err");
      });
  }, [cfg?.binId]);

  // ── Polling toutes les 15s (lecteur / contributeur) ──
  useEffect(() => {
    if (!cfg || isOwner) return;
    const t = setInterval(() => {
      apiRead(cfg.binId, cfg.apiKey).then(data => setSections(mergeData(data))).catch(()=>{});
    }, 15000);
    return () => clearInterval(t);
  }, [cfg?.binId, isOwner]);

  // ── Save helpers ──
  const doSave = useCallback(async (nextSections) => {
    if (cfg?.mode !== "owner" && cfg?.mode !== "contributor") return;
    setSyncState("saving");
    try {
      await apiUpdate(cfg.binId, cfg.apiKey, sectionsToRemote(nextSections));
      setSyncState("saved");
      showToast("✓ Synchronisé", "sync");
    } catch(e) {
      setSyncState("error");
      showToast("⚠ " + (e.message||"Erreur de sauvegarde"), "err", 6000);
    }
  }, [cfg]);

  const scheduleSave = useCallback((nextSections) => {
    if (cfg?.mode !== "owner" && cfg?.mode !== "contributor") return;
    setSyncState("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(nextSections), 900);
  }, [cfg, doSave]);

  function update(fn) {
    setSections(prev => { const next = fn(prev); scheduleSave(next); return next; });
  }
  function updateItem(secId, itemId, patch) {
    update(secs => secs.map(s => s.id!==secId?s:{ ...s, items:s.items.map(i=>i.id!==itemId?i:{ ...i,...patch }) }));
  }
  function updateItemNow(secId, itemId, patch) {
    setSections(prev => {
      const next = prev.map(s => s.id!==secId?s:{ ...s, items:s.items.map(i=>i.id!==itemId?i:{ ...i,...patch }) });
      doSave(next);
      return next;
    });
  }
  function addItem(secId, name, note, url) {
    const chosen = url ? { brand:"", url, price:"", notes:"" } : null;
    const ni = { id:`c_${uid()}`,name,note,tags:[],checked:false,chosen,reservedBy:null,custom:true };
    update(secs => secs.map(s => s.id!==secId?s:{ ...s,items:[...s.items,ni] }));
    setModal(null); showToast("✓ Article ajouté");
  }
  function deleteItem(secId, itemId) {
    update(secs => secs.map(s => s.id!==secId?s:{ ...s,items:s.items.filter(i=>i.id!==itemId) }));
    showToast("Article supprimé");
  }
  function addSection(title) {
    const ns = { id:`sec_${uid()}`,priority:sections.length+1,label:"Personnalisé",color:PRIO_COLORS[6],title,tip:null,items:[],defaultItems:[] };
    update(secs => [...secs,ns]);
    setModal(null); showToast("✓ Section créée");
  }

  if (!cfg) return <SetupScreen onDone={c => { saveCfg(c); setCfg(c); }}/>;

  const allItems = sections.flatMap(s=>s.items);
  const total=allItems.length, checked=allItems.filter(i=>i.checked).length;
  const reserved=allItems.filter(i=>i.reservedBy).length;
  const pct = total?Math.round((checked+reserved)/total*100):0;

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
          {sections.map(sec => (
            <div key={sec.id} style={{ marginTop:34,animation:"fadeUp .5s ease both" }}>
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:14,paddingBottom:12,borderBottom:`1px solid ${C.warm}` }}>
                <div style={{ width:32,height:32,borderRadius:"50%",background:sec.color,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:600,flexShrink:0 }}>{sec.priority}</div>
                <div style={{ fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:600,color:C.ink }}>{sec.title}</div>
                <div style={{ marginLeft:"auto",fontSize:10,letterSpacing:2,textTransform:"uppercase",fontWeight:700,padding:"3px 12px",borderRadius:20,background:`${sec.color}18`,color:sec.color,whiteSpace:"nowrap" }}>{sec.label}</div>
              </div>

              {sec.tip && sec.tip.cls==="orange" && <TipBox tip={sec.tip}/>}

              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {sec.items.map(it=>(
                  <ItemCard
                    key={it.id} item={it} color={sec.color}
                    isOwner={isOwner} isContributor={isContributor}
                    onToggle={()=>updateItem(sec.id,it.id,{checked:!it.checked})}
                    onOpenChosen={()=>setModal({type:"chosen",secId:sec.id,itemId:it.id})}
                    onDelete={()=>deleteItem(sec.id,it.id)}
                    onEdit={()=>setModal({type:"edit",secId:sec.id,itemId:it.id})}
                    onReserve={()=>setModal({type:"reserve",secId:sec.id,itemId:it.id})}
                    onClearReserve={()=>updateItemNow(sec.id,it.id,{reservedBy:null})}
                  />
                ))}
              </div>

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
              {[{n:total,l:"articles"},{n:reserved,l:"réservés"},{n:checked,l:"reçus"},{n:total-reserved-checked,l:"disponibles"}].map(({n,l})=>(
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
      {modal?.type==="chosen"&&mItem&&<ChosenModal item={mItem} color={mSec.color} onSave={c=>{updateItem(modal.secId,modal.itemId,{chosen:c});setModal(null);}} onClose={()=>setModal(null)}/>}
      {modal?.type==="addItem"&&mSec&&<AddItemModal sectionTitle={mSec.title} onAdd={(n,no,u)=>addItem(modal.secId,n,no,u)} onClose={()=>setModal(null)}/>}
      {modal?.type==="edit"&&mItem&&<EditItemModal item={mItem} onSave={(n,no)=>{updateItem(modal.secId,modal.itemId,{name:n,note:no});setModal(null);showToast("✓ Modifié");}} onClose={()=>setModal(null)}/>}
      {modal?.type==="addSection"&&<AddSectionModal onAdd={addSection} onClose={()=>setModal(null)}/>}
      {modal?.type==="reserve"&&mItem&&<ReserveModal item={mItem} color={mSec.color} onSave={r=>{updateItemNow(modal.secId,modal.itemId,{reservedBy:r});setModal(null);showToast("🎁 Acheté ! Merci !");}} onClose={()=>setModal(null)}/>}
      {showSettings&&<SettingsModal cfg={cfg} onClose={()=>setShowSettings(false)} onReset={()=>{localStorage.removeItem(LOCAL_CFG);setCfg(null);setShowSettings(false);}}/>}

      <Toast msg={toast.msg} type={toast.type}/>
    </>
  );
}
