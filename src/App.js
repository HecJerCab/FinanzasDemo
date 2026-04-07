import { useState, useEffect, useRef } from "react";

const CAT_GASTO = ["(NB) Necesidades Basicas","(GF) Gastos Fijos","(GH) Gasto Hormiga","(GEX) Gasto Extra","(LZ) Limpieza","(CP) Cuidado Personal","(TP) Transporte-Auto","(GT) Gatos","(CD) Créditos","(SB) Subscripciones"];
const CAT_INGRESO = ["Sueldo","Premio","Extra","Resto del Mes"];
const CAT_INV = ["Plazo fijo","Acciones","Cripto","FCI","Dólares","Inmueble","Otro"];
const CAT_AHORRO = ["Ahorro general","Fondo de emergencia","Vacaciones","Tecnología","Ropa","Otro"];
const MONEDAS = ["ARS","USD"];
const TABS = ["Inicio","Ingresos","Gastos","Ahorro","Proyectos","Inversiones","Presupuesto","Reportes","Config"];
const ICONS = {Inicio:"◉",Ingresos:"↑",Gastos:"↓",Ahorro:"♦",Proyectos:"★",Inversiones:"▲",Presupuesto:"⊞",Reportes:"≡",Config:"⚙"};
const COLORS = ["#6c8ef7","#f7704f","#4fbe8a","#f7c44f","#a77cf7","#f74f9e","#4fd4f7","#50e3c2","#ff6b6b"];
const CAT_COLORS = {"(NB) Necesidades Basicas":"#6c8ef7","(GF) Gastos Fijos":"#a77cf7","(GH) Gasto Hormiga":"#f7c44f","(GEX) Gasto Extra":"#f74f9e","(LZ) Limpieza":"#4fd4f7","(CP) Cuidado Personal":"#4fbe8a","(TP) Transporte-Auto":"#f7704f","(GT) Gatos":"#ff9f43","(CD) Créditos":"#ee5a24","(SB) Subscripciones":"#a29bfe"};

const fmtARS = n => new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n||0);
const fmtUSD = n => new Intl.NumberFormat("es-AR",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(n||0);
const fmt = (n,m) => m==="USD" ? fmtUSD(n) : fmtARS(n);
const fmtShort = (n,m="ARS") => {
  if(!n) return m==="USD"?"US$0":"$0";
  const s = m==="USD"?"US$":"$";
  if(Math.abs(n)>=1000000) return `${s}${(n/1000000).toFixed(1)}M`;
  if(Math.abs(n)>=1000) return `${s}${(n/1000).toFixed(0)}K`;
  return fmt(n,m);
};
const today = () => new Date().toISOString().split("T")[0];
const thisMonth = () => new Date().toISOString().slice(0,7);
const thisWeek = () => { const d=new Date(); d.setDate(d.getDate()-d.getDay()); return d.toISOString().split("T")[0]; };
const thisYear = () => new Date().getFullYear().toString();
const isDesktop = () => window.innerWidth >= 768;

const D = {
  bg:"#0f0f13", surface:"#1a1a24", surface2:"#22223a", border:"#2a2a40",
  text:"#f0f0ff", textMuted:"#7878a0", accent:"#6c8ef7", green:"#4fbe8a",
  red:"#f7704f", yellow:"#f7c44f", purple:"#a77cf7",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${D.bg}; color: ${D.text}; font-family: 'Inter', sans-serif; }
  input, select, textarea { font-family:'Inter',sans-serif; font-size:15px; background:${D.surface2}; color:${D.text}; border:1px solid ${D.border}; border-radius:10px; padding:11px 14px; outline:none; width:100%; transition:border-color .2s; }
  input:focus, select:focus { border-color:${D.accent}; }
  select option { background:${D.surface2}; }
  button { font-family:'Inter',sans-serif; cursor:pointer; }
  .slide-in { animation: slideIn .25s ease; }
  @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
`;

async function apiAuth(body, token) {
  const r = await fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})}, body:JSON.stringify(body) });
  return r.json();
}
async function apiData(body, token) {
  const r = await fetch("/api/data", { method:"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`}, body:JSON.stringify(body) });
  return r.json();
}

function PieChart({data}){
  const ref=useRef();
  useEffect(()=>{
    if(!ref.current||!data?.length||!window.Chart) return;
    if(ref.current._chart) ref.current._chart.destroy();
    ref.current._chart=new window.Chart(ref.current.getContext("2d"),{type:"doughnut",data:{labels:data.map(d=>d.label),datasets:[{data:data.map(d=>d.value),backgroundColor:data.map((d,i)=>d.color||COLORS[i%COLORS.length]),borderWidth:0,hoverOffset:6}]},options:{responsive:false,cutout:"68%",plugins:{legend:{display:false},tooltip:{callbacks:{label:i=>`${i.label}: ${fmtARS(i.raw)}`},backgroundColor:D.surface2,titleColor:D.text,bodyColor:D.textMuted,borderColor:D.border,borderWidth:1}}}});
  },[data]);
  if(!data?.length) return <p style={{color:D.textMuted,fontSize:13,textAlign:"center",padding:"1rem"}}>Sin datos</p>;
  const total=data.reduce((s,d)=>s+d.value,0);
  return(
    <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap",padding:"4px 0"}}>
      <div style={{position:"relative",width:140,height:140,flexShrink:0}}>
        <canvas ref={ref} width={140} height={140}/>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
          <p style={{fontSize:10,color:D.textMuted,margin:0}}>Total</p>
          <p style={{fontSize:13,fontWeight:600,color:D.text,margin:0}}>{fmtShort(total)}</p>
        </div>
      </div>
      <div style={{flex:1,minWidth:140}}>
        {data.map((d,i)=>(
          <div key={d.label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
            <span style={{width:8,height:8,borderRadius:2,background:d.color||COLORS[i%COLORS.length],flexShrink:0,display:"inline-block"}}/>
            <span style={{flex:1,fontSize:12,color:D.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.label}</span>
            <span style={{fontSize:12,fontWeight:500,color:D.text}}>{Math.round(d.value/total*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({data,color=D.accent,moneda="ARS"}){
  const ref=useRef();
  useEffect(()=>{
    if(!ref.current||!data?.length||!window.Chart) return;
    if(ref.current._chart) ref.current._chart.destroy();
    ref.current._chart=new window.Chart(ref.current.getContext("2d"),{type:"bar",data:{labels:data.map(d=>d.label),datasets:[{data:data.map(d=>d.value),backgroundColor:color+"99",borderRadius:8,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:i=>fmt(i.raw,moneda)},backgroundColor:D.surface2,titleColor:D.text,bodyColor:D.textMuted,borderColor:D.border,borderWidth:1}},scales:{y:{ticks:{callback:v=>fmtShort(v,moneda),color:D.textMuted,font:{size:10}},grid:{color:D.border+"55"},border:{display:false}},x:{grid:{display:false},ticks:{color:D.textMuted,font:{size:10},autoSkip:false,maxRotation:45},border:{display:false}}}}});
  },[data]);
  if(!data?.length) return <p style={{color:D.textMuted,fontSize:13,textAlign:"center",padding:"1rem"}}>Sin datos</p>;
  return <div style={{position:"relative",height:180}}><canvas ref={ref}/></div>;
}

function BarChartDoble({ingresos,gastos,moneda="ARS",presupuesto}){
  const ref=useRef();
  const [showPresup,setShowPresup]=useState(false);

  useEffect(()=>{
    if(!ref.current||!window.Chart) return;
    if(ref.current._chart) ref.current._chart.destroy();
    const allLabels=[...new Set([...ingresos.map(d=>d.label),...gastos.map(d=>d.label)])].sort();
    const ingData=allLabels.map(l=>ingresos.find(d=>d.label===l)?.value||0);
    const gasData=allLabels.map(l=>gastos.find(d=>d.label===l)?.value||0);
    const totalPresup=presupuesto?.items?.reduce((s,i)=>s+(+i.monto||0),0)||0;
    const datasets=[
      {label:"Ingresos",data:ingData,backgroundColor:D.green+"99",borderRadius:6,borderSkipped:false},
      {label:"Gastos reales",data:gasData,backgroundColor:D.red+"99",borderRadius:6,borderSkipped:false},
      ...(showPresup&&totalPresup>0?[{label:"Presupuestado",data:allLabels.map(()=>totalPresup),backgroundColor:D.yellow+"99",borderRadius:6,borderSkipped:false,borderDash:[5,5]}]:[])
    ];
    ref.current._chart=new window.Chart(ref.current.getContext("2d"),{
      type:"bar",
      data:{labels:allLabels,datasets},
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          tooltip:{callbacks:{label:i=>`${i.dataset.label}: ${fmt(i.raw,moneda)}`},backgroundColor:D.surface2,titleColor:D.text,bodyColor:D.textMuted,borderColor:D.border,borderWidth:1}
        },
        scales:{
          y:{ticks:{callback:v=>fmtShort(v,moneda),color:D.textMuted,font:{size:10}},grid:{color:D.border+"55"},border:{display:false}},
          x:{grid:{display:false},ticks:{color:D.textMuted,font:{size:10},autoSkip:false,maxRotation:45},border:{display:false}}
        }
      }
    });
  },[ingresos,gastos,showPresup]);

  if(!ingresos?.length&&!gastos?.length) return <p style={{color:D.textMuted,fontSize:13,textAlign:"center",padding:"1rem"}}>Sin datos</p>;

  const totalPresup=presupuesto?.items?.reduce((s,i)=>s+(+i.monto||0),0)||0;

  return(
    <div>
      <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:D.textMuted}}><span style={{width:10,height:10,borderRadius:2,background:D.green,display:"inline-block"}}/> Ingresos</span>
        <span style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:D.textMuted}}><span style={{width:10,height:10,borderRadius:2,background:D.red,display:"inline-block"}}/> Gastos reales</span>
        {totalPresup>0&&(
          <button onClick={()=>setShowPresup(p=>!p)} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,padding:"4px 12px",borderRadius:20,border:`1px solid ${showPresup?D.yellow:D.border}`,background:showPresup?D.yellow+"22":D.surface2,color:showPresup?D.yellow:D.textMuted,fontWeight:showPresup?600:400}}>
            <span style={{width:10,height:10,borderRadius:2,background:D.yellow,display:"inline-block"}}/>
            Presupuestado {showPresup?"✓":""}
          </button>
        )}
        {totalPresup===0&&<span style={{fontSize:11,color:D.textMuted,fontStyle:"italic"}}>Sin presupuesto guardado</span>}
      </div>
      {showPresup&&totalPresup>0&&(
        <div style={{display:"flex",gap:16,marginBottom:10,flexWrap:"wrap"}}>
          <div style={{background:D.surface2,borderRadius:10,padding:"8px 14px",fontSize:12}}>
            <span style={{color:D.textMuted}}>Presupuestado: </span>
            <span style={{color:D.yellow,fontWeight:600}}>{fmt(totalPresup,moneda)}</span>
          </div>
          <div style={{background:D.surface2,borderRadius:10,padding:"8px 14px",fontSize:12}}>
            <span style={{color:D.textMuted}}>Gasto real vs presup: </span>
            {gastos.length>0&&(()=>{
              const realTotal=gastos.reduce((s,d)=>s+d.value,0)/gastos.length;
              const diff=realTotal-totalPresup;
              return <span style={{color:diff>0?D.red:D.green,fontWeight:600}}>{diff>0?"+":""}{fmt(diff,moneda)}</span>;
            })()}
          </div>
        </div>
      )}
      <div style={{position:"relative",height:200}}><canvas ref={ref}/></div>
    </div>
  );
}

