const jwt = require("jsonwebtoken");

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || "finanzas-secret-2026";

async function kvGet(key) {
  const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
  const d = await r.json();
  if (!d.result) return null;
  let val = d.result;
  if (typeof val === "string") { try { val = JSON.parse(val); } catch {} }
  if (typeof val === "string") { try { val = JSON.parse(val); } catch {} }
  return val;
}

async function kvSet(key, value) {
  const r = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(JSON.stringify(value))
  });
  return r.json();
}

function verifyToken(req) {
  const auth = req.headers.authorization;
  if (!auth) throw new Error("Sin token");
  return jwt.verify(auth.replace("Bearer ", ""), JWT_SECRET);
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  try { verifyToken(req); } catch { return res.status(401).json({ error: "No autorizado" }); }

  const { action, type, record, id } = req.body || {};

  if (action === "getAll") {
    const types = ["ingresos","gastos","ahorros","proyectos","inversiones"];
    const result = {};
    for (const t of types) {
      result[t] = await kvGet(`finanzas:${t}`) || [];
    }
    result.presupuesto = await kvGet("finanzas:presupuesto") || null;
    return res.json({ success: true, data: result });
  }

  if (action === "savePresupuesto") {
    await kvSet("finanzas:presupuesto", record);
    // Verificar que se guardó
    const check = await kvGet("finanzas:presupuesto");
    return res.json({ success: true, saved: check !== null });
  }

  if (action === "getPresupuesto") {
    const data = await kvGet("finanzas:presupuesto");
    return res.json({ success: true, data });
  }

  if (action === "add") {
    const records = await kvGet(`finanzas:${type}`) || [];
    const newRecord = { ...record, id: Date.now().toString() + Math.random().toString(36).slice(2) };
    records.unshift(newRecord);
    await kvSet(`finanzas:${type}`, records);
    return res.json({ success: true, record: newRecord });
  }

  if (action === "update") {
    const records = await kvGet(`finanzas:${type}`) || [];
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ error: "Registro no encontrado" });
    records[idx] = { ...records[idx], ...record, id };
    await kvSet(`finanzas:${type}`, records);
    return res.json({ success: true });
  }

  if (action === "delete") {
    const records = await kvGet(`finanzas:${type}`) || [];
    const filtered = records.filter(r => r.id !== id);
    await kvSet(`finanzas:${type}`, filtered);
    return res.json({ success: true });
  }

  res.status(400).json({ error: "Acción inválida" });
};