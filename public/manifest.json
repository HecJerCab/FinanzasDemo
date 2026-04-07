import { useState, useEffect } from "react";

const CATEGORIAS_GASTO = ["Alimentación","Transporte","Servicios","Salud","Educación","Entretenimiento","Ropa","Hogar","Otros"];
const CATEGORIAS_INGRESO = ["Sueldo","Freelance","Inversión","Regalo","Otro"];
const NOTION_PROXY = "https://notion-proxy.vercel.app/api/notion"; // reemplazado por proxy propio

const fmt = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);
const fmtShort = (n) => {
  if (!n) return "$0";
  if (Math.abs(n) >= 1000000) return `$${(n/1000000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `$${(n/1000).toFixed(0)}K`;
  return fmt(n);
};
const today = () => new Date().toISOString().split("T")[0];
const thisMonth = () => new Date().toISOString().slice(0,7);

const TABS = ["Inicio","Ingresos","Gastos","Ahorro","Proyectos","Inversiones","Reportes","Config"];
const ICONS = { Inicio:"◉", Ingresos:"↑", Gastos:"↓", Ahorro:"♦", Proyectos:"★", Inversiones:"▲", Reportes:"≡", Config:"⚙" };

const s = {
  page: { maxWidth: 520, margin: "0 auto", paddingBottom: 80, minHeight: "100vh", background: "#fff" },
  header: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px", borderBottom:"1px solid #eee" },
  grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 },
  card: { background:"#f8f8f8", borderRadius:10, padding:"12px" },
  cardBig: { background:"#fff", border:"1px solid #eee", borderRadius:12, padding:"16px", marginBottom:10 },
  label: { fontSize:11, color:"#888", margin:"0 0 4px" },
  value: { fontSize:20, fontWeight:500, margin:0 },
  bar: { background:"#f0f0f0", borderRadius:4, height:6, margin:"3px 0 8px" },
  nav: { position:"fixed", bottom:0, left:0, right:0, background:"#fff", borderTop:"1px solid #eee", display:"flex", justifyContent:"space-around", padding:"6px 0", zIndex:100 },
  navBtn: (active) => ({ background:"none", border:"none", padding:"4px 2px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, color: active?"#111":"#aaa", fontSize:9, minWidth:36, borderRadius:0 }),
  input: { width:"100%", marginBottom:10, fontSize:15, padding:"10px 12px", border:"1px solid #ddd", borderRadius:8, background:"#fff", display:"block" },
  btn: { width:"100%", padding:"12px", borderRadius:10, border:"1px solid #ddd", background:"#fff", fontSize:15, fontWeight:500, cursor:"pointer", marginBottom:8 },
  btnPrimary: { width:"100%", padding:"12px", borderRadius:10, border:"none", background:"#111", color:"#fff", fontSize:15, fontWeight:500, cursor:"pointer", marginBottom:8 },
  tag: (color) => ({ fontSize:11, background:color+"22", color:color, padding:"2px 8px", borderRadius:4, display:"inline-block" }),
  row: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #f0f0f0" },
  msgSuccess: { background:"#e6f7ec", color:"#1a7a3c", padding:"8px 16px", fontSize:13, textAlign:"center" },
  msgError: { background:"#fde8e8", color:"#c0392b", padding:"8px 16px", fontSize:13, textAlign:"center" },
};

async function notionCall(token, method, path, body) {
  // Llamada directa a Notion via proxy CORS
  const res = await fetch(`https://corsproxy.io/?https://api.notion.com/v1/${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export default function App() {
  const [tab, setTab] = useState("Inicio");
  const [token, setToken] = useState(() => localStorage.getItem("nf_token") || "");
  const [dbIds, setDbIds] = useState(() => { try { return JSON.parse(localStorage.getItem("nf_dbs") || "{}"); } catch { return {}; } });
  const [records, setRecords] = useState({ ingresos:[], gastos:[], ahorros:[], proyectos:[], inversiones:[] });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text:"", type:"" });
  const [setupStep, setSetupStep] = useState(() => localStorage.getItem("nf_token") && Object.keys(JSON.parse(localStorage.getItem("nf_dbs")||"{}")).length > 0 ? "ready" : "token");
  const [filterMonth, setFilterMonth] = useState(thisMonth());
  const [userName, setUserName] = useState(() => localStorage.getItem("nf_user") || "");

  const showMsg = (text, type="success") => { setMsg({text,type}); setTimeout(()=>setMsg({text:"",type:""}),3000); };

  const createDatabases = async () => {
    setLoading(true);
    showMsg("Buscando workspace...", "success");
    try {
      const search = await notionCall(token, "POST", "search", { filter:{value:"page",property:"object"}, page_size:1 });
      const parentId = search?.results?.[0]?.id;
      if (!parentId) { showMsg("No se encontró ninguna página en Notion. Creá una página primero.", "error"); setLoading(false); return; }

      const dbs = {};
      const dbDefs = [
        { key:"ingresos", title:"💰 Ingresos", props:{ Título:{title:{}}, Monto:{number:{format:"number"}}, Categoría:{select:{options:CATEGORIAS_INGRESO.map(n=>({name:n}))}}, Fecha:{date:{}}, Persona:{rich_text:{}}, Nota:{rich_text:{}} }},
        { key:"gastos", title:"💸 Gastos", props:{ Título:{title:{}}, Monto:{number:{format:"number"}}, Categoría:{select:{options:CATEGORIAS_GASTO.map(n=>({name:n}))}}, Fecha:{date:{}}, Persona:{rich_text:{}}, Nota:{rich_text:{}} }},
        { key:"ahorros", title:"🏦 Ahorro", props:{ Título:{title:{}}, Monto:{number:{}}, Fecha:{date:{}}, Persona:{rich_text:{}}, Nota:{rich_text:{}} }},
        { key:"proyectos", title:"🎯 Proyectos", props:{ Título:{title:{}}, Meta:{number:{}}, Acumulado:{number:{}}, Tipo:{select:{options:[{name:"Individual"},{name:"Grupal"}]}}, FechaObjetivo:{date:{}}, Nota:{rich_text:{}} }},
        { key:"inversiones", title:"📈 Inversiones", props:{ Título:{title:{}}, Monto:{number:{}}, Tipo:{select:{options:["Plazo fijo","Acciones","Cripto","FCI","Dólares","Inmueble","Otro"].map(n=>({name:n}))}}, Fecha:{date:{}}, Proyectado:{number:{}}, Persona:{rich_text:{}}, Nota:{rich_text:{}} }}
      ];
      for (const db of dbDefs) {
        showMsg(`Creando: ${db.title}...`, "success");
        const res = await notionCall(token, "POST", "databases", { parent:{page_id:parentId}, title:[{type:"text",text:{content:db.title}}], properties:db.props });
        if (res?.id) dbs[db.key] = res.id;
      }
      localStorage.setItem("nf_dbs", JSON.stringify(dbs));
      localStorage.setItem("nf_token", token);
      setDbIds(dbs);
      setSetupStep("ready");
      showMsg("¡Listo! Bases creadas en Notion ✓");
      loadAll(dbs);
    } catch(e) { showMsg("Error al conectar. Verificá el token.", "error"); }
    setLoading(false);
  };

  const loadAll = async (dbs = dbIds) => {
    if (!token || !dbs?.ingresos) return;
    setLoading(true);
    const keys = ["ingresos","gastos","ahorros","proyectos","inversiones"];
    const results = {};
    for (const k of keys) {
      if (!dbs[k]) continue;
      const r = await notionCall(token, "POST", `databases/${dbs[k]}/query`, { page_size:200 });
      results[k] = (r?.results||[]).map(p => {
        const pr = p.properties;
        return { id:p.id, titulo:pr.Título?.title?.[0]?.plain_text||"", monto:pr.Monto?.number||0, meta:pr.Meta?.number||0, acumulado:pr.Acumulado?.number||0, proyectado:pr.Proyectado?.number||0, categoria:pr.Categoría?.select?.name||pr.Tipo?.select?.name||"", fecha:pr.Fecha?.date?.start||pr.FechaObjetivo?.date?.start||"", persona:pr.Persona?.rich_text?.[0]?.plain_text||"", tipo:pr.Tipo?.select?.name||"", nota:pr.Nota?.rich_text?.[0]?.plain_text||"" };
      });
    }
    setRecords(r => ({...r, ...results}));
    setLoading(false);
  };

  useEffect(() => { if (setupStep==="ready") loadAll(); }, [setupStep]);

  const addRecord = async (type, data) => {
    if (!dbIds[type]) return;
    setLoading(true);
    const n = (v) => v ? +v : 0;
    const t = (v) => [{ type:"text", text:{ content: v||"" } }];
    const propMap = {
      ingresos: { Título:{title:t(data.titulo)}, Monto:{number:n(data.monto)}, Categoría:{select:{name:data.categoria||"Otro"}}, Fecha:{date:{start:data.fecha||today()}}, Persona:{rich_text:t(data.persona)}, Nota:{rich_text:t(data.nota)} },
      gastos: { Título:{title:t(data.titulo)}, Monto:{number:n(data.monto)}, Categoría:{select:{name:data.categoria||"Otros"}}, Fecha:{date:{start:data.fecha||today()}}, Persona:{rich_text:t(data.persona)}, Nota:{rich_text:t(data.nota)} },
      ahorros: { Título:{title:t(data.titulo||"Ahorro")}, Monto:{number:n(data.monto)}, Fecha:{date:{start:data.fecha||today()}}, Persona:{rich_text:t(data.persona)}, Nota:{rich_text:t(data.nota)} },
      proyectos: { Título:{title:t(data.titulo||"Proyecto")}, Meta:{number:n(data.meta)}, Acumulado:{number:n(data.acumulado)}, Tipo:{select:{name:data.tipo||"Grupal"}}, FechaObjetivo:{date:{start:data.fecha||today()}}, Nota:{rich_text:t(data.nota)} },
      inversiones: { Título:{title:t(data.titulo)}, Monto:{number:n(data.monto)}, Tipo:{select:{name:data.tipo||"Otro"}}, Fecha:{date:{start:data.fecha||today()}}, Proyectado:{number:n(data.proyectado)}, Persona:{rich_text:t(data.persona)}, Nota:{rich_text:t(data.nota)} }
    };
    const res = await notionCall(token, "POST", "pages", { parent:{database_id:dbIds[type]}, properties:propMap[type] });
    if (res?.id) { showMsg("Guardado en Notion ✓"); loadAll(); }
    else showMsg("Error al guardar", "error");
    setLoading(false);
  };

  const filtered = (arr) => arr.filter(r => r.fecha?.startsWith(filterMonth));
  const totalIngresos = filtered(records.ingresos).reduce((s,r)=>s+r.monto,0);
  const totalGastos = filtered(records.gastos).reduce((s,r)=>s+r.monto,0);
  const totalAhorros = filtered(records.ahorros).reduce((s,r)=>s+r.monto,0);
  const balance = totalIngresos - totalGastos - totalAhorros;

  const gastosPorCat = CATEGORIAS_GASTO.map(c => ({ cat:c, total:filtered(records.gastos).filter(r=>r.categoria===c).reduce((s,r)=>s+r.monto,0) })).filter(x=>x.total>0).sort((a,b)=>b.total-a.total);
  const barMax = gastosPorCat[0]?.total || 1;

  function AddForm({ type, fields }) {
    const [d, setD] = useState({ fecha:today(), persona:userName });
    const upd = (k,v) => setD(p=>({...p,[k]:v}));
    return (
      <div style={s.cardBig}>
        <p style={{fontWeight:500,fontSize:14,marginBottom:12}}>Nuevo registro</p>
        {fields.map(f => (
          <div key={f.id} style={{marginBottom:10}}>
            <label style={{display:"block",fontSize:12,color:"#888",marginBottom:3}}>{f.label}</label>
            {f.options ? (
              <select value={d[f.id]||""} onChange={e=>upd(f.id,e.target.value)} style={s.input}>
                <option value="">Elegir...</option>
                {f.options.map(o=><option key={o}>{o}</option>)}
              </select>
            ) : (
              <input type={f.type||"text"} value={d[f.id]||""} onChange={e=>upd(f.id,e.target.value)} style={s.input} />
            )}
          </div>
        ))}
        <button style={s.btnPrimary} onClick={()=>addRecord(type,d)} disabled={loading}>{loading?"Guardando...":"Guardar ↗"}</button>
      </div>
    );
  }

  function RecordList({ items }) {
    if (!items.length) return <p style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"2rem"}}>Sin registros este mes</p>;
    return items.map(r => (
      <div key={r.id} style={s.row}>
        <div><p style={{fontSize:14,fontWeight:500,margin:0}}>{r.titulo}</p><p style={{fontSize:12,color:"#888",margin:0}}>{r.categoria||r.tipo}{r.persona?` · ${r.persona}`:""} · {r.fecha}</p></div>
        <span style={{fontWeight:500}}>{fmt(r.monto||r.acumulado)}</span>
      </div>
    ));
  }

  if (setupStep !== "ready") return (
    <div style={{maxWidth:480,margin:"0 auto",padding:"2rem"}}>
      <h2 style={{marginBottom:8}}>FinanzasApp</h2>
      <p style={{color:"#888",fontSize:14,marginBottom:"1.5rem"}}>Conectá tu Notion para sincronizar con tu pareja.</p>
      <label style={{display:"block",fontSize:12,color:"#888",marginBottom:4}}>Tu nombre</label>
      <input style={s.input} placeholder="Ej: Lucía" value={userName} onChange={e=>{ setUserName(e.target.value); localStorage.setItem("nf_user",e.target.value); }} />
      <label style={{display:"block",fontSize:12,color:"#888",marginBottom:4}}>Token de Notion (secret_...)</label>
      <input style={s.input} type="password" placeholder="secret_..." value={token} onChange={e=>setToken(e.target.value)} />
      <p style={{fontSize:12,color:"#aaa",marginBottom:12}}>Obtené el token en <a href="https://notion.so/my-integrations" target="_blank" rel="noreferrer">notion.so/my-integrations</a></p>
      <button style={s.btnPrimary} onClick={createDatabases} disabled={!token||loading}>{loading?"Configurando...":"Conectar y crear bases ↗"}</button>
      {msg.text && <p style={{fontSize:13,color:msg.type==="error"?"#c0392b":"#1a7a3c",marginTop:8}}>{msg.text}</p>}
    </div>
  );

  return (
    <div style={s.page}>
      {msg.text && <div style={msg.type==="error"?s.msgError:s.msgSuccess}>{msg.text}</div>}
      <div style={s.header}>
        <h3 style={{margin:0,fontSize:16}}>{ICONS[tab]} {tab}</h3>
        <input type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={{fontSize:12,padding:"4px 8px",border:"1px solid #ddd",borderRadius:6}} />
      </div>

      <div style={{padding:"0 16px"}}>
        {tab==="Inicio" && <>
          <div style={{...s.grid2, marginTop:16}}>
            {[["Ingresos",totalIngresos,"#1a7a3c"],["Gastos",totalGastos,"#c0392b"],["Ahorro",totalAhorros,"#1a5fa8"],["Balance",balance,balance>=0?"#1a7a3c":"#c0392b"]].map(([l,v,c])=>(
              <div key={l} style={s.card}><p style={s.label}>{l}</p><p style={{...s.value,color:c}}>{fmtShort(v)}</p></div>
            ))}
          </div>
          {gastosPorCat.length>0 && <>
            <p style={{fontSize:13,fontWeight:500,margin:"16px 0 8px"}}>Gastos por categoría</p>
            {gastosPorCat.map(({cat,total})=>(
              <div key={cat}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span>{cat}</span><span style={{fontWeight:500}}>{fmt(total)}</span></div>
                <div style={s.bar}><div style={{width:`${Math.round(total/barMax*100)}%`,height:"100%",background:"#e74c3c",borderRadius:4}} /></div>
              </div>
            ))}
          </>}
          <p style={{fontSize:13,fontWeight:500,margin:"16px 0 8px"}}>Proyectos activos</p>
          {records.proyectos.slice(0,3).map(p=>{
            const pct = p.meta>0 ? Math.min(100,Math.round(p.acumulado/p.meta*100)) : 0;
            return <div key={p.id} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span>{p.titulo}</span><span style={{fontWeight:500}}>{pct}%</span></div>
              <div style={s.bar}><div style={{width:`${pct}%`,height:"100%",background:"#2980b9",borderRadius:4}} /></div>
              <p style={{fontSize:11,color:"#aaa",margin:0}}>{fmt(p.acumulado)} de {fmt(p.meta)}</p>
            </div>;
          })}
        </>}

        {tab==="Ingresos" && <><AddForm type="ingresos" fields={[{id:"titulo",label:"Descripción"},{id:"monto",label:"Monto (ARS)",type:"number"},{id:"categoria",label:"Categoría",options:CATEGORIAS_INGRESO},{id:"persona",label:"¿Quién?"},{id:"fecha",label:"Fecha",type:"date"},{id:"nota",label:"Nota"}]}/><RecordList items={filtered(records.ingresos)}/></>}
        {tab==="Gastos" && <><AddForm type="gastos" fields={[{id:"titulo",label:"Descripción"},{id:"monto",label:"Monto (ARS)",type:"number"},{id:"categoria",label:"Categoría",options:CATEGORIAS_GASTO},{id:"persona",label:"¿Quién pagó?"},{id:"fecha",label:"Fecha",type:"date"},{id:"nota",label:"Nota"}]}/><RecordList items={filtered(records.gastos)}/></>}
        {tab==="Ahorro" && <><AddForm type="ahorros" fields={[{id:"titulo",label:"Descripción"},{id:"monto",label:"Monto (ARS)",type:"number"},{id:"persona",label:"¿Quién?"},{id:"fecha",label:"Fecha",type:"date"},{id:"nota",label:"Nota"}]}/><RecordList items={filtered(records.ahorros)}/></>}

        {tab==="Proyectos" && <>
          <AddForm type="proyectos" fields={[{id:"titulo",label:"Nombre"},{id:"meta",label:"Meta (ARS)",type:"number"},{id:"acumulado",label:"Acumulado actual",type:"number"},{id:"tipo",label:"Tipo",options:["Individual","Grupal"]},{id:"fecha",label:"Fecha objetivo",type:"date"},{id:"nota",label:"Nota"}]}/>
          {records.proyectos.map(p=>{
            const pct = p.meta>0 ? Math.min(100,Math.round(p.acumulado/p.meta*100)) : 0;
            return <div key={p.id} style={s.cardBig}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <div><p style={{fontWeight:500,margin:"0 0 4px"}}>{p.titulo}</p><span style={s.tag("#2980b9")}>{p.tipo}</span></div>
                <span style={{fontWeight:500,fontSize:18}}>{pct}%</span>
              </div>
              <div style={{...s.bar,height:10}}><div style={{width:`${pct}%`,height:"100%",background:"#2980b9",borderRadius:4}} /></div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888"}}><span>{fmt(p.acumulado)}</span><span>Meta: {fmt(p.meta)}</span></div>
            </div>;
          })}
        </>}

        {tab==="Inversiones" && <>
          <AddForm type="inversiones" fields={[{id:"titulo",label:"Descripción"},{id:"monto",label:"Monto (ARS)",type:"number"},{id:"tipo",label:"Tipo",options:["Plazo fijo","Acciones","Cripto","FCI","Dólares","Inmueble","Otro"]},{id:"proyectado",label:"Retorno proyectado",type:"number"},{id:"persona",label:"¿Quién?"},{id:"fecha",label:"Fecha",type:"date"},{id:"nota",label:"Nota"}]}/>
          {records.inversiones.map(inv=>(
            <div key={inv.id} style={s.cardBig}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div><p style={{fontWeight:500,margin:"0 0 4px"}}>{inv.titulo}</p><span style={s.tag("#8e44ad")}>{inv.tipo}</span></div>
                <div style={{textAlign:"right"}}><p style={{fontWeight:500,margin:0}}>{fmt(inv.monto)}</p>{inv.proyectado>0&&<p style={{fontSize:12,color:"#1a7a3c",margin:0}}>→ {fmt(inv.proyectado)}</p>}</div>
              </div>
            </div>
          ))}
        </>}

        {tab==="Reportes" && <>
          <div style={{...s.grid2,marginTop:16}}>
            {[["Total ingresos",records.ingresos.reduce((s,r)=>s+r.monto,0)],["Total gastos",records.gastos.reduce((s,r)=>s+r.monto,0)],["Total ahorrado",records.ahorros.reduce((s,r)=>s+r.monto,0)],["Total invertido",records.inversiones.reduce((s,r)=>s+r.monto,0)]].map(([l,v])=>(
              <div key={l} style={s.card}><p style={s.label}>{l} (historial)</p><p style={{...s.value,fontSize:16}}>{fmtShort(v)}</p></div>
            ))}
          </div>
          <p style={{fontSize:13,fontWeight:500,margin:"16px 0 8px"}}>Gastos históricos por categoría</p>
          {CATEGORIAS_GASTO.map(c=>{
            const t = records.gastos.filter(r=>r.categoria===c).reduce((s,r)=>s+r.monto,0);
            if (!t) return null;
            const mx = Math.max(...CATEGORIAS_GASTO.map(cc=>records.gastos.filter(r=>r.categoria===cc).reduce((s,r)=>s+r.monto,0)));
            return <div key={c}><div style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span>{c}</span><span style={{fontWeight:500}}>{fmt(t)}</span></div><div style={s.bar}><div style={{width:`${Math.round(t/mx*100)}%`,height:"100%",background:"#e74c3c",borderRadius:4}} /></div></div>;
          })}
        </>}

        {tab==="Config" && <>
          <div style={{...s.cardBig,marginTop:16}}>
            <p style={{fontWeight:500,marginBottom:12}}>Tu perfil</p>
            <label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Tu nombre</label>
            <input style={s.input} value={userName} onChange={e=>{ setUserName(e.target.value); localStorage.setItem("nf_user",e.target.value); }} />
          </div>
          <div style={s.cardBig}>
            <p style={{fontWeight:500,marginBottom:12}}>Notion</p>
            <p style={{fontSize:13,color:"#888",marginBottom:8}}>Token: ●●●●{token.slice(-4)}</p>
            <button style={s.btn} onClick={()=>loadAll()} disabled={loading}>{loading?"Sincronizando...":"Sincronizar ahora ↗"}</button>
            <button style={{...s.btn,color:"#c0392b",borderColor:"#c0392b"}} onClick={()=>{ localStorage.clear(); window.location.reload(); }}>Desconectar</button>
          </div>
        </>}
      </div>

      <nav style={s.nav}>
        {TABS.map(t=>(
          <button key={t} style={s.navBtn(tab===t)} onClick={()=>setTab(t)}>
            <span style={{fontSize:16}}>{ICONS[t]}</span>
            <span>{t}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}