function LineChart({data,color=D.accent,moneda="ARS"}){
  const ref=useRef();
  useEffect(()=>{
    if(!ref.current||!data?.length||!window.Chart) return;
    if(ref.current._chart) ref.current._chart.destroy();
    ref.current._chart=new window.Chart(ref.current.getContext("2d"),{type:"line",data:{labels:data.map(d=>d.label),datasets:[{data:data.map(d=>d.value),borderColor:color,backgroundColor:color+"22",tension:0.4,fill:true,pointRadius:5,pointBackgroundColor:color,pointBorderColor:D.bg,pointBorderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:i=>fmt(i.raw,moneda)},backgroundColor:D.surface2,titleColor:D.text,bodyColor:D.textMuted,borderColor:D.border,borderWidth:1}},scales:{y:{ticks:{callback:v=>fmtShort(v,moneda),color:D.textMuted,font:{size:10}},grid:{color:D.border+"55"},border:{display:false}},x:{grid:{display:false},ticks:{color:D.textMuted,font:{size:10}},border:{display:false}}}}});
  },[data]);
  if(!data?.length) return <p style={{color:D.textMuted,fontSize:13,textAlign:"center",padding:"1rem"}}>Sin datos</p>;
  return <div style={{position:"relative",height:180}}><canvas ref={ref}/></div>;
}

function SwipeRow({record,type,onEdit,onDelete,color}){
  const [offset,setOffset]=useState(0);
  const [desktop,setDesktop]=useState(isDesktop());
  const startX=useRef(null);
  const isDragging=useRef(false);
  useEffect(()=>{const h=()=>setDesktop(isDesktop());window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  if(desktop) return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${D.border}33`}}>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:14,fontWeight:500,margin:"0 0 4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{record.titulo}</p>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          {(record.categoria||record.tipo)&&<span style={{fontSize:11,background:(color||D.accent)+"22",color:color||D.accent,padding:"2px 8px",borderRadius:20,fontWeight:500}}>{record.categoria||record.tipo}</span>}
          <span style={{fontSize:12,color:D.textMuted}}>{record.persona?`${record.persona} · `:""}{record.fecha}</span>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:16}}>
        <span style={{fontWeight:600,color:color||D.accent,whiteSpace:"nowrap",fontSize:15}}>{fmt(record.monto||record.acumulado,record.moneda)}</span>
        <button onClick={()=>onEdit(record,type)} style={{background:D.accent+"22",border:`1px solid ${D.accent}44`,borderRadius:8,padding:"6px 10px",color:D.accent,fontSize:13,fontWeight:500}}>✏️ Editar</button>
        <button onClick={()=>onDelete(record.id,type)} style={{background:D.red+"22",border:`1px solid ${D.red}44`,borderRadius:8,padding:"6px 10px",color:D.red,fontSize:13,fontWeight:500}}>🗑️ Borrar</button>
      </div>
    </div>
  );
  const onTouchStart=e=>{startX.current=e.touches[0].clientX;isDragging.current=false;};
  const onTouchMove=e=>{if(startX.current===null) return;const dx=e.touches[0].clientX-startX.current;if(Math.abs(dx)>8) isDragging.current=true;if(dx<0) setOffset(Math.max(dx,-130));else if(offset<0) setOffset(Math.min(0,offset+(dx*0.3)));};
  const onTouchEnd=()=>{if(offset<-50) setOffset(-130);else setOffset(0);startX.current=null;};
  return(
    <div style={{position:"relative",overflow:"hidden",borderBottom:`1px solid ${D.border}33`}}>
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:130,display:"flex"}}>
        <button onTouchEnd={e=>{e.preventDefault();e.stopPropagation();setOffset(0);onEdit(record,type);}} onClick={()=>{setOffset(0);onEdit(record,type);}} style={{flex:1,background:D.accent+"22",color:D.accent,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3}}><span style={{fontSize:18}}>✏️</span><span>Editar</span></button>
        <button onTouchEnd={e=>{e.preventDefault();e.stopPropagation();setOffset(0);onDelete(record.id,type);}} onClick={()=>{setOffset(0);onDelete(record.id,type);}} style={{flex:1,background:D.red+"22",color:D.red,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3}}><span style={{fontSize:18}}>🗑️</span><span>Borrar</span></button>
      </div>
      <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{transform:`translateX(${offset}px)`,transition:startX.current===null?"transform .25s ease":"none",background:D.bg,padding:"12px 0"}} onClick={()=>{if(isDragging.current) return;if(offset!==0) setOffset(0);}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:14,fontWeight:500,margin:"0 0 4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{record.titulo}</p>
            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              {(record.categoria||record.tipo)&&<span style={{fontSize:11,background:(color||D.accent)+"22",color:color||D.accent,padding:"2px 8px",borderRadius:20,fontWeight:500}}>{record.categoria||record.tipo}</span>}
              <span style={{fontSize:11,color:D.textMuted}}>{record.persona?`${record.persona} · `:""}{record.fecha}</span>
            </div>
          </div>
          <span style={{fontWeight:600,color:color||D.accent,marginLeft:12,whiteSpace:"nowrap",fontSize:15}}>{fmt(record.monto||record.acumulado,record.moneda)}</span>
        </div>
        {offset===0&&<p style={{fontSize:10,color:D.border,margin:"3px 0 0",textAlign:"right"}}>← deslizá</p>}
      </div>
    </div>
  );
}

function EditModal({record,type,onSave,onClose}){
  const [d,setD]=useState({...record});
  const upd=(k,v)=>setD(p=>({...p,[k]:v}));
  const catMap={ingresos:CAT_INGRESO,gastos:CAT_GASTO,ahorros:CAT_AHORRO,inversiones:CAT_INV};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:300,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:D.surface,borderRadius:"20px 20px 0 0",padding:"20px 16px 36px",width:"100%",border:`1px solid ${D.border}`,maxHeight:"90vh",overflowY:"auto"}} className="slide-in">
        <div style={{width:40,height:4,background:D.border,borderRadius:4,margin:"0 auto 16px"}}/>
        <p style={{fontWeight:700,fontSize:16,marginBottom:16}}>Editar registro</p>
        {[{id:"titulo",label:"Descripción",type:"text"},{id:"monto",label:"Monto",type:"number"},{id:"moneda",label:"Moneda",options:MONEDAS},{id:"categoria",label:"Categoría",options:catMap[type]||[]},{id:"persona",label:"¿Quién?",type:"text"},{id:"fecha",label:"Fecha",type:"date"},{id:"nota",label:"Nota",type:"text"}].map(f=>(
          <div key={f.id} style={{marginBottom:10}}>
            <label style={{display:"block",fontSize:11,color:D.textMuted,marginBottom:4,fontWeight:500,textTransform:"uppercase",letterSpacing:.3}}>{f.label}</label>
            {f.options?(<select value={d[f.id]||""} onChange={e=>upd(f.id,e.target.value)}>{f.options.map(o=><option key={o}>{o}</option>)}</select>):(<input type={f.type||"text"} value={d[f.id]||""} onChange={e=>upd(f.id,e.target.value)}/>)}
          </div>
        ))}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
          <button onClick={onClose} style={{padding:"13px",borderRadius:12,border:`1px solid ${D.border}`,background:D.surface2,color:D.textMuted,fontSize:14,fontWeight:500}}>Cancelar</button>
          <button onClick={()=>onSave(d)} style={{padding:"13px",borderRadius:12,border:"none",background:D.accent,color:"#fff",fontSize:14,fontWeight:600}}>Guardar ↗</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({onConfirm,onCancel}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}} onClick={onCancel}>
      <div onClick={e=>e.stopPropagation()} style={{background:D.surface,borderRadius:16,padding:"24px",width:"100%",maxWidth:320,border:`1px solid ${D.border}`}} className="slide-in">
        <p style={{fontSize:16,fontWeight:600,marginBottom:8}}>¿Eliminar registro?</p>
        <p style={{fontSize:13,color:D.textMuted,marginBottom:20}}>Esta acción no se puede deshacer.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <button onClick={onCancel} style={{padding:"12px",borderRadius:10,border:`1px solid ${D.border}`,background:D.surface2,color:D.textMuted,fontSize:14,fontWeight:500}}>Cancelar</button>
          <button onClick={onConfirm} style={{padding:"12px",borderRadius:10,border:"none",background:D.red,color:"#fff",fontSize:14,fontWeight:600}}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

function CatAccordion({title,color,items,type,onEdit,onDelete}){
  const [open,setOpen]=useState(false);
  const total=items.reduce((s,r)=>s+r.monto,0);
  if(!items.length) return null;
  return(
    <div style={{background:D.surface,borderRadius:12,marginBottom:8,border:`1px solid ${D.border}`,overflow:"hidden"}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",padding:"12px 14px",cursor:"pointer",gap:10}}>
        <span style={{width:10,height:10,borderRadius:3,background:color,flexShrink:0,display:"inline-block"}}/>
        <span style={{flex:1,fontSize:14,fontWeight:500}}>{title}</span>
        <span style={{fontSize:13,fontWeight:600,color}}>{fmtShort(total)}</span>
        <span style={{fontSize:11,color:D.textMuted,marginLeft:4}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<div style={{borderTop:`1px solid ${D.border}`,padding:"0 14px"}}>
        {items.map(r=><SwipeRow key={r.id} record={r} type={type} onEdit={onEdit} onDelete={onDelete} color={color}/>)}
      </div>}
    </div>
  );
}

function HistorialAportes({proyecto,ahorros,onEdit,onDelete,desktop}){
  const [open,setOpen]=useState(false);
  const aportes=ahorros.filter(a=>a.nota&&a.nota.includes(`Aporte al proyecto: ${proyecto.titulo}`));
  const total=aportes.reduce((s,a)=>s+a.monto,0);
  const btn=desktop?(
    <button onClick={()=>setOpen(o=>!o)} style={{flex:1,padding:"11px",borderRadius:12,border:`1px solid ${D.border}`,background:D.surface2,color:D.textMuted,fontSize:13,fontWeight:500}}>
      📋 {open?"Ocultar":"Historial"}{aportes.length>0&&` (${aportes.length})`}
    </button>
  ):(
    <button onClick={()=>setOpen(o=>!o)} style={{width:42,height:42,borderRadius:10,border:`1px solid ${D.border}`,background:D.surface2,color:D.textMuted,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{open?"🙈":"👁️"}</button>
  );
  return(
    <div>
      {btn}
      {open&&(
        <div style={{marginTop:10,background:D.surface2,borderRadius:12,overflow:"hidden",border:`1px solid ${D.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",borderBottom:`1px solid ${D.border}`}}>
            <p style={{fontSize:12,fontWeight:600,color:D.textMuted,textTransform:"uppercase",letterSpacing:.5,margin:0}}>Historial de aportes</p>
            <p style={{fontSize:12,fontWeight:600,color:D.accent,margin:0}}>{fmt(total,proyecto.moneda)}</p>
          </div>
          {aportes.length===0&&<p style={{fontSize:13,color:D.textMuted,textAlign:"center",padding:"1rem"}}>Sin aportes registrados</p>}
          {aportes.map(a=><SwipeRow key={a.id} record={a} type="ahorros" onEdit={onEdit} onDelete={onDelete} color={D.green}/>)}
        </div>
      )}
    </div>
  );
}

function ProyectosCarrusel({proyectos}){
  const [idx,setIdx]=useState(0);
  const p=proyectos[idx];
  const pct=p.meta>0?Math.min(100,Math.round(p.acumulado/p.meta*100)):0;
  const rem=Math.max(0,p.meta-p.acumulado);
  return(
    <div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`}}>
      {/* Selector de proyecto */}
      <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto",paddingBottom:4}}>
        {proyectos.map((pr,i)=>(
          <button key={pr.id} onClick={()=>setIdx(i)} style={{flexShrink:0,padding:"4px 12px",borderRadius:20,border:`1px solid ${i===idx?D.accent:D.border}`,background:i===idx?D.accent+"22":D.surface2,color:i===idx?D.accent:D.textMuted,fontSize:12,fontWeight:i===idx?600:400,whiteSpace:"nowrap"}}>
            {pr.titulo}
          </button>
        ))}
      </div>

      {/* Info del proyecto seleccionado */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{fontSize:11,background:D.accent+"22",color:D.accent,padding:"3px 10px",borderRadius:20,fontWeight:500}}>{p.tipo||"Grupal"}</span>
        <span style={{fontWeight:700,fontSize:20,color:pct>=100?D.green:D.accent}}>{pct}%</span>
      </div>

      <div style={{marginBottom:6}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:D.textMuted,marginBottom:3}}>
          <span>Avance</span><span style={{color:D.accent,fontWeight:600}}>{fmt(p.acumulado,p.moneda)}</span>
        </div>
        <div style={{background:D.surface2,borderRadius:8,height:10}}>
          <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${D.accent},${D.purple})`,borderRadius:8,transition:"width .5s ease"}}/>
        </div>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginTop:6}}>
        <span style={{color:D.textMuted}}>Meta: <span style={{color:D.text,fontWeight:500}}>{fmt(p.meta,p.moneda)}</span></span>
        <span style={{color:D.textMuted}}>Falta: <span style={{color:D.red,fontWeight:600}}>{fmt(rem,p.moneda)}</span></span>
      </div>

      {p.fecha&&<p style={{fontSize:11,color:D.textMuted,margin:"6px 0 0"}}>📅 {p.fecha}</p>}

      {/* Navegación con flechas */}
      {proyectos.length>1&&(
        <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}>
          <button onClick={()=>setIdx(i=>Math.max(0,i-1))} disabled={idx===0} style={{background:"none",border:`1px solid ${D.border}`,borderRadius:8,padding:"4px 12px",color:idx===0?D.border:D.textMuted,fontSize:13}}>← Ant</button>
          <span style={{fontSize:11,color:D.textMuted,alignSelf:"center"}}>{idx+1} / {proyectos.length}</span>
          <button onClick={()=>setIdx(i=>Math.min(proyectos.length-1,i+1))} disabled={idx===proyectos.length-1} style={{background:"none",border:`1px solid ${D.border}`,borderRadius:8,padding:"4px 12px",color:idx===proyectos.length-1?D.border:D.textMuted,fontSize:13}}>Sig →</button>
        </div>
      )}
    </div>
  );
}

function ProyectoSwipe({proyecto,onEdit,onDelete,children,ahorros,handleEdit,handleDelete}){
  const [offset,setOffset]=useState(0);
  const [desktop,setDesktop]=useState(isDesktop());
  const startX=useRef(null);
  const isDragging=useRef(false);
  useEffect(()=>{const h=()=>setDesktop(isDesktop());window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  if(desktop) return(
    <div>
      {children}
      <div style={{display:"flex",gap:8,padding:"0 16px 12px"}}>
        <button onClick={onEdit} style={{padding:"9px 14px",borderRadius:10,border:`1px solid ${D.accent}44`,background:D.accent+"11",color:D.accent,fontSize:13,fontWeight:500}}>✏️ Editar</button>
        <button onClick={onDelete} style={{padding:"9px 14px",borderRadius:10,border:`1px solid ${D.red}44`,background:D.red+"11",color:D.red,fontSize:13,fontWeight:500}}>🗑️ Eliminar</button>
      </div>
      <div style={{padding:"0 16px 16px",display:"flex",gap:8}}>
        <AportarButton proyecto={proyecto} onAporte={async(monto,desc)=>{const na=(proyecto.acumulado||0)+monto;await apiData({action:"update",type:"proyectos",id:proyecto.id,record:{...proyecto,acumulado:na}},window._nfToken);await apiData({action:"add",type:"ahorros",record:{titulo:desc||`Aporte a ${proyecto.titulo}`,monto,moneda:proyecto.moneda,categoria:"Ahorro general",fecha:today(),persona:window._nfUser,nota:`Aporte al proyecto: ${proyecto.titulo}`}},window._nfToken);window._nfRefresh&&window._nfRefresh();}}/>
        <HistorialAportes proyecto={proyecto} ahorros={ahorros} onEdit={handleEdit} onDelete={handleDelete} desktop={true}/>
      </div>
    </div>
  );
  const onTouchStart=e=>{startX.current=e.touches[0].clientX;isDragging.current=false;};
  const onTouchMove=e=>{if(startX.current===null) return;const dx=e.touches[0].clientX-startX.current;if(Math.abs(dx)>8) isDragging.current=true;if(dx<0) setOffset(Math.max(dx,-130));else if(offset<0) setOffset(Math.min(0,offset+(dx*0.3)));};
  const onTouchEnd=()=>{if(offset<-50) setOffset(-130);else setOffset(0);startX.current=null;};
  return(
    <div style={{position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:130,display:"flex"}}>
        <button onTouchEnd={e=>{e.preventDefault();e.stopPropagation();setOffset(0);onEdit();}} onClick={()=>{setOffset(0);onEdit();}} style={{flex:1,background:D.accent+"22",color:D.accent,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3}}><span style={{fontSize:18}}>✏️</span><span>Editar</span></button>
        <button onTouchEnd={e=>{e.preventDefault();e.stopPropagation();setOffset(0);onDelete();}} onClick={()=>{setOffset(0);onDelete();}} style={{flex:1,background:D.red+"22",color:D.red,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3}}><span style={{fontSize:18}}>🗑️</span><span>Borrar</span></button>
      </div>
      <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{transform:`translateX(${offset}px)`,transition:startX.current===null?"transform .25s ease":"none",background:D.surface}}>
        {children}
        {offset===0&&<p style={{fontSize:10,color:D.border,textAlign:"right",padding:"0 16px 4px"}}>← deslizá para editar</p>}
      </div>
      <div style={{padding:"0 16px 16px",display:"flex",gap:8,alignItems:"center",background:D.surface}}>
        <div style={{flex:1}}><AportarButton proyecto={proyecto} onAporte={async(monto,desc)=>{const na=(proyecto.acumulado||0)+monto;await apiData({action:"update",type:"proyectos",id:proyecto.id,record:{...proyecto,acumulado:na}},window._nfToken);await apiData({action:"add",type:"ahorros",record:{titulo:desc||`Aporte a ${proyecto.titulo}`,monto,moneda:proyecto.moneda,categoria:"Ahorro general",fecha:today(),persona:window._nfUser,nota:`Aporte al proyecto: ${proyecto.titulo}`}},window._nfToken);window._nfRefresh&&window._nfRefresh();}}/></div>
        <HistorialAportes proyecto={proyecto} ahorros={ahorros} onEdit={handleEdit} onDelete={handleDelete} desktop={false}/>
      </div>
    </div>
  );
}

function AportarButton({proyecto,onAporte}){
  const [open,setOpen]=useState(false);
  const [monto,setMonto]=useState("");
  const [desc,setDesc]=useState("");
  return(
    <>
      <button onClick={()=>setOpen(true)} style={{width:"100%",padding:"11px",borderRadius:12,border:`1px solid ${D.green}44`,background:D.green+"11",color:D.green,fontSize:14,fontWeight:600}}>+ Aportar</button>
      {open&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:300,display:"flex",alignItems:"flex-end"}} onClick={()=>setOpen(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:D.surface,borderRadius:"20px 20px 0 0",padding:"20px 16px 36px",width:"100%",border:`1px solid ${D.border}`}} className="slide-in">
            <div style={{width:40,height:4,background:D.border,borderRadius:4,margin:"0 auto 16px"}}/>
            <p style={{fontWeight:700,fontSize:16,marginBottom:4}}>Aportar a "{proyecto.titulo}"</p>
            <p style={{fontSize:12,color:D.textMuted,marginBottom:16}}>Se suma al acumulado y se registra como ahorro.</p>
            <label style={{display:"block",fontSize:11,color:D.textMuted,marginBottom:4,fontWeight:500,textTransform:"uppercase",letterSpacing:.3}}>Monto ({proyecto.moneda})</label>
            <input type="number" placeholder="0" value={monto} onChange={e=>setMonto(e.target.value)} style={{marginBottom:10}}/>
            <label style={{display:"block",fontSize:11,color:D.textMuted,marginBottom:4,fontWeight:500,textTransform:"uppercase",letterSpacing:.3}}>Descripción (opcional)</label>
            <input placeholder={`Aporte a ${proyecto.titulo}`} value={desc} onChange={e=>setDesc(e.target.value)} style={{marginBottom:16}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <button onClick={()=>setOpen(false)} style={{padding:"13px",borderRadius:12,border:`1px solid ${D.border}`,background:D.surface2,color:D.textMuted,fontSize:14,fontWeight:500}}>Cancelar</button>
              <button onClick={()=>{if(!monto||+monto<=0) return;onAporte(+monto,desc);setOpen(false);setMonto("");setDesc("");}} style={{padding:"13px",borderRadius:12,border:"none",background:D.green,color:"#fff",fontSize:14,fontWeight:600}}>Aportar ↗</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function QuickAdd({onSave,onClose,userName}){
  const [type,setType]=useState("gastos");
  const [d,setD]=useState({fecha:today(),persona:userName,moneda:"ARS"});
  const upd=(k,v)=>setD(p=>({...p,[k]:v}));
  const cats={ingresos:CAT_INGRESO,gastos:CAT_GASTO,ahorros:CAT_AHORRO};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:150,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:D.surface,borderRadius:"20px 20px 0 0",padding:"20px 16px 36px",width:"100%",border:`1px solid ${D.border}`}} className="slide-in">
        <div style={{width:40,height:4,background:D.border,borderRadius:4,margin:"0 auto 16px"}}/>
        <p style={{fontWeight:600,fontSize:16,marginBottom:14}}>Carga rápida</p>
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {["gastos","ingresos","ahorros"].map(t=>(<button key={t} onClick={()=>setType(t)} style={{flex:1,padding:"8px",borderRadius:10,border:`1px solid ${type===t?D.accent:D.border}`,background:type===t?D.accent+"22":D.surface2,color:type===t?D.accent:D.textMuted,fontSize:12,fontWeight:500}}>{t==="gastos"?"↓ Gasto":t==="ingresos"?"↑ Ingreso":"♦ Ahorro"}</button>))}
        </div>
        <input placeholder="Descripción" value={d.titulo||""} onChange={e=>upd("titulo",e.target.value)} style={{marginBottom:10}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <input type="number" placeholder="Monto" value={d.monto||""} onChange={e=>upd("monto",e.target.value)}/>
          <select value={d.moneda} onChange={e=>upd("moneda",e.target.value)}>{MONEDAS.map(m=><option key={m}>{m}</option>)}</select>
        </div>
        <select value={d.categoria||""} onChange={e=>upd("categoria",e.target.value)} style={{marginBottom:14}}>
          <option value="">Categoría...</option>
          {(cats[type]||[]).map(c=><option key={c}>{c}</option>)}
        </select>
        <button onClick={()=>{onSave(type,d);onClose();}} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:D.accent,color:"#fff",fontSize:15,fontWeight:600}}>Guardar ↗</button>
      </div>
    </div>
  );
}

// ── PRESUPUESTO ──────────────────────────────────────────────────────────────
function Presupuesto({chartLoaded}){
  const token = window._nfToken || localStorage.getItem("nf_jwt");
  const [ingreso,setIngreso]=useState("");
  const [items,setItems]=useState([]);
  const [newItem,setNewItem]=useState({cat:"",desc:"",monto:""});
  const [saved,setSaved]=useState(false);
  const [loadingP,setLoadingP]=useState(true);
  const [editIdx,setEditIdx]=useState(null);
  const chartRef=useRef();

  useEffect(()=>{
    apiData({action:"getPresupuesto"},token).then(r=>{
      if(r.success&&r.data){
        setIngreso(r.data.ingreso||"");
        setItems(r.data.items||[]);
      }
      setLoadingP(false);
    });
  },[]);

  const guardar=async()=>{
    await apiData({action:"savePresupuesto",record:{ingreso,items}},token);
    setSaved(true);
    setTimeout(()=>setSaved(false),2000);
  };

  const totalGastos=items.reduce((s,i)=>s+(+i.monto||0),0);
  const balance=(+ingreso||0)-totalGastos;

  const pieData=[
    ...CAT_GASTO.map(c=>({label:c,value:items.filter(i=>i.cat===c).reduce((s,i)=>s+(+i.monto||0),0),color:CAT_COLORS[c]})).filter(x=>x.value>0),
    ...(balance>0?[{label:"Disponible",value:balance,color:D.green}]:[])
  ];

  useEffect(()=>{
    if(!chartRef.current||!chartLoaded||!window.Chart||!pieData.length) return;
    if(chartRef.current._chart) chartRef.current._chart.destroy();
    chartRef.current._chart=new window.Chart(chartRef.current.getContext("2d"),{
      type:"doughnut",
      data:{labels:pieData.map(d=>d.label),datasets:[{data:pieData.map(d=>d.value),backgroundColor:pieData.map(d=>d.color),borderWidth:0,hoverOffset:6}]},
      options:{responsive:false,cutout:"65%",plugins:{legend:{display:false},tooltip:{callbacks:{label:i=>`${i.label}: ${fmtARS(i.raw)}`},backgroundColor:D.surface2,titleColor:D.text,bodyColor:D.textMuted}}}
    });
  },[items,ingreso,chartLoaded]);

  if(loadingP) return <p style={{color:D.textMuted,textAlign:"center",padding:"2rem"}}>Cargando presupuesto...</p>;

  return(
    <div style={{padding:"0 0 2rem"}}>
      <div style={{background:D.surface,borderRadius:16,padding:"16px",marginBottom:14,border:`1px solid ${D.border}`}}>
        <label style={{display:"block",fontSize:11,color:D.textMuted,marginBottom:4,fontWeight:500,textTransform:"uppercase",letterSpacing:.3}}>Ingreso del período</label>
        <input type="number" placeholder="Ej: 500000" value={ingreso} onChange={e=>setIngreso(e.target.value)}/>
      </div>

      <div style={{background:D.surface,borderRadius:16,padding:"16px",marginBottom:14,border:`1px solid ${D.border}`}}>
        <p style={{fontWeight:600,fontSize:14,marginBottom:12}}>Agregar ítem de gasto</p>
        <select value={newItem.cat} onChange={e=>setNewItem(p=>({...p,cat:e.target.value}))} style={{marginBottom:10}}>
          <option value="">Categoría...</option>
          {CAT_GASTO.map(c=><option key={c}>{c}</option>)}
        </select>
        <input placeholder="Descripción (opcional)" value={newItem.desc} onChange={e=>setNewItem(p=>({...p,desc:e.target.value}))} style={{marginBottom:10}}/>
        <input type="number" placeholder="Monto" value={newItem.monto} onChange={e=>setNewItem(p=>({...p,monto:e.target.value}))} style={{marginBottom:10}}/>
        <button onClick={()=>{if(!newItem.monto||!newItem.cat) return;setItems(p=>[...p,{...newItem,id:Date.now()}]);setNewItem({cat:"",desc:"",monto:""}); }} style={{width:"100%",padding:"12px",borderRadius:12,border:"none",background:D.accent,color:"#fff",fontSize:14,fontWeight:600}}>+ Agregar ítem</button>
      </div>

      {items.length>0&&<>
        <div style={{background:D.surface,borderRadius:16,padding:"16px",marginBottom:14,border:`1px solid ${D.border}`}}>
          <p style={{fontWeight:600,fontSize:14,marginBottom:12}}>Ítems del presupuesto</p>
          {items.map((it,idx)=>(
            <div key={it.id} style={{borderBottom:`1px solid ${D.border}33`,paddingBottom:8,marginBottom:8}}>
              {editIdx===idx?(
                <div>
                  <select value={it.cat} onChange={e=>setItems(p=>p.map((x,i)=>i===idx?{...x,cat:e.target.value}:x))} style={{marginBottom:6}}><option value="">Categoría...</option>{CAT_GASTO.map(c=><option key={c}>{c}</option>)}</select>
                  <input placeholder="Descripción" value={it.desc} onChange={e=>setItems(p=>p.map((x,i)=>i===idx?{...x,desc:e.target.value}:x))} style={{marginBottom:6}}/>
                  <input type="number" placeholder="Monto" value={it.monto} onChange={e=>setItems(p=>p.map((x,i)=>i===idx?{...x,monto:e.target.value}:x))} style={{marginBottom:6}}/>
                  <button onClick={()=>setEditIdx(null)} style={{width:"100%",padding:"8px",borderRadius:8,border:"none",background:D.green,color:"#fff",fontSize:13,fontWeight:600}}>✓ Listo</button>
                </div>
              ):(
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <p style={{fontSize:13,fontWeight:500,margin:0}}>{it.desc||it.cat}</p>
                    <span style={{fontSize:11,background:(CAT_COLORS[it.cat]||D.accent)+"22",color:CAT_COLORS[it.cat]||D.accent,padding:"2px 8px",borderRadius:20}}>{it.cat}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontWeight:600,color:D.red}}>{fmtARS(+it.monto)}</span>
                    <button onClick={()=>setEditIdx(idx)} style={{background:D.accent+"22",border:"none",borderRadius:6,padding:"4px 8px",color:D.accent,fontSize:12}}>✏️</button>
                    <button onClick={()=>setItems(p=>p.filter((_,i)=>i!==idx))} style={{background:D.red+"22",border:"none",borderRadius:6,padding:"4px 8px",color:D.red,fontSize:12}}>✕</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
          <div style={{background:D.surface,borderRadius:12,padding:"12px",border:`1px solid ${D.border}`,textAlign:"center"}}><p style={{fontSize:10,color:D.textMuted,margin:"0 0 4px",textTransform:"uppercase"}}>Ingreso</p><p style={{fontSize:15,fontWeight:700,color:D.green,margin:0}}>{fmtShort(+ingreso)}</p></div>
          <div style={{background:D.surface,borderRadius:12,padding:"12px",border:`1px solid ${D.border}`,textAlign:"center"}}><p style={{fontSize:10,color:D.textMuted,margin:"0 0 4px",textTransform:"uppercase"}}>Gastos</p><p style={{fontSize:15,fontWeight:700,color:D.red,margin:0}}>{fmtShort(totalGastos)}</p></div>
          <div style={{background:D.surface,borderRadius:12,padding:"12px",border:`1px solid ${D.border}`,textAlign:"center"}}><p style={{fontSize:10,color:D.textMuted,margin:"0 0 4px",textTransform:"uppercase"}}>Disponible</p><p style={{fontSize:15,fontWeight:700,color:balance>=0?D.green:D.red,margin:0}}>{fmtShort(balance)}</p></div>
        </div>

        {chartLoaded&&pieData.length>0&&(
          <div style={{background:D.surface,borderRadius:16,padding:"16px",border:`1px solid ${D.border}`,marginBottom:14}}>
            <p style={{fontSize:12,fontWeight:600,color:D.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Distribución del presupuesto</p>
            <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
              <div style={{position:"relative",width:140,height:140,flexShrink:0}}>
                <canvas ref={chartRef} width={140} height={140}/>
                <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                  <p style={{fontSize:10,color:D.textMuted,margin:0}}>Total</p>
                  <p style={{fontSize:12,fontWeight:600,color:D.text,margin:0}}>{fmtShort(+ingreso)}</p>
                </div>
              </div>
              <div style={{flex:1,minWidth:140}}>
                {pieData.map((d,i)=>(
                  <div key={d.label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <span style={{width:8,height:8,borderRadius:2,background:d.color,flexShrink:0,display:"inline-block"}}/>
                    <span style={{flex:1,fontSize:12,color:D.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.label}</span>
                    <span style={{fontSize:12,fontWeight:500,color:d.label==="Disponible"?D.green:D.text}}>{fmtShort(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <button onClick={guardar} style={{padding:"12px",borderRadius:12,border:"none",background:saved?D.green:D.accent,color:"#fff",fontSize:14,fontWeight:600,transition:"background .3s"}}>{saved?"✓ Guardado":"💾 Guardar modelo"}</button>
          <button onClick={()=>{setItems([]);setIngreso("");}} style={{padding:"12px",borderRadius:12,border:`1px solid ${D.border}`,background:D.surface2,color:D.textMuted,fontSize:14,fontWeight:500}}>🗑️ Limpiar</button>
        </div>
      </>}
    </div>
  );
}

// ── LOGIN SCREENS ─────────────────────────────────────────────────────────────
function LoginScreen({onLogin}){
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [totpCode,setTotpCode]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [showPass,setShowPass]=useState(false);
  const doLogin=async()=>{
    if(!username||!password||!totpCode){setError("Completá todos los campos");return;}
    setLoading(true);setError("");
    const r=await apiAuth({action:"login",username,password,totpCode});
    if(r.error){setError(r.error);setLoading(false);return;}
    localStorage.setItem("nf_jwt",r.token);localStorage.setItem("nf_user",r.username);
    onLogin(r.token,r.username);
  };
  return(
    <div style={{maxWidth:420,margin:"0 auto",padding:"2rem",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center"}}>
      <div style={{textAlign:"center",marginBottom:"2rem"}}>
        <p style={{fontSize:36,marginBottom:8}}>💸</p>
        <h2 style={{fontSize:22,fontWeight:700,marginBottom:6}}>FinanzasApp</h2>
        <p style={{color:D.textMuted,fontSize:14}}>Iniciá sesión para continuar</p>
      </div>
      <div style={{background:D.surface,borderRadius:16,padding:"20px",border:`1px solid ${D.border}`}}>
        <label style={{display:"block",fontSize:11,color:D.textMuted,marginBottom:4,fontWeight:500,textTransform:"uppercase",letterSpacing:.3}}>Usuario</label>
        <input style={{marginBottom:12}} placeholder="Tu usuario" value={username} onChange={e=>setUsername(e.target.value)}/>
        <label style={{display:"block",fontSize:11,color:D.textMuted,marginBottom:4,fontWeight:500,textTransform:"uppercase",letterSpacing:.3}}>Contraseña</label>
        <div style={{position:"relative",marginBottom:12}}>
          <input type={showPass?"text":"password"} placeholder="Tu contraseña" value={password} onChange={e=>setPassword(e.target.value)} style={{paddingRight:44}}/>
          <button onClick={()=>setShowPass(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:D.textMuted,fontSize:18,padding:0}}>{showPass?"🙈":"👁️"}</button>
        </div>
        <label style={{display:"block",fontSize:11,color:D.textMuted,marginBottom:4,fontWeight:500,textTransform:"uppercase",letterSpacing:.3}}>Código Google Authenticator</label>
        <input style={{marginBottom:14}} type="number" placeholder="000000" value={totpCode} onChange={e=>setTotpCode(e.target.value.slice(0,6))}/>
        {error&&<p style={{fontSize:12,color:D.red,marginBottom:10,fontWeight:500}}>{error}</p>}
        <button onClick={doLogin} disabled={loading} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:D.accent,color:"#fff",fontSize:15,fontWeight:600}}>{loading?"Verificando...":"Iniciar sesión ↗"}</button>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const [authState,setAuthState]=useState("loading");
  const [token,setToken]=useState("");
  const [userName,setUserName]=useState("");
  const [tab,setTab]=useState("Inicio");
  const [records,setRecords]=useState({ingresos:[],gastos:[],ahorros:[],proyectos:[],inversiones:[]});
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState({text:"",type:""});
  const [period,setPeriod]=useState("mes");
  const [selectedMonth,setSelectedMonth]=useState(thisMonth());
  const [moneda,setMoneda]=useState("ARS");
  const [chartLoaded,setChartLoaded]=useState(false);
  const [showQuick,setShowQuick]=useState(false);
  const [editRecord,setEditRecord]=useState(null);
  const [editType,setEditType]=useState(null);
  const [deleteInfo,setDeleteInfo]=useState(null);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [desktop,setDesktop]=useState(isDesktop());

  useEffect(()=>{
    const h=()=>setDesktop(isDesktop());
    window.addEventListener("resize",h);
    return()=>window.removeEventListener("resize",h);
  },[]);

  useEffect(()=>{
    const style=document.createElement("style");style.textContent=css;document.head.appendChild(style);
    if(window.Chart){setChartLoaded(true);}else{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";s.onload=()=>setChartLoaded(true);document.head.appendChild(s);}
    const savedToken=localStorage.getItem("nf_jwt");
    const savedUser=localStorage.getItem("nf_user");
    if(savedToken&&savedUser){
      apiAuth({action:"verify"},savedToken).then(r=>{
        if(r.success){setToken(savedToken);setUserName(savedUser);setAuthState("app");loadAll(savedToken);}
        else{localStorage.removeItem("nf_jwt");setAuthState("login");}
      }).catch(()=>setAuthState("login"));
    } else setAuthState("login");
  },[]);

  useEffect(()=>{ window._nfToken=token; window._nfUser=userName; window._nfRefresh=()=>loadAll(); },[token,userName]);

  const showMsg=(text,type="success")=>{setMsg({text,type});setTimeout(()=>setMsg({text:"",type:""}),3000);};
  const handleLogin=(t,u)=>{setToken(t);setUserName(u);setAuthState("app");loadAll(t);};

  const loadAll=async(t=token)=>{
    setLoading(true);
    const r=await apiData({action:"getAll"},t);
    if(r.success) setRecords(r.data);
    else if(r.error==="No autorizado"){localStorage.removeItem("nf_jwt");setAuthState("login");}
    setLoading(false);
  };

  const addRecord=async(type,data)=>{
    setLoading(true);
    const r=await apiData({action:"add",type,record:{...data,monto:+data.monto||0}},token);
    if(r.success){showMsg("✓ Guardado");loadAll();}else showMsg("Error al guardar","error");
    setLoading(false);
  };

  const saveEdit=async(data)=>{
    if(!editRecord||!editType) return;
    setLoading(true);
    if(editType==="ahorros"&&editRecord.nota?.startsWith("Aporte al proyecto: ")){
      const nombre=editRecord.nota.replace("Aporte al proyecto: ","");
      const proy=(records.proyectos||[]).find(p=>p.titulo===nombre);
      if(proy){const diff=(+data.monto||0)-(editRecord.monto||0);await apiData({action:"update",type:"proyectos",id:proy.id,record:{...proy,acumulado:Math.max(0,(proy.acumulado||0)+diff)}},token);}
    }
    await apiData({action:"update",type:editType,id:editRecord.id,record:{...data,monto:+data.monto||0}},token);
    showMsg("✓ Actualizado");setEditRecord(null);setEditType(null);loadAll();setLoading(false);
  };

  const confirmDelete=async()=>{
    if(!deleteInfo) return;
    setLoading(true);
    if(deleteInfo.type==="ahorros"){
      const a=(records.ahorros||[]).find(x=>x.id===deleteInfo.id);
      if(a?.nota?.startsWith("Aporte al proyecto: ")){
        const nombre=a.nota.replace("Aporte al proyecto: ","");
        const proy=(records.proyectos||[]).find(p=>p.titulo===nombre);
        if(proy) await apiData({action:"update",type:"proyectos",id:proy.id,record:{...proy,acumulado:Math.max(0,(proy.acumulado||0)-a.monto)}},token);
      }
    }
    await apiData({action:"delete",type:deleteInfo.type,id:deleteInfo.id},token);
    showMsg("✓ Eliminado");setDeleteInfo(null);loadAll();setLoading(false);
  };

  const handleEdit=(record,type)=>{setEditRecord(record);setEditType(type);};
  const handleDelete=(id,type)=>setDeleteInfo({id,type});

  const filterByPeriod=arr=>arr.filter(r=>{
    if(!r.fecha) return false;
    const f=r.fecha.slice(0,10);
    if(period==="semana") return f>=thisWeek();
    if(period==="mes") return f.startsWith(selectedMonth);
    if(period==="año") return f.startsWith(thisYear());
    return true;
  }).filter(r=>r.moneda===moneda);

  const fl={ingresos:filterByPeriod(records.ingresos||[]),gastos:filterByPeriod(records.gastos||[]),ahorros:filterByPeriod(records.ahorros||[]),inversiones:filterByPeriod(records.inversiones||[])};
  const totalI=fl.ingresos.reduce((s,r)=>s+r.monto,0);
  const totalG=fl.gastos.reduce((s,r)=>s+r.monto,0);
  const totalA=fl.ahorros.reduce((s,r)=>s+r.monto,0);
  const balance=totalI-totalG-totalA;
  const gastosPorCat=CAT_GASTO.map(c=>({label:c,value:fl.gastos.filter(r=>r.categoria===c).reduce((s,r)=>s+r.monto,0),color:CAT_COLORS[c]})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value);
  const ingresosPorCat=CAT_INGRESO.map((c,i)=>({label:c,value:fl.ingresos.filter(r=>r.categoria===c).reduce((s,r)=>s+r.monto,0),color:COLORS[i]})).filter(x=>x.value>0);
  const invPorTipo=CAT_INV.map((c,i)=>({label:c,value:fl.inversiones.filter(r=>r.tipo===c).reduce((s,r)=>s+r.monto,0),color:COLORS[i]})).filter(x=>x.value>0);
  const monthlyData=arr=>{const m={};arr.filter(r=>r.moneda===moneda).forEach(r=>{if(!r.fecha) return;const k=r.fecha.slice(0,7);m[k]=(m[k]||0)+r.monto;});return Object.entries(m).sort().slice(-6).map(([k,v])=>({label:k.slice(5)+"/"+k.slice(2,4),value:v}));};

  function AddForm({type,fields}){
    const [d,setD]=useState({fecha:today(),persona:userName,moneda:"ARS"});
    const upd=(k,v)=>setD(p=>({...p,[k]:v}));
    return(
      <div style={{background:D.surface,borderRadius:16,padding:"16px",marginBottom:14,border:`1px solid ${D.border}`}}>
        <p style={{fontWeight:600,fontSize:14,marginBottom:12}}>Nuevo registro</p>
        {fields.map(f=>(
          <div key={f.id} style={{marginBottom:10}}>
            <label style={{display:"block",fontSize:11,color:D.textMuted,marginBottom:4,fontWeight:500,textTransform:"uppercase",letterSpacing:.3}}>{f.label}</label>
            {f.options?(<select value={d[f.id]||""} onChange={e=>upd(f.id,e.target.value)}><option value="">Elegir...</option>{f.options.map(o=><option key={o}>{o}</option>)}</select>):(<input type={f.type||"text"} value={d[f.id]||""} onChange={e=>upd(f.id,e.target.value)} placeholder={f.placeholder||""}/>)}
          </div>
        ))}
        <button onClick={()=>addRecord(type,d)} disabled={loading} style={{width:"100%",padding:"13px",borderRadius:12,border:"none",background:loading?D.surface2:D.accent,color:loading?D.textMuted:"#fff",fontSize:15,fontWeight:600,marginTop:4}}>{loading?"Guardando...":"Guardar ↗"}</button>
      </div>
    );
  }

  function PeriodFilter(){
    return(
      <div style={{margin:"12px 0"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:8}}>
          {["semana","mes","año","todo"].map(p=>(<button key={p} onClick={()=>setPeriod(p)} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${period===p?D.accent:D.border}`,background:period===p?D.accent+"22":D.surface,color:period===p?D.accent:D.textMuted,fontSize:12,cursor:"pointer",fontWeight:period===p?600:400}}>{p.charAt(0).toUpperCase()+p.slice(1)}</button>))}
          <div style={{marginLeft:"auto",display:"flex",gap:4}}>
            {MONEDAS.map(m=>(<button key={m} onClick={()=>setMoneda(m)} style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${moneda===m?D.yellow:D.border}`,background:moneda===m?D.yellow+"22":D.surface,color:moneda===m?D.yellow:D.textMuted,fontSize:12,cursor:"pointer",fontWeight:moneda===m?600:400}}>{m}</button>))}
          </div>
        </div>
        {period==="mes"&&(<input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} style={{width:"100%",padding:"8px 12px",borderRadius:10,border:`1px solid ${D.accent}`,background:D.surface2,color:D.text,fontSize:14}}/>)}
      </div>
    );
  }

  function StatCard({label,value,color,moneda="ARS",sub}){
    return(<div style={{background:D.surface,borderRadius:14,padding:"14px",border:`1px solid ${D.border}`}}><p style={{fontSize:11,color:D.textMuted,margin:"0 0 6px",fontWeight:500,textTransform:"uppercase",letterSpacing:.5}}>{label}</p><p style={{fontSize:18,fontWeight:700,margin:0,color:color||D.text}}>{fmtShort(value,moneda)}</p>{sub&&<p style={{fontSize:11,color:D.textMuted,margin:"4px 0 0"}}>{sub}</p>}</div>);
  }

  const navItem=(t)=>(
    <button key={t} onClick={()=>{setTab(t);setSidebarOpen(false);}} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"11px 16px",borderRadius:10,border:"none",background:tab===t?D.accent+"22":"transparent",color:tab===t?D.accent:D.textMuted,fontSize:14,fontWeight:tab===t?600:400,textAlign:"left",transition:"background .15s"}}>
      <span style={{fontSize:18,width:24,textAlign:"center"}}>{ICONS[t]}</span>
      {t}
    </button>
  );

  if(authState==="loading") return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}><p style={{fontSize:36}}>💸</p><p style={{color:D.textMuted,fontSize:14}}>Cargando...</p></div>);
  if(authState==="login") return <LoginScreen onLogin={handleLogin}/>;

  return(
    <div style={{display:"flex",minHeight:"100vh",background:D.bg}}>

      {/* SIDEBAR DESKTOP */}
      {desktop&&(
        <div style={{width:220,flexShrink:0,background:D.surface,borderRight:`1px solid ${D.border}`,display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,bottom:0,zIndex:60,padding:"20px 12px"}}>
          <div style={{marginBottom:24,padding:"0 4px"}}>
            <p style={{fontSize:18,fontWeight:700,margin:0}}>💸 Finanzas</p>
            <p style={{fontSize:12,color:D.textMuted,margin:"4px 0 0"}}>👤 {userName}</p>
          </div>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:2}}>
            {TABS.map(t=>navItem(t))}
          </div>
          <button onClick={()=>loadAll()} style={{width:"100%",padding:"10px",borderRadius:10,border:`1px solid ${D.border}`,background:D.surface2,color:D.textMuted,fontSize:13,marginBottom:8}} disabled={loading}>{loading?"⟳ Sync...":"↻ Sincronizar"}</button>
          <button onClick={()=>{localStorage.removeItem("nf_jwt");localStorage.removeItem("nf_user");setAuthState("login");}} style={{width:"100%",padding:"10px",borderRadius:10,border:`1px solid ${D.red}44`,background:D.red+"11",color:D.red,fontSize:13}}>Cerrar sesión</button>
        </div>
      )}

      {/* SIDEBAR MOBILE OVERLAY */}
      {!desktop&&sidebarOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex"}}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.6)"}} onClick={()=>setSidebarOpen(false)}/>
          <div style={{position:"relative",width:260,background:D.surface,borderRight:`1px solid ${D.border}`,display:"flex",flexDirection:"column",padding:"20px 12px",zIndex:201}} className="slide-in">
            <div style={{marginBottom:24,padding:"0 4px"}}>
              <p style={{fontSize:18,fontWeight:700,margin:0}}>💸 Finanzas</p>
              <p style={{fontSize:12,color:D.textMuted,margin:"4px 0 0"}}>👤 {userName}</p>
            </div>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:2}}>
              {TABS.map(t=>navItem(t))}
            </div>
            <button onClick={()=>{localStorage.removeItem("nf_jwt");localStorage.removeItem("nf_user");setAuthState("login");}} style={{width:"100%",padding:"10px",borderRadius:10,border:`1px solid ${D.red}44`,background:D.red+"11",color:D.red,fontSize:13,marginTop:12}}>Cerrar sesión</button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div style={{flex:1,marginLeft:desktop?220:0,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
        {/* HEADER */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderBottom:`1px solid ${D.border}`,position:"sticky",top:0,background:D.bg,zIndex:50}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {!desktop&&(
              <button onClick={()=>setSidebarOpen(o=>!o)} style={{background:"none",border:"none",color:D.text,fontSize:22,padding:0,display:"flex",alignItems:"center"}}>☰</button>
            )}
            <h3 style={{margin:0,fontSize:16,fontWeight:600}}>{ICONS[tab]} {tab}</h3>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>setShowQuick(true)} style={{background:D.accent,border:"none",borderRadius:20,padding:"6px 14px",color:"#fff",fontSize:13,fontWeight:600}}>+ Agregar</button>
            {!desktop&&<button onClick={()=>loadAll()} style={{background:D.surface,border:`1px solid ${D.border}`,borderRadius:8,padding:"6px 10px",color:D.textMuted,fontSize:13}} disabled={loading}>{loading?"⟳":"↻"}</button>}
          </div>
        </div>

        {msg.text&&<div style={{background:msg.type==="error"?D.red+"22":D.green+"22",color:msg.type==="error"?D.red:D.green,padding:"10px 16px",fontSize:13,textAlign:"center",fontWeight:500}}>{msg.text}</div>}

        <div style={{padding:"0 16px",paddingBottom:40,maxWidth:800,width:"100%",margin:"0 auto",boxSizing:"border-box"}}>

          {tab==="Inicio"&&<>
            <PeriodFilter/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
              <StatCard label="Ingresos" value={totalI} color={D.green} moneda={moneda}/>
              <StatCard label="Gastos" value={totalG} color={D.red} moneda={moneda}/>
              <StatCard label="Ahorro" value={totalA} color={D.accent} moneda={moneda}/>
              <StatCard label="Balance" value={balance} color={balance>=0?D.green:D.red} moneda={moneda}/>
            </div>
            {chartLoaded&&gastosPorCat.length>0&&<><p style={{fontSize:12,fontWeight:600,color:D.textMuted,textTransform:"uppercase",letterSpacing:1,margin:"20px 0 10px"}}>Gastos por categoría</p><div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`}}><PieChart data={gastosPorCat}/></div></>}
            <p style={{fontSize:12,fontWeight:600,color:D.textMuted,textTransform:"uppercase",letterSpacing:1,margin:"20px 0 10px"}}>Proyectos activos</p>
           {(records.proyectos||[]).length===0&&<p style={{color:D.textMuted,fontSize:13,textAlign:"center",padding:"1rem"}}>Sin proyectos</p>}
           {(records.proyectos||[]).length>0&&<ProyectosCarrusel proyectos={records.proyectos||[]}/>}</>}

          {tab==="Ingresos"&&<>
            <AddForm type="ingresos" fields={[{id:"titulo",label:"Descripción",placeholder:"Ej: Sueldo"},{id:"monto",label:"Monto",type:"number"},{id:"moneda",label:"Moneda",options:MONEDAS},{id:"categoria",label:"Categoría",options:CAT_INGRESO},{id:"persona",label:"¿Quién?"},{id:"fecha",label:"Fecha",type:"date"},{id:"nota",label:"Nota"}]}/>
            <PeriodFilter/>
            {chartLoaded&&fl.ingresos.length>0&&<><div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`,marginBottom:14}}><PieChart data={ingresosPorCat}/></div><div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`,marginBottom:14}}><LineChart data={monthlyData(records.ingresos||[])} color={D.green} moneda={moneda}/></div></>}
            <p style={{fontSize:12,fontWeight:600,color:D.textMuted,textTransform:"uppercase",letterSpacing:1,margin:"16px 0 8px"}}>Registros</p>
            {fl.ingresos.length===0&&<p style={{color:D.textMuted,fontSize:13,textAlign:"center",padding:"1rem"}}>Sin registros</p>}
            {fl.ingresos.map(r=><SwipeRow key={r.id} record={r} type="ingresos" onEdit={handleEdit} onDelete={handleDelete} color={D.green}/>)}
          </>}

          {tab==="Gastos"&&<>
            <AddForm type="gastos" fields={[{id:"titulo",label:"Descripción",placeholder:"Ej: Supermercado"},{id:"monto",label:"Monto",type:"number"},{id:"moneda",label:"Moneda",options:MONEDAS},{id:"categoria",label:"Categoría",options:CAT_GASTO},{id:"persona",label:"¿Quién pagó?"},{id:"fecha",label:"Fecha",type:"date"},{id:"nota",label:"Nota"}]}/>
            <PeriodFilter/>
            {chartLoaded&&fl.gastos.length>0&&<><div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`,marginBottom:14}}><PieChart data={gastosPorCat}/></div><div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`,marginBottom:14}}><BarChart data={monthlyData(records.gastos||[])} color={D.red} moneda={moneda}/></div></>}
            <p style={{fontSize:12,fontWeight:600,color:D.textMuted,textTransform:"uppercase",letterSpacing:1,margin:"16px 0 8px"}}>Por categoría</p>
            {CAT_GASTO.map(c=><CatAccordion key={c} title={c} color={CAT_COLORS[c]||D.accent} items={fl.gastos.filter(r=>r.categoria===c)} type="gastos" onEdit={handleEdit} onDelete={handleDelete}/>)}
          </>}

          {tab==="Ahorro"&&<>
            <AddForm type="ahorros" fields={[{id:"titulo",label:"Descripción"},{id:"monto",label:"Monto",type:"number"},{id:"moneda",label:"Moneda",options:MONEDAS},{id:"categoria",label:"Categoría",options:CAT_AHORRO},{id:"persona",label:"¿Quién?"},{id:"fecha",label:"Fecha",type:"date"},{id:"nota",label:"Nota"}]}/>
            <PeriodFilter/>
            <div style={{background:D.surface,borderRadius:14,padding:"14px",marginBottom:14,border:`1px solid ${D.border}`,textAlign:"center"}}><p style={{fontSize:11,color:D.textMuted,margin:"0 0 6px",textTransform:"uppercase",letterSpacing:.5}}>Total ahorrado</p><p style={{fontSize:28,fontWeight:700,color:D.accent,margin:0}}>{fmt(totalA,moneda)}</p></div>
            {chartLoaded&&fl.ahorros.length>0&&<div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`,marginBottom:14}}><LineChart data={monthlyData(records.ahorros||[])} color={D.accent} moneda={moneda}/></div>}
            {fl.ahorros.map(r=><SwipeRow key={r.id} record={r} type="ahorros" onEdit={handleEdit} onDelete={handleDelete} color={D.accent}/>)}
          </>}

          {tab==="Proyectos"&&<>
            <AddForm type="proyectos" fields={[{id:"titulo",label:"Nombre"},{id:"meta",label:"Meta",type:"number"},{id:"acumulado",label:"Acumulado inicial",type:"number"},{id:"moneda",label:"Moneda",options:MONEDAS},{id:"tipo",label:"Tipo",options:["Individual","Grupal"]},{id:"fecha",label:"Fecha objetivo",type:"date"},{id:"nota",label:"Nota"}]}/>
            {(records.proyectos||[]).map(p=>{
              const pct=p.meta>0?Math.min(100,Math.round(p.acumulado/p.meta*100)):0;
              const rem=Math.max(0,p.meta-p.acumulado);
              return(
                <div key={p.id} style={{background:D.surface,borderRadius:16,marginBottom:12,border:`1px solid ${D.border}`,overflow:"hidden"}}>
                  <ProyectoSwipe proyecto={p} onEdit={()=>handleEdit(p,"proyectos")} onDelete={()=>handleDelete(p.id,"proyectos")} ahorros={records.ahorros||[]} handleEdit={handleEdit} handleDelete={handleDelete}>
                    <div style={{padding:"16px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                        <div><p style={{fontWeight:600,fontSize:15,margin:"0 0 4px"}}>{p.titulo}</p><span style={{fontSize:11,background:D.accent+"22",color:D.accent,padding:"3px 10px",borderRadius:20,fontWeight:500}}>{p.tipo||"Grupal"}</span></div>
                        <span style={{fontWeight:700,fontSize:22,color:pct>=100?D.green:D.accent}}>{pct}%</span>
                      </div>
                      <div style={{marginBottom:6}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:D.textMuted,marginBottom:3}}><span>Avance</span><span style={{color:D.accent,fontWeight:600}}>{fmt(p.acumulado,p.moneda)}</span></div>
                        <div style={{background:D.surface2,borderRadius:8,height:10}}><div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${D.accent},${D.purple})`,borderRadius:8,transition:"width .5s ease"}}/></div>
                      </div>
                      <div style={{marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:D.textMuted,marginBottom:3}}><span>Meta</span><span style={{color:D.text,fontWeight:600}}>{fmt(p.meta,p.moneda)}</span></div>
                        <div style={{background:D.surface2,borderRadius:8,height:10}}><div style={{width:"100%",height:"100%",background:D.border,borderRadius:8}}/></div>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                        <span style={{color:D.textMuted}}>Falta: <span style={{color:D.red,fontWeight:600}}>{fmt(rem,p.moneda)}</span></span>
                        {p.fecha&&<span style={{color:D.textMuted}}>📅 {p.fecha}</span>}
                      </div>
                    </div>
                  </ProyectoSwipe>
                </div>
              );
            })}
          </>}

          {tab==="Inversiones"&&<>
            <AddForm type="inversiones" fields={[{id:"titulo",label:"Descripción"},{id:"monto",label:"Monto",type:"number"},{id:"moneda",label:"Moneda",options:MONEDAS},{id:"tipo",label:"Tipo",options:CAT_INV},{id:"proyectado",label:"Retorno proyectado",type:"number"},{id:"persona",label:"¿Quién?"},{id:"fecha",label:"Fecha",type:"date"},{id:"nota",label:"Nota"}]}/>
            <PeriodFilter/>
            {chartLoaded&&invPorTipo.length>0&&<div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`,marginBottom:14}}><PieChart data={invPorTipo}/></div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}><StatCard label="Invertido" value={fl.inversiones.reduce((s,r)=>s+r.monto,0)} color={D.purple} moneda={moneda}/><StatCard label="Proyectado" value={fl.inversiones.reduce((s,r)=>s+(r.proyectado||0),0)} color={D.green} moneda={moneda}/></div>
            {CAT_INV.map((c,i)=><CatAccordion key={c} title={c} color={COLORS[i%COLORS.length]} items={fl.inversiones.filter(r=>r.tipo===c)} type="inversiones" onEdit={handleEdit} onDelete={handleDelete}/>)}
          </>}

          {tab==="Presupuesto"&&<Presupuesto chartLoaded={chartLoaded}/>}

          {tab==="Reportes"&&<>
            <PeriodFilter/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
              <StatCard label="Ingresos" value={(records.ingresos||[]).filter(r=>r.moneda===moneda).reduce((s,r)=>s+r.monto,0)} color={D.green} moneda={moneda} sub="historial"/>
              <StatCard label="Gastos" value={(records.gastos||[]).filter(r=>r.moneda===moneda).reduce((s,r)=>s+r.monto,0)} color={D.red} moneda={moneda} sub="historial"/>
              <StatCard label="Ahorrado" value={(records.ahorros||[]).filter(r=>r.moneda===moneda&&!r.nota?.startsWith("Aporte al proyecto")).reduce((s,r)=>s+r.monto,0)} color={D.accent} moneda={moneda} sub="historial"/>
              <StatCard label="En proyectos" value={(records.proyectos||[]).filter(r=>r.moneda===moneda).reduce((s,r)=>s+(r.acumulado||0),0)} color={D.purple} moneda={moneda} sub="acumulado total"/>
            </div>
            {chartLoaded&&<>
              <p style={{fontSize:12,fontWeight:600,color:D.textMuted,textTransform:"uppercase",letterSpacing:1,margin:"20px 0 10px"}}>Ingresos vs Gastos</p>
              <div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`,marginBottom:14}}>
                <BarChartDoble
                  ingresos={monthlyData(records.ingresos||[])}
                  gastos={monthlyData(records.gastos||[])}
                  moneda={moneda}
                  presupuesto={records.presupuesto}
                />
              </div>
              <p style={{fontSize:12,fontWeight:600,color:D.textMuted,textTransform:"uppercase",letterSpacing:1,margin:"16px 0 10px"}}>Distribución de gastos</p>
              <div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`,marginBottom:14}}>
                <PieChart data={CAT_GASTO.map(c=>({label:c,value:(records.gastos||[]).filter(r=>r.categoria===c&&r.moneda===moneda).reduce((s,r)=>s+r.monto,0),color:CAT_COLORS[c]})).filter(x=>x.value>0)}/>
              </div>
            </>}
          </>}

          {tab==="Config"&&<>
            <div style={{background:D.surface,borderRadius:16,padding:"16px",marginTop:16,border:`1px solid ${D.border}`,marginBottom:12}}>
              <p style={{fontWeight:600,marginBottom:4}}>Sesión activa</p>
              <p style={{fontSize:13,color:D.textMuted,marginBottom:12}}>Usuario: <span style={{color:D.text,fontWeight:500}}>{userName}</span></p>
              <button onClick={()=>{localStorage.removeItem("nf_jwt");localStorage.removeItem("nf_user");setAuthState("login");}} style={{width:"100%",padding:"12px",borderRadius:10,border:`1px solid ${D.red}44`,background:D.red+"11",color:D.red,fontSize:14,fontWeight:500}}>Cerrar sesión</button>
            </div>
          </>}

        </div>
      </div>

      {showQuick&&<QuickAdd onSave={addRecord} onClose={()=>setShowQuick(false)} userName={userName}/>}
      {editRecord&&editType&&<EditModal record={editRecord} type={editType} onSave={saveEdit} onClose={()=>{setEditRecord(null);setEditType(null);}}/>}
      {deleteInfo&&<ConfirmModal onConfirm={confirmDelete} onCancel={()=>setDeleteInfo(null)}/>}
    </div>
  );
}